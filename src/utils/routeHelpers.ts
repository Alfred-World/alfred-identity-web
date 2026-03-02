/**
 * Route Utility Functions
 * Helper functions for route management and navigation
 */

import { ROUTES } from '@configs/routes';

/**
 * Check if a given path is an active route
 * @param pathname - Current pathname from usePathname
 * @param route - Route to check against
 * @returns boolean
 */
export const isActiveRoute = (pathname: string, route: string): boolean => {
  // Remove query params from pathname
  const pathWithoutQuery = pathname.split('?')[0];

  
return pathWithoutQuery === route;
};

/**
 * Check if a given path matches a route pattern
 * Useful for nested routes
 * @param pathname - Current pathname from usePathname
 * @param routePrefix - Route prefix to match
 * @returns boolean
 */
export const isRouteMatch = (pathname: string, routePrefix: string): boolean => {
  const pathWithoutQuery = pathname.split('?')[0];

  
return pathWithoutQuery.startsWith(routePrefix);
};

/**
 * Get the base path from the current pathname
 * Removes locale prefix if present
 * @param pathname - Current pathname
 * @returns Clean pathname
 */
export const getBasePath = (pathname: string): string => {
  // Remove leading locale if present (e.g., /en/dashboard -> /dashboard)
  const localeRegex = /^\/(en|ar)\//;

  if (localeRegex.test(pathname)) {
    return pathname.replace(localeRegex, '/');
  }

  
return pathname;
};

/**
 * Navigate to home if user is on guest routes
 * @returns redirect URL to home
 */
export const getHomeRedirect = (): string => {
  return ROUTES.HOME;
};

/**
 * Get login redirect
 * @returns route to login
 */
export const getLoginRedirect = (): string => {
  return ROUTES.GUEST.LOGIN;
};

/**
 * Check if a route requires authentication
 * @param route - Route path to check
 * @returns boolean
 */
export const isProtectedRoute = (route: string): boolean => {
  const guestRoutes = [
    ROUTES.GUEST.LOGIN,
    ROUTES.GUEST.FORGOT_PASSWORD,
    ROUTES.GUEST.RESET_PASSWORD,
    ROUTES.SIGNOUT
  ];

  
return !guestRoutes.some(guestRoute => route.includes(guestRoute));
};

/**
 * Check if a route is a guest-only route
 * @param route - Route path to check
 * @returns boolean
 */
export const isGuestRoute = (route: string): boolean => {
  const guestRoutes = [
    ROUTES.GUEST.LOGIN,
    ROUTES.GUEST.FORGOT_PASSWORD,
    ROUTES.GUEST.RESET_PASSWORD
  ];

  
return guestRoutes.some(guestRoute => route.includes(guestRoute));
};
