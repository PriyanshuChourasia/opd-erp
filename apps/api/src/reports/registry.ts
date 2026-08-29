import type { IModuleRegistry } from '../common/interfaces/module-registry.interface';

export const registry: IModuleRegistry = {
  id: 'reports',
  name: 'Reports Module',
  description: 'Business intelligence — revenue, outstanding bills, doctor performance, and top medicines',
  version: '3.0.0',
  routePrefix: 'reports',
  features: [
    {
      id: 'revenue-reporting',
      name: 'Revenue Reporting',
      description: 'Revenue analytics by category and payment method',
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
    {
      id: 'billing-reports',
      name: 'Billing Reports',
      description: 'Outstanding bills and payment tracking',
      capabilities: [
        {
          id: 'outstanding-bills',
          name: 'Outstanding Bills',
          description: 'Track unpaid and overdue bills with aging buckets',
          actions: [
            { id: 'get-outstanding-bills', name: 'Outstanding Bills', description: 'Get unpaid bills with aging analysis', method: 'GET', path: '/reports/outstanding-bills' },
          ],
        },
      ],
    },
    {
      id: 'doctor-performance',
      name: 'Doctor Performance',
      description: 'Doctor-level appointment and revenue metrics',
      capabilities: [
        {
          id: 'doctor-performance-report',
          name: 'Doctor Performance Report',
          description: 'Appointment counts, completion rates, no-show rates, and revenue per doctor',
          actions: [
            { id: 'get-doctor-performance', name: 'Doctor Performance', description: 'Get performance metrics for all doctors', method: 'GET', path: '/reports/doctor-performance' },
          ],
        },
      ],
    },
    {
      id: 'medicine-analytics',
      name: 'Medicine Analytics',
      description: 'Most prescribed medicines by volume and revenue',
      capabilities: [
        {
          id: 'top-medicines',
          name: 'Top Medicines',
          description: 'Most prescribed and highest-revenue medicines',
          actions: [
            { id: 'get-top-medicines', name: 'Top Medicines Report', description: 'Get the most prescribed medicines by frequency and revenue', method: 'GET', path: '/reports/top-medicines' },
          ],
        },
      ],
    },
  ],
  dependencies: [{ name: 'Prisma' }, { name: 'Prescriptions' }, { name: 'Billing' }],
};
