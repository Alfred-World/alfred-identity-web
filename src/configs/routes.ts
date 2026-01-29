export const ROUTES = {
  HOME: '/',
  DASHBOARDS: {
    ROOT: '/dashboards',
    CRM: '/dashboards/crm'
  },
  APPLICATIONS: {
    LIST: '/applications',
    CREATE: '/applications/create',
    EDIT: (id: string | number) => `/applications/${id}`
  }
}
