/**
 * Navigation Menu Configuration
 * Used for breadcrumbs, menus, and navigation structure
 */

import { ROUTES } from './routes';

export type NavItem = {
  title: string;
  href?: string;
  icon?: string;
  children?: NavItem[];
};

export const NAVIGATION_ITEMS: NavItem[] = [
  {
    title: 'Dashboards',
    href: ROUTES.DASHBOARDS.ROOT,
    icon: 'tabler-layout-dashboard'
  },
  {
    title: 'Applications',
    href: ROUTES.APPLICATIONS.ROOT,
    icon: 'tabler-box'
  },
  {
    title: 'Users',
    href: ROUTES.USERS.ROOT,
    icon: 'tabler-users'
  },
  {
    title: 'Roles',
    href: ROUTES.ROLES.ROOT,
    icon: 'tabler-shield'
  },
  {
    title: 'Settings',
    href: ROUTES.SETTINGS.ROOT,
    icon: 'tabler-settings'
  }
];

/**
 * Breadcrumb mappings
 * Maps route paths to breadcrumb titles
 */
export const BREADCRUMB_TITLES: Record<string, string> = {
  [ROUTES.DASHBOARDS.ROOT]: 'Dashboards',
  [ROUTES.APPLICATIONS.ROOT]: 'Applications',
  [ROUTES.APPLICATIONS.CREATE]: 'Create Application',
  [ROUTES.USERS.ROOT]: 'Users',
  [ROUTES.ROLES.ROOT]: 'Roles',
  [ROUTES.SETTINGS.ROOT]: 'Settings',
};

/**
 * Home breadcrumb item
 */
export const HOME_BREADCRUMB = {
  title: 'Home',
  href: ROUTES.HOME
};

/**
 * Default breadcrumbs when no specific mapping exists
 */
export const DEFAULT_BREADCRUMBS = [HOME_BREADCRUMB];
