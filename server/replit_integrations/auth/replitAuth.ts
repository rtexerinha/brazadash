import * as client from "openid-client";
import { Strategy, type VerifyFunction } from "openid-client/passport";
import crypto from "crypto";
import { createRequire } from "module";
const _require = createRequire(import.meta.url);
const cookieSignature = _require("cookie-signature");

import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";
import { authStorage } from "./storage";

const mobileAuthCodes = new Map<string, { sessionID: string; cookie: string; userData: any; expiresAt: number }>();

function cleanExpiredCodes() {
  const now = Date.now();
  Array.from(mobileAuthCodes.entries()).forEach(([code, data]) => {
    if (data.expiresAt < now) {
      mobileAuthCodes.delete(code);
    }
  });
}

const getOidcConfig = memoize(
  async () => {
    const issuerUrl = process.env.AUTH_ISSUER_URL || process.env.ISSUER_URL || "https://replit.com/oidc";
    const clientId = process.env.AUTH_CLIENT_ID || process.env.REPL_ID;
    const clientSecret = process.env.AUTH_CLIENT_SECRET;

    if (!clientId) {
      throw new Error("AUTH_CLIENT_ID or REPL_ID must be set for OIDC discovery");
    }

    return await client.discovery(
      new URL(issuerUrl),
      clientId,
      clientSecret
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
      secure: process.env.NODE_ENV === "production" && process.env.AUTH_CALLBACK_URL?.startsWith("https"),
      maxAge: sessionTtl,
      sameSite: "lax",
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
    firstName: claims["first_name"] || claims["given_name"],
    lastName: claims["last_name"] || claims["family_name"],
    profileImageUrl: claims["profile_image_url"] || claims["picture"],
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use((req, _res, next) => {
    const mobileSession = req.headers["x-session-cookie"] as string;
    if (mobileSession) {
      if (!req.headers.cookie || !req.headers.cookie.includes("connect.sid")) {
        req.headers.cookie = mobileSession + (req.headers.cookie ? "; " + req.headers.cookie : "");
      }
    }
    next();
  });
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
  const ensureStrategy = (req: any) => {
    const domain = req.hostname;
    const protocol = req.headers["x-forwarded-proto"] || req.protocol;
    const strategyName = `oidcauth:${domain}`;
    if (!registeredStrategies.has(strategyName)) {
      const strategy = new Strategy(
        {
          name: strategyName,
          config,
          scope: "openid email profile",
          callbackURL: process.env.AUTH_CALLBACK_URL || `${protocol}://${domain}/api/callback`,
        },
        verify
      );
      passport.use(strategy);
      registeredStrategies.add(strategyName);
    }
    return strategyName;
  };

  passport.serializeUser((user: Express.User, cb) => cb(null, user));
  passport.deserializeUser((user: Express.User, cb) => cb(null, user));

  app.get("/api/login", (req, res, next) => {
    const startAuth = () => {
      const strategyName = ensureStrategy(req);
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
      passport.authenticate(strategyName, {
        prompt: "consent",
        scope: "openid email profile",
      } as any)(req, res, next);
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
    const strategyName = ensureStrategy(req);
    passport.authenticate(strategyName, (err: any, user: any, info: any) => {
      if (err) {
        console.error("Auth callback error:", err.message || err);
        return res.redirect("/?auth_error=callback_failed");
      }
      if (!user) {
        console.error("Auth callback: no user returned. Info:", JSON.stringify(info));
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
        try {
          res.redirect(
            client.buildEndSessionUrl(config, {
              client_id: process.env.AUTH_CLIENT_ID || process.env.REPL_ID!,
              post_logout_redirect_uri: `${protocol}://${req.hostname}`,
            }).href
          );
        } catch (e) {
          // If the provider doesn't support end_session_endpoint (like Google),
          // logout locally and go home.
          res.redirect("/");
        }
      });
    });
  });

  app.get("/api/switch-account", (req, res) => {
    const protocol = req.headers["x-forwarded-proto"] || req.protocol;
    const baseUrl = `${protocol}://${req.hostname}`;

    const doSwitch = () => {
      try {
        const endSessionUrl = client.buildEndSessionUrl(config, {
          client_id: process.env.AUTH_CLIENT_ID || process.env.REPL_ID!,
          post_logout_redirect_uri: `${baseUrl}/api/login`,
        }).href;
        res.redirect(endSessionUrl);
      } catch (e) {
        res.redirect("/api/login");
      }
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

  const ensureMobileStrategy = (req: any) => {
    const domain = req.hostname;
    const protocol = req.headers["x-forwarded-proto"] || req.protocol;
    const strategyName = `oidcauth-mobile:${domain}`;
    if (!registeredStrategies.has(strategyName)) {
      const strategy = new Strategy(
        {
          name: strategyName,
          config,
          scope: "openid email profile",
          callbackURL: process.env.AUTH_MOBILE_CALLBACK_URL || `${protocol}://${domain}/api/mobile/callback`,
        },
        verify
      );
      passport.use(strategy);
      registeredStrategies.add(strategyName);
    }
    return strategyName;
  };

  app.get("/api/mobile/login", (req, res, next) => {
    const startAuth = () => {
      const strategyName = ensureMobileStrategy(req);
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
      passport.authenticate(strategyName, {
        prompt: "consent",
        scope: "openid email profile",
      } as any)(req, res, next);
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
    const strategyName = ensureMobileStrategy(req);
    passport.authenticate(strategyName, (err: any, user: any, info: any) => {
      if (err) {
        console.error("Mobile auth callback error:", err.message || err);
        return res.redirect("brazadash://oauth-callback?error=callback_failed");
      }
      if (!user) {
        console.error("Mobile auth callback: no user returned. Info:", JSON.stringify(info));
        return res.redirect("brazadash://oauth-callback?error=no_user");
      }
      cleanExpiredCodes();
      const authCode = crypto.randomBytes(32).toString("hex");
      mobileAuthCodes.set(authCode, {
        sessionID: "",
        cookie: "",
        userData: user,
        expiresAt: Date.now() + 120 * 1000,
      });
      return res.redirect(`brazadash://oauth-callback?code=${authCode}`);
    })(req, res, next);
  });

  app.post("/api/mobile/exchange-code", (req: any, res) => {
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
    (req.session as any).passport = { user: data.userData };
    req.session.save((saveErr: any) => {
      if (saveErr) {
        console.error("Mobile exchange-code: session save failed:", saveErr);
        return res.status(500).json({ error: "Failed to save session" });
      }
      const signedSid = "s:" + cookieSignature.sign(req.sessionID, process.env.SESSION_SECRET!);
      const sessionCookie = `connect.sid=${encodeURIComponent(signedSid)}`;
      res.json({ session: sessionCookie });
    });
  });

  app.get("/api/mobile/switch-account", (req, res) => {
    const protocol = req.headers["x-forwarded-proto"] || req.protocol;
    const baseUrl = `${protocol}://${req.hostname}`;

    const doSwitch = () => {
      try {
        const endSessionUrl = client.buildEndSessionUrl(config, {
          client_id: process.env.AUTH_CLIENT_ID || process.env.REPL_ID!,
          post_logout_redirect_uri: `${baseUrl}/api/mobile/login`,
        }).href;
        res.redirect(endSessionUrl);
      } catch (e) {
        res.redirect("/api/mobile/login");
      }
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
  if (!req.isAuthenticated() || !user?.expires_at) {
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
  } catch (error: any) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
};
