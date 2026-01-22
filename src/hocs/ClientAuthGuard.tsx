'use client'

import { useEffect, useRef, type ReactNode } from 'react'
import { useSession, signIn } from 'next-auth/react'
import { usePathname } from 'next/navigation'

// Component Imports
import FullPageLoader from '@/components/FullPageLoader'

interface ClientAuthGuardProps {
  children: ReactNode
}

/**
 * Client-side AuthGuard using NextAuth session
 * For sso.test (Identity Provider):
 * 1. Check local NextAuth session
 * 2. If no local session, trigger OAuth flow ONCE
 * 3. Gateway will check SSO cookie - if exists, auto-complete OAuth
 * 4. If no Gateway cookie, OAuth redirects to login page (pages.signIn)
 */
export default function ClientAuthGuard({ children }: ClientAuthGuardProps) {
  const { status } = useSession()
  const pathname = usePathname()
  const hasTriggeredSignIn = useRef(false)

  useEffect(() => {
    // Only trigger signIn ONCE when unauthenticated
    if (status === 'unauthenticated' && !hasTriggeredSignIn.current) {
      hasTriggeredSignIn.current = true
      signIn('sso-oauth', { callbackUrl: pathname })
    }
  }, [status, pathname])

  // Show loader during auth check or OAuth redirect
  if (status === 'loading' || status === 'unauthenticated') {
    return <FullPageLoader />
  }

  // Authenticated - render children
  return <>{children}</>
}
