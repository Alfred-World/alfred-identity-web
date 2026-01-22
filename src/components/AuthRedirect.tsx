'use client'

// Next Imports
import { redirect, usePathname } from 'next/navigation'

// Config Imports
import themeConfig from '@configs/themeConfig'

const AuthRedirect = () => {
  const pathname = usePathname()

  // Redirect to login page with current path
  const redirectUrl = `/login?redirectTo=${encodeURIComponent(pathname)}`
  const login = `/login`
  const homePage = themeConfig.homePageUrl

  return redirect(pathname === login ? login : pathname === homePage ? login : redirectUrl)
}

export default AuthRedirect
