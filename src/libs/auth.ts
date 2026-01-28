// Third-party Imports
import CredentialProvider from 'next-auth/providers/credentials'
import type { NextAuthOptions } from 'next-auth'

// Generated API
import { postIdentityAuthSsoLogin } from '@/generated'

// Disable SSL verification for self-signed certificates in development
if (process.env.NODE_ENV === 'development') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialProvider({
      id: 'credentials',
      name: 'Credentials',
      type: 'credentials',
      credentials: {},
      async authorize(credentials) {
        const { email, password, returnUrl } = credentials as {
          email: string
          password: string
          returnUrl?: string
        }

        try {
          // Call SSO Login API
          const response = await postIdentityAuthSsoLogin({
            identity: email,
            password: password,
            rememberMe: true,
            returnUrl: returnUrl
          })

          if (!response.success || !response.result) {
            throw new Error(response.message || 'Login failed')
          }

          const { user, returnUrl: exchangeUrl } = response.result

          if (!user) {
            throw new Error('User data not found')
          }

          // Return user with exchangeUrl for client-side redirect
          return {
            id: user.id?.toString() || '',
            name: user.fullName || user.userName || '',
            email: user.email || email,
            image: null,
            exchangeUrl: exchangeUrl // Client will redirect here
          }
        } catch (e: unknown) {
          throw new Error(e instanceof Error ? e.message : 'Login failed')
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
        name: { label: 'Name', type: 'text' },
      },
      async authorize(credentials) {
        // This is called when we have a valid SSO session from Gateway
        if (!credentials?.userId || !credentials?.email) {
          return null
        }
        return {
          id: credentials.userId as string,
          email: credentials.email as string,
          name: (credentials.name as string) || credentials.email,
        }
      }
    }),
  ],

  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60 // 30 days
  },

  pages: {
    signIn: '/login'
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.name = user.name
        token.email = user.email
        token.exchangeUrl = (user as any).exchangeUrl
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.name = token.name
        session.user.email = token.email as string
      }
      // Pass exchangeUrl to client for redirect
      session.exchangeUrl = token.exchangeUrl as string | undefined
      return session
    }
  }
}
