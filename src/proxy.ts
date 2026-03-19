import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { getToken } from 'next-auth/jwt'

const PUBLIC_PATHS = ['/login', '/forgot-password', '/reset-password']

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(path => pathname === path || pathname.startsWith(`${path}/`))
}

function isPrivatePath(pathname: string): boolean {
  return pathname.startsWith('/users')
    || pathname.startsWith('/roles')
    || pathname.startsWith('/applications')
    || pathname.startsWith('/settings')
}

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl

  if (pathname.startsWith('/api') || pathname.startsWith('/_next') || pathname.includes('.')) {
    return NextResponse.next()
  }

  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  const isAuthenticated = !!token

  if (isPrivatePath(pathname) && !isAuthenticated) {
    return NextResponse.redirect(
      new URL(`/login?returnUrl=${encodeURIComponent(`${pathname}${search}`)}`, request.url)
    )
  }

  if (isPublicPath(pathname) && isAuthenticated) {

    return NextResponse.redirect(new URL('/', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)']
}
