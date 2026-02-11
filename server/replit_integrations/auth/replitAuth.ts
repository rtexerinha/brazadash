import * as client from "openid-client";
import { Strategy, type VerifyFunction } from "openid-client/passport";
import crypto from "crypto";

import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";
import { authStorage } from "./storage";

const mobileAuthCodes = new Map<string, { sessionID: string; cookie: string; expiresAt: number }>();

function cleanExpiredCodes() {
  const now = Date.now();
  for (const [code, data] of mobileAuthCodes) {
    if (data.expiresAt < now) {
      mobileAuthCodes.delete(code);
    }
  }
}

const getOidcConfig = memoize(
  async () => {
    return await client.discovery(
      new URL(process.env.ISSUER_URL ?? "https://replit.com/oidc"),
      process.env.REPL_ID!
    );
  },
  { maxAge: 3600 * 1000 }
);

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: true,
      maxAge: sessionTtl,
    },
  });
}

function updateUserSession(
  user: any,
  tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers
) {
  user.claims = tokens.claims();
  user.access_token = tokens.access_token;
  user.refresh_token = tokens.refresh_token;
  user.expires_at = user.claims?.exp;
}

async function upsertUser(claims: any) {
  await authStorage.upsertUser({
    id: claims["sub"],
    email: claims["email"],
    firstName: claims["first_name"],
    lastName: claims["last_name"],
    profileImageUrl: claims["profile_image_url"],
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  const config = await getOidcConfig();

  const verify: VerifyFunction = async (
    tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers,
    verified: passport.AuthenticateCallback
  ) => {
    const user = {};
    updateUserSession(user, tokens);
    await upsertUser(tokens.claims());
    verified(null, user);
  };

  // Keep track of registered strategies
  const registeredStrategies = new Set<string>();

  // Helper function to ensure strategy exists for a domain
  const ensureStrategy = (domain: string) => {
    const strategyName = `replitauth:${domain}`;
    if (!registeredStrategies.has(strategyName)) {
      const strategy = new Strategy(
        {
          name: strategyName,
          config,
          scope: "openid email profile offline_access",
          callbackURL: `https://${domain}/api/callback`,
        },
        verify
      );
      passport.use(strategy);
      registeredStrategies.add(strategyName);
    }
  };

  passport.serializeUser((user: Express.User, cb) => cb(null, user));
  passport.deserializeUser((user: Express.User, cb) => cb(null, user));

  app.get("/api/login", (req, res, next) => {
    const startAuth = () => {
      ensureStrategy(req.hostname);
      const originalRedirect = res.redirect.bind(res);
      (res as any).redirect = function (statusOrUrl: number | string, url?: string) {
        const redirectUrl = typeof statusOrUrl === "string" ? statusOrUrl : url!;
        const statusCode = typeof statusOrUrl === "number" ? statusOrUrl : 302;
        req.session.save((err) => {
          if (err) {
            console.error("Session save before redirect error:", err);
          }
          originalRedirect(statusCode, redirectUrl);
        });
      };
      passport.authenticate(`replitauth:${req.hostname}`, {
        prompt: "login consent",
        scope: ["openid", "email", "profile", "offline_access"],
      })(req, res, next);
    };

    if (req.isAuthenticated()) {
      req.logout(() => {
        req.session.regenerate((err) => {
          if (err) {
            console.error("Session regenerate error:", err);
          }
          startAuth();
        });
      });
    } else {
      startAuth();
    }
  });

  app.get("/api/callback", (req, res, next) => {
    ensureStrategy(req.hostname);
    passport.authenticate(`replitauth:${req.hostname}`, (err: any, user: any, info: any) => {
      if (err) {
        console.error("Auth callback error:", err.message || err);
        console.error("Auth callback error details:", JSON.stringify(err, Object.getOwnPropertyNames(err)));
        return res.redirect("/?auth_error=callback_failed");
      }
      if (!user) {
        console.error("Auth callback: no user returned. Info:", JSON.stringify(info));
        console.error("Auth callback: session ID:", req.sessionID);
        console.error("Auth callback: session keys:", Object.keys(req.session || {}));
        return res.redirect("/?auth_error=no_user");
      }
      req.logIn(user, (loginErr) => {
        if (loginErr) {
          console.error("Auth login error:", loginErr);
          return res.redirect("/?auth_error=login_failed");
        }
        return res.redirect("/");
      });
    })(req, res, next);
  });

  app.get("/api/logout", (req, res) => {
    const protocol = req.headers["x-forwarded-proto"] || req.protocol;
    req.logout(() => {
      req.session.destroy(() => {
        res.redirect(
          client.buildEndSessionUrl(config, {
            client_id: process.env.REPL_ID!,
            post_logout_redirect_uri: `${protocol}://${req.hostname}`,
          }).href
        );
      });
    });
  });

  app.get("/api/switch-account", (req, res) => {
    const protocol = req.headers["x-forwarded-proto"] || req.protocol;
    const baseUrl = `${protocol}://${req.hostname}`;

    const doSwitch = () => {
      const endSessionUrl = client.buildEndSessionUrl(config, {
        client_id: process.env.REPL_ID!,
        post_logout_redirect_uri: `${baseUrl}/api/login`,
      }).href;
      res.redirect(endSessionUrl);
    };

    if (req.isAuthenticated()) {
      req.logout(() => {
        req.session.destroy(() => {
          doSwitch();
        });
      });
    } else {
      doSwitch();
    }
  });

  const ensureMobileStrategy = (domain: string) => {
    const strategyName = `replitauth-mobile:${domain}`;
    if (!registeredStrategies.has(strategyName)) {
      const strategy = new Strategy(
        {
          name: strategyName,
          config,
          scope: "openid email profile offline_access",
          callbackURL: `https://${domain}/api/mobile/callback`,
        },
        verify
      );
      passport.use(strategy);
      registeredStrategies.add(strategyName);
    }
  };

  app.get("/api/mobile/login", (req, res, next) => {
    const startAuth = () => {
      ensureMobileStrategy(req.hostname);
      const originalRedirect = res.redirect.bind(res);
      (res as any).redirect = function (statusOrUrl: number | string, url?: string) {
        const redirectUrl = typeof statusOrUrl === "string" ? statusOrUrl : url!;
        const statusCode = typeof statusOrUrl === "number" ? statusOrUrl : 302;
        req.session.save((err) => {
          if (err) {
            console.error("Mobile session save before redirect error:", err);
          }
          originalRedirect(statusCode, redirectUrl);
        });
      };
      passport.authenticate(`replitauth-mobile:${req.hostname}`, {
        prompt: "login consent",
        scope: ["openid", "email", "profile", "offline_access"],
      })(req, res, next);
    };

    if (req.isAuthenticated()) {
      req.logout(() => {
        req.session.regenerate((err) => {
          if (err) {
            console.error("Mobile session regenerate error:", err);
          }
          startAuth();
        });
      });
    } else {
      startAuth();
    }
  });

  app.get("/api/mobile/callback", (req, res, next) => {
    ensureMobileStrategy(req.hostname);
    passport.authenticate(`replitauth-mobile:${req.hostname}`, (err: any, user: any, info: any) => {
      if (err) {
        console.error("Mobile auth callback error:", err.message || err);
        console.error("Mobile auth callback error details:", JSON.stringify(err, Object.getOwnPropertyNames(err)));
        return res.redirect("brazadash://oauth-callback?error=callback_failed");
      }
      if (!user) {
        console.error("Mobile auth callback: no user returned. Info:", JSON.stringify(info));
        console.error("Mobile auth callback: session ID:", req.sessionID);
        console.error("Mobile auth callback: session keys:", Object.keys(req.session || {}));
        return res.redirect("brazadash://oauth-callback?error=no_user");
      }
      req.logIn(user, (loginErr) => {
        if (loginErr) {
          console.error("Mobile auth login error:", loginErr);
          return res.redirect("brazadash://oauth-callback?error=login_failed");
        }
        cleanExpiredCodes();
        const authCode = crypto.randomBytes(32).toString("hex");
        let sessionCookie = "";
        const cookies = res.getHeader("set-cookie");
        if (cookies) {
          const cookieArray = Array.isArray(cookies) ? cookies : [cookies as string];
          const connectCookie = cookieArray.find((c) => c.toString().startsWith("connect.sid="));
          if (connectCookie) {
            sessionCookie = connectCookie.toString().split(";")[0];
          }
        }
        if (!sessionCookie && req.headers.cookie) {
          const match = req.headers.cookie.match(/connect\.sid=([^;]+)/);
          if (match) {
            sessionCookie = `connect.sid=${match[1]}`;
          }
        }
        mobileAuthCodes.set(authCode, {
          sessionID: req.sessionID,
          cookie: sessionCookie,
          expiresAt: Date.now() + 60 * 1000,
        });
        return res.redirect(`brazadash://oauth-callback?code=${authCode}`);
      });
    })(req, res, next);
  });

  app.post("/api/mobile/exchange-code", (req, res) => {
    const { code } = req.body;
    if (!code || typeof code !== "string") {
      return res.status(400).json({ error: "Missing auth code" });
    }
    cleanExpiredCodes();
    const data = mobileAuthCodes.get(code);
    if (!data) {
      return res.status(401).json({ error: "Invalid or expired auth code" });
    }
    mobileAuthCodes.delete(code);
    res.json({ session: data.cookie });
  });

  app.get("/api/mobile/switch-account", (req, res) => {
    const protocol = req.headers["x-forwarded-proto"] || req.protocol;
    const baseUrl = `${protocol}://${req.hostname}`;

    const doSwitch = () => {
      const endSessionUrl = client.buildEndSessionUrl(config, {
        client_id: process.env.REPL_ID!,
        post_logout_redirect_uri: `${baseUrl}/api/mobile/login`,
      }).href;
      res.redirect(endSessionUrl);
    };

    if (req.isAuthenticated()) {
      req.logout(() => {
        req.session.destroy(() => {
          doSwitch();
        });
      });
    } else {
      doSwitch();
    }
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  const user = req.user as any;

  if (!req.isAuthenticated() || !user.expires_at) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const now = Math.floor(Date.now() / 1000);
  if (now <= user.expires_at) {
    return next();
  }

  const refreshToken = user.refresh_token;
  if (!refreshToken) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  try {
    const config = await getOidcConfig();
    const tokenResponse = await client.refreshTokenGrant(config, refreshToken);
    updateUserSession(user, tokenResponse);
    return next();
  } catch (error) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
};
