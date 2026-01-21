'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

const GATEWAY_URL = process.env.NEXT_PUBLIC_GATEWAY_URL || 'http://gateway.test:8000'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://sso.test:7100'
const CLIENT_ID = process.env.NEXT_PUBLIC_OIDC_CLIENT_ID || 'sso_web'

/**
 * OIDC Callback Page for SSO Web
 * Handles the authorization code exchange after redirect from Identity Provider
 * Supports both PKCE flow (oidc-client-ts) and simple flow (manual exchange)
 */
export default function CallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(true)

  useEffect(() => {
    const processCallback = async () => {
      try {
        console.log('[SSO Callback] Processing OIDC callback...')
        
        const code = searchParams.get('code')
        const stateParam = searchParams.get('state')
        const errorParam = searchParams.get('error')
        
        if (errorParam) {
          throw new Error(searchParams.get('error_description') || errorParam)
        }
        
        if (!code) {
          throw new Error('No authorization code received')
        }

        // Check if this was a PKCE flow by looking for stored OIDC state in localStorage
        // oidc-client-ts stores state with prefix "oidc."
        const hasOidcState = stateParam && localStorage.getItem(`oidc.${stateParam}`)
        
        if (hasOidcState) {
          // PKCE flow - use oidc-client-ts which handles code_verifier
          console.log('[SSO Callback] Using PKCE flow (oidc-client-ts)...')
          
          try {
            const { handleCallback } = await import('@/libs/oidc-config')
            const user = await handleCallback()
            
            console.log('[SSO Callback] PKCE authentication successful for:', user.profile.sub)
            
            // Get return URL from state
            const state = user.state as { returnUrl?: string } | undefined
            const returnUrl = state?.returnUrl || '/dashboards/crm'
            
            console.log('[SSO Callback] Redirecting to:', returnUrl)
            router.replace(returnUrl)
            return
          } catch (pkceError) {
            console.warn('[SSO Callback] PKCE flow failed:', pkceError)
            // Fall through to simple flow
          }
        }
        
        // Simple flow - for non-PKCE authorize requests
        console.log('[SSO Callback] Using simple flow to exchange code...')
        
        // Verify state to prevent CSRF (if we stored it in localStorage)
        const savedState = localStorage.getItem('oidc_state')
        if (stateParam && savedState && stateParam !== savedState) {
          throw new Error('Invalid state parameter - possible CSRF attack')
        }
        
        // Exchange code for tokens (simple flow - no code_verifier)
        const tokenResponse = await fetch(`${GATEWAY_URL}/connect/token`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            grant_type: 'authorization_code',
            client_id: CLIENT_ID,
            code: code,
            redirect_uri: `${APP_URL}/callback`,
          }).toString(),
        })
        
        if (!tokenResponse.ok) {
          const errorData = await tokenResponse.json().catch(() => ({}))
          throw new Error(errorData.error_description || errorData.error || 'Failed to exchange code for tokens')
        }
        
        const tokens = await tokenResponse.json()
        console.log('[SSO Callback] Token exchange successful')
        
        // Store tokens in localStorage for the API client
        localStorage.setItem('oidc_access_token', tokens.access_token)
        if (tokens.refresh_token) {
          localStorage.setItem('oidc_refresh_token', tokens.refresh_token)
        }
        if (tokens.id_token) {
          localStorage.setItem('oidc_id_token', tokens.id_token)
        }
        
        // Get return URL from localStorage
        const returnUrl = localStorage.getItem('oidc_return_url') || '/dashboards/crm'
        
        // Clean up
        localStorage.removeItem('oidc_state')
        localStorage.removeItem('oidc_return_url')
        
        console.log('[SSO Callback] Redirecting to:', returnUrl)
        router.replace(returnUrl)
        
      } catch (err: unknown) {
        console.error('[SSO Callback] OIDC Callback Error:', err)
        
        const errorMessage = err instanceof Error 
          ? err.message 
          : 'Authentication failed. Please try again.'
        
        setError(errorMessage)
        setIsProcessing(false)
      }
    }

    processCallback()
  }, [router, searchParams])

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-backgroundPaper">
        <div className="text-center max-w-md p-8">
          <div className="mb-6">
            <i className="tabler-alert-circle text-6xl text-error" />
          </div>
          <h1 className="text-2xl font-bold text-error mb-4">
            Authentication Error
          </h1>
          <p className="text-textSecondary mb-6">
            {error}
          </p>
          <div className="space-y-3">
            <button
              onClick={() => router.push('/')}
              className="w-full px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              Go to Home
            </button>
            <button
              onClick={() => window.location.reload()}
              className="w-full px-6 py-3 border border-primary text-primary rounded-lg hover:bg-primary/10 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Loading state
  return (
    <div className="flex items-center justify-center min-h-screen bg-backgroundPaper">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
        <p className="text-lg font-medium text-textPrimary">
          {isProcessing ? 'Completing authentication...' : 'Redirecting...'}
        </p>
        <p className="text-sm text-textSecondary mt-2">
          Please wait while we verify your credentials
        </p>
      </div>
    </div>
  )
}
