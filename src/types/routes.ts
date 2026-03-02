/**
 * Route Type Definitions
 * Type-safe route management
 */

/**
 * Valid route paths in the application
 */
export type RoutePath =
  | '/'
  | '/login'
  | '/forgot-password'
  | '/reset-password'
  | '/signout'
  | '/dashboards'
  | '/applications'
  | '/applications/create'
  | '/users'
  | '/roles'
  | '/settings'
  | '/settings/general'
  | '/profile';

/**
 * Route configuration with application structure
 */
export interface RouteConfig {
  HOME: '/';
  GUEST: {
    LOGIN: '/login';
    FORGOT_PASSWORD: '/forgot-password';
    RESET_PASSWORD: '/reset-password';
  };
  SIGNOUT: '/signout';
  DASHBOARDS: {
    ROOT: '/dashboards';
    CRM: '/dashboards';
  };
  APPLICATIONS: {
    ROOT: '/applications';
    LIST: '/applications';
    CREATE: '/applications/create';
    EDIT: (id: string | number) => string;
    VIEW: (id: string | number) => string;
  };
  USERS: {
    ROOT: '/users';
    LIST: '/users';
  };
  ROLES: {
    ROOT: '/roles';
    LIST: '/roles';
  };
  SETTINGS: {
    ROOT: '/settings';
    GENERAL: '/settings/general';
  };
  PROFILE: {
    ROOT: '/profile';
    OVERVIEW: string;
    SECURITY: string;
    BILLING_PLANS: string;
    NOTIFICATIONS: string;
    CONNECTIONS: string;
  };
}
