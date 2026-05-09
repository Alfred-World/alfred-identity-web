import type { NextAuthOptions } from 'next-auth';

// Disable SSL verification for self-signed certificates in development
if (process.env.NODE_ENV === 'development') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

const PUBLIC_GATEWAY_URL = process.env.NEXT_PUBLIC_GATEWAY_URL!;
const SERVER_GATEWAY_URL = process.env.INTERNAL_GATEWAY_URL || PUBLIC_GATEWAY_URL;
const USE_SECURE_COOKIES = (process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || '').startsWith('https://');

function parseJwt(token: string) {
  try {
    return JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
  } catch (_e) {
    return null;
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    {
      id: 'sso-oauth',
      name: 'SSO OAuth',
      type: 'oauth',
      authorization: {
        url: `${PUBLIC_GATEWAY_URL}/connect/authorize`,
        params: { scope: 'openid profile email offline_access' }
      },
      token: `${SERVER_GATEWAY_URL}/connect/token`,
      userinfo: `${SERVER_GATEWAY_URL}/connect/userinfo`,
      jwks_endpoint: `${SERVER_GATEWAY_URL}/.well-known/jwks.json`,
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
    }
  ],

  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60
  },

  pages: {
    signIn: '/login',
    error: '/auth/error'
  },

  useSecureCookies: USE_SECURE_COOKIES,

  callbacks: {
    async redirect({ url, baseUrl }) {
      if (url.startsWith(PUBLIC_GATEWAY_URL)) return url;
      if (SERVER_GATEWAY_URL !== PUBLIC_GATEWAY_URL && url.startsWith(SERVER_GATEWAY_URL)) return url;
      if (url.startsWith('/')) return `${baseUrl}${url}`;

      try {
        if (new URL(url).origin === baseUrl) return url;
      } catch {
        // Keep default for invalid URLs.
      }

      return baseUrl;
    },

    async jwt({ token, account }) {
      if (account?.access_token) {
        let expiresAt = Math.floor(Date.now() / 1000) + (typeof account.expires_in === 'number' ? account.expires_in : 900);
        const decoded = parseJwt(account.access_token);

        if (decoded?.exp) {
          expiresAt = decoded.exp;
        }

        return {
          ...token,
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          expiresAt,
          issuedAt: Math.floor(Date.now() / 1000),
          error: undefined
        };
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.id as string) || (token.sub as string);
        session.user.name = token.name;
        session.user.email = token.email as string;
      }

      session.error = token.error as string | undefined;

      return session;
    }
  },

  debug: false
};
