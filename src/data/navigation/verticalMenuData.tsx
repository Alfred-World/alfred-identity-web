// Type Imports
import type { VerticalMenuDataType } from '@/types/menuTypes'
import { ROUTES } from '@/configs/routes'

const verticalMenuData = (): VerticalMenuDataType[] => [
  // This is how you will normally render submenu
  {
    label: 'Dashboards',
    suffix: {
      label: '5',
      color: 'error'
    },
    icon: 'tabler-smart-home',
    children: [
      {
        label: 'crm',
        icon: 'tabler-circle',
        href: ROUTES.DASHBOARDS.CRM
      }
    ]
  },
  {
    label: 'Applications',
    icon: 'tabler-apps',
    href: ROUTES.APPLICATIONS.LIST
  }
]

export default verticalMenuData
