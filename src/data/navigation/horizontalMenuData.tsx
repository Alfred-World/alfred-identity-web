import type { HorizontalMenuDataType } from '@/types/menuTypes';
import { ROUTES } from '@/configs/routes';

const horizontalMenuData = (): HorizontalMenuDataType[] => [
  {
    label: 'dashboards',
    icon: 'tabler-smart-home',
    children: [
      {
        label: 'crm',
        icon: 'tabler-chart-pie-2',
        href: ROUTES.DASHBOARDS.CRM
      }
    ]
  },
  {
    label: 'Applications',
    icon: 'tabler-apps',
    href: ROUTES.APPLICATIONS.LIST
  }
];

export default horizontalMenuData;
