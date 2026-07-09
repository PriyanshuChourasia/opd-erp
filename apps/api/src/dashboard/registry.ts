import type { IModuleRegistry } from '../common/interfaces/module-registry.interface';

export const registry: IModuleRegistry = {
  id: 'dashboard',
  name: 'Dashboard Module',
  description: 'Home-screen summary stats and reporting charts',
  version: '1.0.0',
  routePrefix: 'dashboard',
  features: [
    {
      id: 'dashboard-overview',
      name: 'Dashboard Overview',
      description: 'Aggregated clinic stats and chart data for the home screen',
      capabilities: [
        {
          id: 'summary-stats',
          name: 'Summary Stats',
          description: "Today's appointments, queue size, registered patients, pending prescriptions",
          actions: [
            { id: 'get-stats', name: 'Get Stats', description: 'Fetch dashboard stat tiles', method: 'GET', path: '/dashboard/stats' },
          ],
        },
        {
          id: 'reporting-charts',
          name: 'Reporting Charts',
          description: 'Revenue trend, appointment/bill status breakdowns, doctor load, top medicines, recent activity',
          actions: [
            { id: 'get-charts', name: 'Get Charts', description: 'Fetch dashboard chart datasets', method: 'GET', path: '/dashboard/charts' },
          ],
        },
      ],
    },
  ],
  dependencies: [{ name: 'Prisma' }],
};
