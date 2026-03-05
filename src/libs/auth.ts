// Third-party Imports
import CredentialProvider from 'next-auth/providers/credentials';
import type { NextAuthOptions } from 'next-auth';
import type { JWT } from 'next-auth/jwt';

// Generated API
import { postIdentityAuthSsoLogin } from '@/generated';
import type { TokenResponseDto } from '@/generated';

// Disable SSL verification for self-signed certificates in development
if (process.env.NODE_ENV === 'development') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

// ── URL helpers ──────────────────────────────────────────────────────────────
// Public URL  → used by the **browser** (authorization redirect, issuer claim)
// Internal URL → used by the **Next.js server** (token exchange, userinfo, jwks)
//   Falls back to the public URL when INTERNAL_GATEWAY_URL is not set (local dev).
const PUBLIC_GATEWAY_URL = process.env.NEXT_PUBLIC_GATEWAY_URL!;
const SERVER_GATEWAY_URL = process.env.INTERNAL_GATEWAY_URL || PUBLIC_GATEWAY_URL;

// Helper to decode JWT without external library validation (we trust our backend)
function parseJwt(token: string) {
  try {
    return JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
  } catch (_e) {
    return null;
  }
}

/**
 * Refresh access token using refresh_token grant
 */
async function refreshAccessToken(token: JWT): Promise<JWT> {
  try {
    if (!token.refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await fetch(`${SERVER_GATEWAY_URL}/connect/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        client_id: process.env.OIDC_CLIENT_ID!,
        client_secret: process.env.OIDC_CLIENT_SECRET!,
        grant_type: 'refresh_token',
        refresh_token: token.refreshToken as string
      })
    });

    // Parse body safely — an empty or non-JSON response (network hiccup, 502, etc.)
    // should be treated as transient, not as a permanent OAuth rejection.
    const text = await response.text();
    let refreshedTokens: TokenResponseDto;

    try {
      refreshedTokens = JSON.parse(text);
    } catch {
      // Transient error — return token as-is (no error flag) so next request retries
      return token;
    }

    if (!response.ok) {
      throw refreshedTokens;
    }

    const accessToken = refreshedTokens.access_token ?? undefined;
    const refreshToken = refreshedTokens.refresh_token ?? undefined;
    const expiresIn = refreshedTokens.expires_in ?? 900;

    // Calculate new expiresAt
    let expiresAt = Date.now() / 1000 + expiresIn;

    if (accessToken) {
      const decoded = parseJwt(accessToken);

      if (decoded && decoded.exp) {
        expiresAt = decoded.exp;
      }
    }

    return {
      ...token,
      accessToken: accessToken,
      refreshToken: refreshToken ?? token.refreshToken,
      expiresAt: expiresAt,
      error: undefined
    };
  } catch (error) {
    const isOAuthError =
      error !== null &&
      typeof error === 'object' &&
      'error' in (error as object);

    return {
      ...token,
      error: isOAuthError ? 'RefreshAccessTokenError' : undefined,
    };
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    // OAuth provider for OIDC flow — gets access/refresh tokens via Authorization Code + PKCE
    {
      id: 'sso-oauth',
      name: 'SSO OAuth',
      type: 'oauth',

      // ── Browser-facing (public URL) ──────────────────────────────────────
      authorization: {
        url: `${PUBLIC_GATEWAY_URL}/connect/authorize`,
        params: { scope: 'openid profile email offline_access' }
      },

      // ── Server-facing (internal URL) — token exchange / userinfo / JWKS ──
      token: `${SERVER_GATEWAY_URL}/connect/token`,
      userinfo: `${SERVER_GATEWAY_URL}/connect/userinfo`,
      jwks_endpoint: `${SERVER_GATEWAY_URL}/.well-known/jwks.json`,

      // Issuer MUST match the `iss` claim in the ID token which uses the public URL
      issuer: PUBLIC_GATEWAY_URL,

      idToken: true,
      checks: ['pkce', 'state'],
      clientId: process.env.OIDC_CLIENT_ID!,
      clientSecret: process.env.OIDC_CLIENT_SECRET!,
      client: {
        token_endpoint_auth_method: 'client_secret_post'
      },
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture
        };
      }
    },

    // Credentials provider for direct login (will start OAuth flow after)
    CredentialProvider({
      id: 'credentials',
      name: 'Credentials',
      type: 'credentials',
      credentials: {},
      async authorize(credentials) {
        const { email, password, returnUrl } = credentials as {
          email: string;
          password: string;
          returnUrl?: string;
        };

        try {
          // Call SSO Login API
          const response = await postIdentityAuthSsoLogin({
            identity: email,
            password: password,
            rememberMe: true,
            returnUrl: returnUrl
          });

          if (!response.success || !response.result) {
            throw new Error(response.message || 'Login failed');
          }

          const { user, returnUrl: exchangeUrl } = response.result;

          if (!user) {
            throw new Error('User data not found');
          }

          // Return user with exchangeUrl for client-side redirect
          return {
            id: user.id?.toString() || '',
            name: user.fullName || user.userName || '',
            email: user.email || email,
            image: null,
            exchangeUrl: exchangeUrl // Client will redirect here
          };
        } catch (e: unknown) {
          throw new Error(e instanceof Error ? e.message : 'Login failed');
        }
      }
    }),

    // SSO Session provider for silent authentication when user already logged in elsewhere
    CredentialProvider({
      id: 'sso-session',
      name: 'SSO Session',
      type: 'credentials',
      credentials: {
        userId: { label: 'User ID', type: 'text' },
        email: { label: 'Email', type: 'text' },
        name: { label: 'Name', type: 'text' }
      },
      async authorize(credentials) {
        // This is called when we have a valid SSO session from Gateway
        if (!credentials?.userId || !credentials?.email) {
          return null;
        }

        return {
          id: credentials.userId as string,
          email: credentials.email as string,
          name: (credentials.name as string) || credentials.email
        };
      }
    })
  ],

  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60 // 30 days
  },

  pages: {
    signIn: '/login',
    error: '/login' // Show OIDC errors on the login page with query param ?error=...
  },

  // Use secure cookies for HTTPS
  useSecureCookies: true,

  callbacks: {
    async redirect({ url, baseUrl }) {
      // Allow redirects to the Gateway URL (needed for cross-app SSO flow)
      // After SSO login, identity-web needs to redirect to Gateway's /connect/authorize
      // to complete the OIDC flow for the calling app (e.g., core-web)
      if (url.startsWith(PUBLIC_GATEWAY_URL)) return url;
      if (SERVER_GATEWAY_URL !== PUBLIC_GATEWAY_URL && url.startsWith(SERVER_GATEWAY_URL)) return url;

      // Allow relative URLs
      if (url.startsWith('/')) return `${baseUrl}${url}`;

      // Allow same-origin URLs
      try {
        if (new URL(url).origin === baseUrl) return url;
      } catch {
        // Invalid URL, fall through to default
      }

      return baseUrl;
    },

    async jwt({ token, user, account }) {
      // Initial sign in with OAuth - store tokens
      if (account && account.access_token) {
        // Calculate expiresAt ourselves using expires_in (default to 900s if missing)
        let expiresAt =
          Math.floor(Date.now() / 1000) + (typeof account.expires_in === 'number' ? account.expires_in : 900);

        // Try to get exact exp from token
        const decoded = parseJwt(account.access_token);

        if (decoded && decoded.exp) {
          expiresAt = decoded.exp;
        }

        return {
          ...token,
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          expiresAt: expiresAt,
          error: undefined // Clear any stale error from previous broken session
        };
      }

      // Initial sign in with credentials - pass exchangeUrl
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
        token.exchangeUrl = (user as { exchangeUrl?: string }).exchangeUrl;
      }

      // Return previous token if not expired (with 10s buffer)
      const now = Math.floor(Date.now() / 1000);
      const expiresAt = token.expiresAt as number;

      if (token.expiresAt && now < expiresAt - 10) {
        return token;
      }

      // Already failed before — don't retry, show login
      if (token.error === 'RefreshAccessTokenError') {
        return token;
      }

      // Token expired - only try to refresh if we have a refresh token
      if (token.refreshToken) {
        return await refreshAccessToken(token);
      }

      // No refresh token available, just return token as-is
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.id as string) || (token.sub as string);
        session.user.name = token.name;
        session.user.email = token.email as string;
      }

      // Pass tokens to client
      session.accessToken = token.accessToken as string | undefined;
      session.exchangeUrl = token.exchangeUrl as string | undefined;
      session.error = token.error as string | undefined;

      return session;
    }
  },

  debug: false
};
