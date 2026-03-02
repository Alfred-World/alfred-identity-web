export const ROUTES = {
  // Home
  HOME: '/',

  // Guest Routes
  GUEST: {
    LOGIN: '/login',
    FORGOT_PASSWORD: '/forgot-password',
    RESET_PASSWORD: '/reset-password'
  },

  // Auth
  SIGNOUT: '/signout',

  // Dashboard Routes
  DASHBOARDS: {
    ROOT: '/dashboards',
    CRM: '/dashboards'
  },

  // Applications
  APPLICATIONS: {
    ROOT: '/applications',
    LIST: '/applications',
    CREATE: '/applications/create',
    EDIT: (id: string | number) => `/applications/${id}`,
    VIEW: (id: string | number) => `/applications/${id}`
  },

  // Users Management
  USERS: {
    ROOT: '/users',
    LIST: '/users'
  },

  // Roles Management
  ROLES: {
    ROOT: '/roles',
    LIST: '/roles'
  },

  // Settings
  SETTINGS: {
    ROOT: '/settings',
    ACCOUNT: '/settings/account'
  },
};
