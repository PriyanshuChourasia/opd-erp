import type { IModuleRegistry } from '../common/interfaces/module-registry.interface';

export const registry: IModuleRegistry = {
  id: 'reports',
  name: 'Reports Module',
  description: 'Business reports — revenue, aging, doctor performance, fulfillment, and more',
  version: '1.0.0',
  routePrefix: 'reports',
  features: [
    {
      id: 'reporting',
      name: 'Reporting',
      description: 'Aggregated clinic reports and analytics',
      capabilities: [
        {
          id: 'revenue-by-category',
          name: 'Revenue by Category',
          description: 'Revenue grouped by bill item type and payment method',
          actions: [
            { id: 'get-revenue-by-category', name: 'Revenue by Category', description: 'Fetch revenue breakdown by category and payment method', method: 'GET', path: '/reports/revenue-by-category' },
          ],
        },
      ],
    },
  ],
  dependencies: [{ name: 'Prisma' }],
};
