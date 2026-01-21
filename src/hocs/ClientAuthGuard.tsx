'use client'

import { useEffect, useState, type ReactNode } from 'react'

import { isAuthenticated, login } from '@/libs/oidc-config'

interface ClientAuthGuardProps {
  children: ReactNode
}

// Constants
const GATEWAY_URL = process.env.NEXT_PUBLIC_GATEWAY_URL || 'https://gateway.test'

/**
 * Client-side AuthGuard using OIDC
 * 
 * Authentication flow:
 * 1. Check localStorage for OIDC tokens (from oidc-client-ts)
 * 2. If no tokens, check SSO cookie via Gateway API
 * 3. If SSO cookie exists, trigger OIDC login to get tokens
 * 4. If no SSO cookie, redirect to login page
 */
export default function ClientAuthGuard({ children }: ClientAuthGuardProps) {
  const [authState, setAuthState] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading')

  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log('[ClientAuthGuard] Checking authentication...')
        
        // Step 1: Check if already authenticated via OIDC tokens
        const authenticated = await isAuthenticated()
        
        if (authenticated) {
          console.log('[ClientAuthGuard] User authenticated via OIDC tokens')
          setAuthState('authenticated')
          return
        }

        // Step 2: No OIDC tokens, check SSO cookie via Gateway API
        console.log('[ClientAuthGuard] No OIDC tokens, checking SSO cookie...')
        
        try {
          const response = await fetch(`${GATEWAY_URL}/identity/auth/session`, {
            method: 'GET',
            credentials: 'include', // Important: include cookies
            headers: {
              'Content-Type': 'application/json',
            }
          })

          if (response.ok) {
            const result = await response.json()
            
            if (result.success && result.result?.isAuthenticated) {
              // SSO cookie exists - trigger OIDC flow to get tokens
              console.log('[ClientAuthGuard] SSO cookie found, triggering OIDC login...')
              await login(window.location.pathname + window.location.search)
              return
            }
          }
        } catch (error) {
          console.warn('[ClientAuthGuard] Failed to check SSO session:', error)
        }

        // Step 3: No authentication found, redirect to OIDC login
        console.log('[ClientAuthGuard] No authentication, redirecting to OIDC login...')
        setAuthState('unauthenticated')
        await login(window.location.pathname + window.location.search)
        
      } catch (error) {
        console.error('[ClientAuthGuard] Auth check error:', error)
        setAuthState('unauthenticated')
        await login(window.location.pathname + window.location.search)
      }
    }

    checkAuth()
  }, [])

  // Loading state
  if (authState === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-textSecondary">Checking authentication...</p>
        </div>
      </div>
    )
  }

  // Unauthenticated - will redirect, show loading
  if (authState === 'unauthenticated') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-textSecondary">Redirecting to login...</p>
        </div>
      </div>
    )
  }

  // Authenticated - render children
  return <>{children}</>
}
