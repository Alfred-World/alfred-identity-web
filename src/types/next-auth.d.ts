import 'next-auth'
import 'next-auth/jwt'

declare module 'next-auth' {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    user: {
      id: string
      name: string
      email: string
      image?: string | null
      username?: string
      role?: string
      returnUrl?: string | null
    }
    accessToken?: string
    refreshToken?: string
    error?: string
    accessTokenExpires?: string
  }

  interface User {
    id: string
    name: string
    email: string
    image?: string | null
    username?: string
    role?: string
    returnUrl?: string | null
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string
    username?: string
    role?: string
    returnUrl?: string | null
    accessToken?: string
    refreshToken?: string
    accessTokenExpires?: number
    error?: string
  }
}
