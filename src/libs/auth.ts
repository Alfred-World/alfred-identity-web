// Third-party Imports
import CredentialProvider from 'next-auth/providers/credentials';
import type { NextAuthOptions } from 'next-auth';
import type { JWT } from 'next-auth/jwt';

// Generated API
import { postIdentityAuthSsoLogin } from '@/generated';

// Disable SSL verification for self-signed certificates in development
if (process.env.NODE_ENV === 'development') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

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

    const response = await fetch(`${process.env.NEXT_PUBLIC_GATEWAY_URL}/connect/token`, {
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

    const refreshedTokens = await response.json();

    if (!response.ok) {
      console.error('[AUTH] Refresh failed:', refreshedTokens);
      throw refreshedTokens;
    }

    // Calculate new expiresAt
    let expiresAt = Date.now() / 1000 + refreshedTokens.expires_in;

    if (refreshedTokens.access_token) {
      const decoded = parseJwt(refreshedTokens.access_token);

      if (decoded && decoded.exp) {
        expiresAt = decoded.exp;
      }
    }

    return {
      ...token,
      accessToken: refreshedTokens.access_token,
      refreshToken: refreshedTokens.refresh_token ?? token.refreshToken,
      expiresAt: expiresAt,
      error: undefined
    };
  } catch (error) {
    console.error('[AUTH] Error refreshing access token', error);

    return {
      ...token,
      error: 'RefreshAccessTokenError'
    };
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    // OAuth provider for OIDC flow - used to get access tokens for API calls
    {
      id: 'sso-oauth',
      name: 'SSO OAuth',
      type: 'oauth',
      wellKnown: `${process.env.NEXT_PUBLIC_GATEWAY_URL}/.well-known/openid-configuration`,
      authorization: { params: { scope: 'openid profile email offline_access' } },
      idToken: true,
      checks: ['pkce', 'state'],
      clientId: process.env.OIDC_CLIENT_ID!,
      clientSecret: process.env.OIDC_CLIENT_SECRET,
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
    signIn: '/login'
  },

  // Use secure cookies for HTTPS
  useSecureCookies: true,

  callbacks: {
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
          expiresAt: expiresAt
        };
      }

      // Initial sign in with credentials - pass exchangeUrl
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
        token.exchangeUrl = (user as any).exchangeUrl;
      }

      // Return previous token if not expired (with 10s buffer)
      const now = Math.floor(Date.now() / 1000);
      const expiresAt = token.expiresAt as number;

      if (token.expiresAt && now < expiresAt - 10) {
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
