// Next Imports
import { redirect } from 'next/navigation'

// Third-party Imports
import { getServerSession } from 'next-auth'

// Type Imports
import type { ChildrenType } from '@core/types'

// Config Imports
import themeConfig from '@configs/themeConfig'

interface GuestOnlyRouteProps extends ChildrenType {
  returnUrl?: string
}

/**
 * Check if a URL is external (from another app/domain for OAuth flow)
 */
const isExternalUrl = (url: string | undefined): boolean => {
  if (!url) return false
  if (!url.startsWith('http://') && !url.startsWith('https://')) return false
  
  // Check if it's pointing to gateway (OAuth authorize endpoint)
  const gatewayUrl = process.env.NEXT_PUBLIC_GATEWAY_URL || 'https://gateway.test'
  if (url.startsWith(gatewayUrl)) return true
  
  // Check if it's NOT the current sso.test app
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://sso.test'
  return !url.startsWith(appUrl)
}

const GuestOnlyRoute = async ({ children, returnUrl }: GuestOnlyRouteProps) => {
  const session = await getServerSession()

  if (session) {
    // User is already logged in
    if (returnUrl && isExternalUrl(returnUrl)) {
      // External OAuth flow - redirect to complete the flow
      // This happens when user is logged in at sso.test but came from core.test OAuth
      redirect(returnUrl)
    }
    
    // Local navigation - redirect to dashboard
    redirect(themeConfig.homePageUrl)
  }

  return <>{children}</>
}

export default GuestOnlyRoute
