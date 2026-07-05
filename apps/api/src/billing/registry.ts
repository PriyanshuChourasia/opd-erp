import type { IModuleRegistry } from '../common/interfaces/module-registry.interface';

export const registry: IModuleRegistry = {
  id: 'billing',
  name: 'Billing Module',
  description: 'Invoice generation, point-of-sale, discounts, refunds, and payment tracking',
  version: '1.0.0',
  routePrefix: 'billing',
  features: [
    {
      id: 'billing-management',
      name: 'Billing Management',
      description: 'Generate and manage invoices and payments',
      capabilities: [
        {
          id: 'invoice-crud',
          name: 'Invoice CRUD',
          description: 'Create, list, and manage invoices',
          actions: [
            { id: 'create-bill', name: 'Create Bill', description: 'Generate a new invoice', method: 'POST', path: '/billing' },
            { id: 'list-bills', name: 'List Bills', description: 'View all invoices', method: 'GET', path: '/billing' },
            { id: 'get-bill', name: 'Get Bill', description: 'View invoice details', method: 'GET', path: '/billing/:id' },
            { id: 'update-bill-status', name: 'Update Status', description: 'Mark invoice as paid/cancelled', method: 'PATCH', path: '/billing/:id/status' },
            { id: 'process-refund', name: 'Process Refund', description: 'Issue a refund against an invoice', method: 'POST', path: '/billing/:id/refund' },
          ],
        },
      ],
    },
  ],
  dependencies: [{ name: 'Prisma' }, { name: 'Patients' }, { name: 'Appointments' }],
};
