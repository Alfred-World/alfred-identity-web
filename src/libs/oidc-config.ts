'use client'

import { UserManager, WebStorageStateStore, User } from 'oidc-client-ts'

// Configuration from environment variables
const GATEWAY_URL = process.env.NEXT_PUBLIC_GATEWAY_URL || 'http://gateway.test:8000'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://sso.test:7100'
const CLIENT_ID = process.env.NEXT_PUBLIC_OIDC_CLIENT_ID || 'sso_web'

/**
 * OIDC Configuration for SSO Web (SPA with PKCE)
 * This is used for protected pages like dashboard/profile in the Identity app
 */
export const oidcConfig = {
  authority: GATEWAY_URL,
  client_id: CLIENT_ID,
  redirect_uri: `${APP_URL}/callback`,
  post_logout_redirect_uri: APP_URL,
  response_type: 'code',
  scope: 'openid profile email offline_access',
  
  // PKCE is enabled by default in oidc-client-ts
  // No client_secret needed for public clients
  
  // Storage for tokens - using localStorage to persist across tabs
  userStore: typeof window !== 'undefined' 
    ? new WebStorageStateStore({ store: window.localStorage })
    : undefined,
  
  // Manual metadata configuration
  metadata: {
    issuer: GATEWAY_URL,
    authorization_endpoint: `${GATEWAY_URL}/connect/authorize`,
    token_endpoint: `${GATEWAY_URL}/connect/token`,
    userinfo_endpoint: `${GATEWAY_URL}/connect/userinfo`,
    end_session_endpoint: `${GATEWAY_URL}/connect/logout`,
  },
  
  // Token settings
  automaticSilentRenew: false,
  filterProtocolClaims: true,
  loadUserInfo: false,
}

// Singleton UserManager instance
let userManager: UserManager | null = null

/**
 * Get the UserManager singleton instance
 */
export function getUserManager(): UserManager {
  if (typeof window === 'undefined') {
    throw new Error('UserManager can only be used on the client side')
  }
  
  if (!userManager) {
    userManager = new UserManager(oidcConfig)
    
    // Add event listeners for debugging
    userManager.events.addUserLoaded((user) => {
      console.log('[SSO OIDC] User loaded:', user.profile.sub)
    })
    
    userManager.events.addUserUnloaded(() => {
      console.log('[SSO OIDC] User unloaded')
    })
    
    userManager.events.addAccessTokenExpired(() => {
      console.log('[SSO OIDC] Access token expired')
    })
  }
  
  return userManager
}

/**
 * Get the current authenticated user
 */
export async function getUser(): Promise<User | null> {
  try {
    const um = getUserManager()
    return await um.getUser()
  } catch (error) {
    console.error('[SSO OIDC] Error getting user:', error)
    return null
  }
}

/**
 * Get the access token for API calls
 * Checks both oidc-client-ts store and sessionStorage (for simple flow)
 */
export async function getAccessToken(): Promise<string | null> {
  // First check localStorage for simple flow tokens
  if (typeof window !== 'undefined') {
    const simpleFlowToken = localStorage.getItem('oidc_access_token')
    if (simpleFlowToken) {
      return simpleFlowToken
    }
  }
  
  // Then try oidc-client-ts (PKCE flow)
  try {
    const user = await getUser()
    
    if (!user || user.expired) {
      return null
    }
    
    return user.access_token
  } catch (error) {
    console.error('[SSO OIDC] Error getting access token:', error)
    return null
  }
}

/**
 * Check if user is authenticated
 * Checks both oidc-client-ts store and sessionStorage (for simple flow)
 */
export async function isAuthenticated(): Promise<boolean> {
  // First check localStorage for simple flow tokens
  if (typeof window !== 'undefined') {
    const simpleFlowToken = localStorage.getItem('oidc_access_token')
    if (simpleFlowToken) {
      return true
    }
  }
  
  // Then check oidc-client-ts
  const user = await getUser()
  return user !== null && !user.expired
}

/**
 * Initiate login redirect to Identity Provider
 * Uses simple redirect without PKCE for non-HTTPS development environments
 * @param returnUrl - URL to return to after login
 */
export async function login(returnUrl?: string): Promise<void> {
  const targetReturnUrl = returnUrl || window.location.pathname
  
  console.log('[SSO OIDC] Initiating login, return URL:', targetReturnUrl)
  
  // Check if crypto.subtle is available (HTTPS or localhost only)
  const hasCryptoSubtle = typeof window !== 'undefined' && 
    window.crypto && 
    typeof window.crypto.subtle !== 'undefined'
  
  if (hasCryptoSubtle) {
    // Use oidc-client-ts with PKCE (secure contexts)
    try {
      const um = getUserManager()
      const state = { returnUrl: targetReturnUrl }
      await um.signinRedirect({ state })
      return
    } catch (error) {
      console.warn('[SSO OIDC] PKCE redirect failed, falling back to simple redirect:', error)
    }
  }
  
  // Fallback: Simple redirect without PKCE for HTTP development
  console.log('[SSO OIDC] Using simple redirect (no PKCE) for non-HTTPS environment')
  
  // Store return URL in localStorage for callback
  localStorage.setItem('oidc_return_url', targetReturnUrl)
  
  // Generate a random state for CSRF protection
  const state = Math.random().toString(36).substring(2, 15)
  localStorage.setItem('oidc_state', state)
  
  // Build authorize URL manually
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: `${APP_URL}/callback`,
    response_type: 'code',
    scope: 'openid profile email offline_access',
    state: state,
  })
  
  const authorizeUrl = `${GATEWAY_URL}/connect/authorize?${params.toString()}`
  
  console.log('[SSO OIDC] Redirecting to:', authorizeUrl)
  window.location.href = authorizeUrl
}

/**
 * Handle the callback after login redirect
 */
export async function handleCallback(): Promise<User> {
  try {
    const um = getUserManager()
    const user = await um.signinRedirectCallback()
    
    console.log('[SSO OIDC] Callback handled successfully for user:', user.profile.sub)
    
    return user
  } catch (error) {
    console.error('[SSO OIDC] Callback error:', error)
    throw error
  }
}

/**
 * Logout and redirect
 */
export async function logout(): Promise<void> {
  const gatewayUrl = process.env.NEXT_PUBLIC_GATEWAY_URL || 'https://gateway.test'
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://sso.test'

  // Clear simple flow tokens from localStorage
  if (typeof window !== 'undefined') {
    localStorage.removeItem('oidc_access_token')
    localStorage.removeItem('oidc_refresh_token')
    localStorage.removeItem('oidc_id_token')
    localStorage.removeItem('oidc_state')
    localStorage.removeItem('oidc_return_url')
  }
  
  // Clear oidc-client-ts user
  try {
    const um = getUserManager()
    await um.removeUser()
  } catch (error) {
    console.warn('[SSO OIDC] Failed to remove user:', error)
  }
  
  // Logout from Gateway (clear SSO cookie)
  try {
    await fetch(`${gatewayUrl}/identity/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    })
  } catch (error) {
    console.warn('[SSO OIDC] Gateway logout failed:', error)
  }
  
  // Redirect to Gateway logout endpoint
  window.location.href = `${gatewayUrl}/connect/logout?post_logout_redirect_uri=${encodeURIComponent(appUrl)}`
}

/**
 * Get user profile information
 */
export async function getUserProfile(): Promise<{
  id: string
  email: string
  name?: string
} | null> {
  const user = await getUser()
  
  if (!user) {
    return null
  }
  
  return {
    id: user.profile.sub,
    email: user.profile.email || '',
    name: user.profile.name,
  }
}
