// Third-party Imports
import CredentialProvider from 'next-auth/providers/credentials'
import type { NextAuthOptions } from 'next-auth'

// Generated API
import { postIdentityAuthSsoLogin } from '@/generated'

// Disable SSL verification for self-signed certificates in development
if (process.env.NODE_ENV === 'development') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

export const authOptions: NextAuthOptions = {
  // ** Configure authentication providers
  // ** SSO Web has TWO providers:
  // ** 1. Credentials - for login form (username/password)
  // ** 2. OAuth - for SSO auto-login when Gateway has session
  providers: [
    // Credentials provider for login form
    CredentialProvider({
      id: 'sso',
      name: 'Single Sign-On',
      type: 'credentials',
      credentials: {},
      async authorize(credentials) {
        const { email, password } = credentials as { email: string; password: string }

        try {
          // SSO Login API Call
          const response = await postIdentityAuthSsoLogin({
            identity: email,
            password: password,
            rememberMe: true
          })

          if (!response.success || !response.result) {
            throw new Error(response.message || 'SSO login failed')
          }

          const { user, returnUrl } = response.result

          if (!user) {
            throw new Error('User data not found in SSO response')
          }

          // Return user object - stored in JWT cookie (not localStorage)
          return {
            id: user.id?.toString() || '',
            name: user.fullName || user.userName || '',
            email: user.email || email,
            image: null,
            username: user.userName || '',
            role: 'user',
            returnUrl: returnUrl || null
          }
        } catch (e: unknown) {
          console.error('SSO Login Error:', e)
          throw new Error(e instanceof Error ? e.message : 'SSO authentication failed')
        }
      }
    }),
    
    // OAuth provider for SSO auto-login (when Gateway already has session)
    {
      id: "sso-oauth",
      name: "SSO OAuth",
      type: "oauth",
      wellKnown: `${process.env.NEXT_PUBLIC_GATEWAY_URL}/.well-known/openid-configuration`,
      authorization: { params: { scope: "openid profile email offline_access" } },
      idToken: true,
      checks: ["pkce", "state"],
      clientId: process.env.OIDC_CLIENT_ID!,
      clientSecret: process.env.OIDC_CLIENT_SECRET,
      client: {
        token_endpoint_auth_method: "client_secret_post",
      },
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
        }
      },
    },
  ],

  // Session configuration - JWT stored in HTTP-only cookie (not localStorage!)
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60 // 30 days
  },

  // Custom pages
  pages: {
    signIn: '/login'
  },

  callbacks: {
    async jwt({ token, user, account }) {
      // Handle OAuth provider
      if (account?.type === 'oauth') {
        return {
          ...token,
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          expiresAt: account.expires_at,
        }
      }
      
      // Handle Credentials provider
      if (user) {
        // Store user info in token (which goes into cookie)
        token.id = user.id
        token.name = user.name
        token.email = user.email
        token.username = user.username
        token.role = user.role
        token.image = user.image
        token.returnUrl = user.returnUrl
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.id || token.sub) as string
        session.user.name = token.name as string
        session.user.email = token.email as string
        session.user.username = token.username as string
        session.user.role = token.role as string
        session.user.image = token.image as string | null
        session.user.returnUrl = token.returnUrl as string | null
      }
      // Add accessToken to session if available (from OAuth)
      if (token.accessToken) {
        (session as any).accessToken = token.accessToken
      }
      return session
    }
  },

  debug: false,
}
