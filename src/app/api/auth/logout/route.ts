import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

/**
 * Custom logout endpoint that clears NextAuth session without confirmation page
 * GET /api/auth/logout?callbackUrl=<url>
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const callbackUrl = searchParams.get('callbackUrl') || searchParams.get('returnUrl')

  // Redirect URL
  const redirectUrl = callbackUrl?.startsWith('http')
    ? callbackUrl
    : new URL(callbackUrl || '/login', request.url).toString()

  // Create response with redirect
  const response = NextResponse.redirect(redirectUrl)

  // Delete all NextAuth related cookies by setting them to expire
  const cookiesToDelete = [
    'next-auth.session-token',
    '__Secure-next-auth.session-token',
    'next-auth.csrf-token',
    '__Host-next-auth.csrf-token',
    'next-auth.callback-url',
    '__Secure-next-auth.callback-url',
    'authjs.session-token',
    '__Secure-authjs.session-token',
    'authjs.csrf-token',
    'authjs.callback-url'
  ]

  for (const cookieName of cookiesToDelete) {
    // Delete with various path options to ensure removal
    response.cookies.set(cookieName, '', {
      expires: new Date(0),
      path: '/'
    })

    // Also try deleting with secure flag for __Secure- prefixed cookies
    if (cookieName.startsWith('__Secure-') || cookieName.startsWith('__Host-')) {
      response.cookies.set(cookieName, '', {
        expires: new Date(0),
        path: '/',
        secure: true,
        httpOnly: true
      })
    }
  }

  return response
}
