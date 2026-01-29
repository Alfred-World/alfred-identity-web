import 'next-auth'

declare module 'next-auth' {
  interface Session {
    exchangeUrl?: string
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
    }
    accessToken?: string
    error?: string
  }

  interface User {
    id: string
    name?: string | null
    email?: string | null
    exchangeUrl?: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string
    exchangeUrl?: string
  }
}
