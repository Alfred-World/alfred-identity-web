/**
 * Environment variable validation — fail fast at build/startup instead of silently using wrong defaults.
 *
 * NEXT_PUBLIC_* vars are inlined at build time by Next.js.
 * Server-only vars are validated at first import (runtime).
 */

// ─── Helper ──────────────────────────────────────────────────────────────────

function requireEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(
      `[ENV] Missing required environment variable: ${name}\n` +
        `  → Check your .env file or docker-compose environment section.`
    );
  }

  return value;
}

// ─── Public (build-time, inlined into client bundle) ─────────────────────────

/** Application base URL (e.g. https://sso.example.com) */
export const NEXT_PUBLIC_APP_URL = requireEnv('NEXT_PUBLIC_APP_URL');

/** Gateway base URL (e.g. https://gateway.example.com) */
export const NEXT_PUBLIC_GATEWAY_URL = requireEnv('NEXT_PUBLIC_GATEWAY_URL');

/** OAuth2 client ID for this frontend app */
export const NEXT_PUBLIC_OAUTH_CLIENT_ID = requireEnv('NEXT_PUBLIC_OAUTH_CLIENT_ID');
