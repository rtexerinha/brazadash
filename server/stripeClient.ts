import Stripe from 'stripe';

let connectionSettings: any;
let cachedCredentials: { publishableKey: string; secretKey: string } | null = null;
let credentialsCacheTime = 0;
const CREDENTIALS_CACHE_TTL = 5 * 60 * 1000;

async function fetchCredentialsForEnvironment(hostname: string, xReplitToken: string, environment: string) {
  const url = new URL(`https://${hostname}/api/v2/connection`);
  url.searchParams.set('include_secrets', 'true');
  url.searchParams.set('connector_names', 'stripe');
  url.searchParams.set('environment', environment);

  const response = await fetch(url.toString(), {
    headers: {
      'Accept': 'application/json',
      'X_REPLIT_TOKEN': xReplitToken
    }
  });

  const data = await response.json();
  const conn = data.items?.[0];

  if (conn?.settings?.publishable && conn?.settings?.secret) {
    return {
      publishableKey: conn.settings.publishable,
      secretKey: conn.settings.secret,
    };
  }
  return null;
}

async function getCredentials() {
  if (cachedCredentials && Date.now() - credentialsCacheTime < CREDENTIALS_CACHE_TTL) {
    return cachedCredentials;
  }

  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY
    ? 'repl ' + process.env.REPL_IDENTITY
    : process.env.WEB_REPL_RENEWAL
      ? 'depl ' + process.env.WEB_REPL_RENEWAL
      : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  const isProduction = process.env.REPLIT_DEPLOYMENT === '1';
  const primaryEnv = isProduction ? 'production' : 'development';

  let creds = await fetchCredentialsForEnvironment(hostname!, xReplitToken, primaryEnv);

  if (!creds && isProduction) {
    console.log('Production Stripe credentials not found, falling back to development credentials');
    creds = await fetchCredentialsForEnvironment(hostname!, xReplitToken, 'development');
  }

  if (!creds) {
    throw new Error(`Stripe connection not found for ${primaryEnv}`);
  }

  cachedCredentials = creds;
  credentialsCacheTime = Date.now();

  return cachedCredentials;
}

export async function getUncachableStripeClient() {
  const { secretKey } = await getCredentials();

  return new Stripe(secretKey, {
    apiVersion: '2025-11-17.clover',
  });
}

export async function getStripePublishableKey() {
  const { publishableKey } = await getCredentials();
  return publishableKey;
}

export async function getStripeSecretKey() {
  const { secretKey } = await getCredentials();
  return secretKey;
}

let stripeSync: any = null;

export async function getStripeSync() {
  if (!stripeSync) {
    const { StripeSync } = await import('stripe-replit-sync');
    const secretKey = await getStripeSecretKey();

    stripeSync = new StripeSync({
      poolConfig: {
        connectionString: process.env.DATABASE_URL!,
        max: 2,
      },
      stripeSecretKey: secretKey,
    });
  }
  return stripeSync;
}
