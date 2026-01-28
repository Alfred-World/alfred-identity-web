// Third-party Imports
import CredentialProvider from 'next-auth/providers/credentials'
import type { NextAuthOptions } from 'next-auth'
import { JWT } from 'next-auth/jwt'
import axios from 'axios'

// Generated API
import { postIdentityAuthSsoLogin } from '@/generated'

// Disable SSL verification for self-signed certificates in development
if (process.env.NODE_ENV === 'development') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

// Lock to prevent multiple concurrent refresh requests
let isRefreshing = false
let refreshPromise: Promise<JWT> | null = null

/**
 * Takes a token, and returns a new token with updated
 * `accessToken` and `accessTokenExpires`. If an error occurs,
 * returns the old token and an error property
 * 
 * NOTE: This function uses direct axios call instead of customInstance/postConnectToken
 * to avoid circular dependency: customInstance → getSession → jwt callback → refreshAccessToken
 */
async function refreshAccessToken(token: JWT): Promise<JWT> {
  // If a refresh is already in progress, return the existing promise
  if (isRefreshing && refreshPromise) {
    return refreshPromise
  }

  isRefreshing = true

  // Create a new promise for the refresh operation and assign it to the shared variable
  refreshPromise = (async () => {
    try {
      // Check if refresh token exists
      if (!token.refreshToken) {
        throw new Error('No refresh token available')
      }

      // Build form data for OAuth2 token refresh
      const formData = new URLSearchParams()
      formData.append('grant_type', 'refresh_token')
      formData.append('refresh_token', token.refreshToken as string)
      formData.append('client_id', process.env.OIDC_CLIENT_ID || '')
      if (process.env.OIDC_CLIENT_SECRET) {
        formData.append('client_secret', process.env.OIDC_CLIENT_SECRET)
      }

      // Direct axios call to avoid circular dependency with customInstance
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_GATEWAY_URL}/connect/token`,
        formData,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      )

      const refreshedTokens = response.data

      // Check if it's an error response
      if (refreshedTokens.error) {
        throw new Error(refreshedTokens.error_description || refreshedTokens.error)
      }

      return {
        ...token,
        accessToken: refreshedTokens.access_token,
        accessTokenExpires: Date.now() + (refreshedTokens.expires_in || 0) * 1000,
        refreshToken: refreshedTokens.refresh_token ?? token.refreshToken, // Fall back to old refresh token
      }
    } catch (error) {
      // Silent fail or let NextAuth handle error property below
      return {
        ...token,
        error: 'RefreshAccessTokenError',
      }
    } finally {
      // Release the lock
      isRefreshing = false
      refreshPromise = null
    }
  })()

  return refreshPromise
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

          const { user, returnUrl, accessToken, refreshToken, expiresIn } = response.result

          if (!user) {
            throw new Error('User data not found in SSO response')
          }

          // Return user object - stored in JWT cookie (not localStorage)
          // We attach tokens to the user object so they can be passed to the JWT callback
          return {
            id: user.id?.toString() || '',
            name: user.fullName || user.userName || '',
            email: user.email || email,
            image: null,
            username: user.userName || '',
            role: 'user',
            returnUrl: returnUrl || null,
            accessToken: accessToken,
            refreshToken: refreshToken,
            accessTokenExpires: Date.now() + (expiresIn || 0) * 1000
          }
        } catch (e: unknown) {
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
      // Handle OAuth provider (Initial Sign In)
      if (account?.type === 'oauth') {
        return {
          ...token,
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          accessTokenExpires: account.expires_at ? account.expires_at * 1000 : 0,
        }
      }

      // Handle Credentials provider (Initial Sign In)
      if (user) {
        // Store user info in token (which goes into cookie)
        token.id = user.id
        token.name = user.name
        token.email = user.email
        token.username = user.username
        token.role = user.role
        token.image = user.image
        token.returnUrl = user.returnUrl

        // Store tokens from Credentials login
        // @ts-expect-error user contains tokens from authorize callback
        token.accessToken = user.accessToken
        // @ts-expect-error user contains tokens from authorize callback
        token.refreshToken = user.refreshToken
        // @ts-expect-error user contains tokens from authorize callback
        token.accessTokenExpires = user.accessTokenExpires
      }
      // Return previous token if the access token has not expired yet
      // Add a 10-second buffer to be safe
      if (token.accessTokenExpires && Date.now() < (token.accessTokenExpires as number - 10000)) {
        return token
      }

      // Access token has expired, try to refresh it
      return refreshAccessToken(token)
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

      // Add accessToken and error to session
      if (token.accessToken) {
        session.accessToken = token.accessToken;
        session.error = token.error;
      }

      return session
    }
  },

  debug: false,
}
