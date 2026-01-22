// Next Imports
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'

// Component Imports
import Login from './_components/Login'

// Server Action Imports
import { getServerMode } from '@core/utils/serverHelpers'

// Config Imports
import themeConfig from '@configs/themeConfig'

export const metadata: Metadata = {
  title: 'Login',
  description: 'Login to your account'
}

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

/**
 * Check if a URL is external (from another app/domain)
 * BUT NOT an OAuth authorize URL (those should show login form, not auto-redirect)
 */
const isExternalNonOAuthUrl = (url: string | undefined): boolean => {
  if (!url) return false
  if (!url.startsWith('http://') && !url.startsWith('https://')) return false
  
  const gatewayUrl = process.env.NEXT_PUBLIC_GATEWAY_URL || 'https://gateway.test'
  
  // If it's an OAuth authorize URL, DON'T auto-redirect (user might have logged out)
  // They should see the login form and click to continue
  if (url.startsWith(`${gatewayUrl}/connect/authorize`)) {
    return false
  }
  
  // Check if it's pointing to gateway (other endpoints like token exchange)
  if (url.startsWith(gatewayUrl)) return true
  
  // Check if it's NOT the current sso.test app
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://sso.test'
  return !url.startsWith(appUrl)
}

const LoginPage = async ({ searchParams }: PageProps) => {
  const params = await searchParams
  const mode = await getServerMode()
  const session = await getServerSession()
  
  // Get returnUrl from query params
  const returnUrl = (params?.returnUrl || params?.redirect_to || params?.redirectTo) as string | undefined
  
  // If user is already logged in
  if (session) {
    if (returnUrl && isExternalNonOAuthUrl(returnUrl)) {
      // External non-OAuth URL - redirect to complete the flow
      redirect(returnUrl)
    }
    
    // If no returnUrl OR it's an OAuth URL, redirect to dashboard
    // User should use SSO flow from the other app (not auto-redirect OAuth)
    if (!returnUrl) {
      redirect(themeConfig.homePageUrl)
    }
    
    // If returnUrl is OAuth authorize URL, show login page
    // User can see "already logged in" or click to continue
    // This prevents redirect loops after logout from another app
  }

  return <Login mode={mode} />
}

export default LoginPage
