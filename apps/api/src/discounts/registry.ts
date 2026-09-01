import type { IModuleRegistry } from '../common/interfaces/module-registry.interface';

export const registry: IModuleRegistry = {
  id: 'discounts',
  name: 'Discount Rules Module',
  description: 'Admin-configured named discounts (e.g. seasonal offers, loyalty discounts) staff apply at payment time',
  version: '1.0.0',
  routePrefix: 'discounts',
  features: [
    {
      id: 'discount-rules',
      name: 'Discount Rules',
      description: 'Create and manage named, optionally time-boxed discount rules',
      capabilities: [
        {
          id: 'discount-rule-crud',
          name: 'Discount Rule CRUD',
          description: 'Full CRUD operations for discount rule definitions',
          actions: [
            { id: 'create-discount-rule', name: 'Create Discount Rule', description: 'Add a new discount rule', method: 'POST', path: '/discounts' },
            { id: 'list-discount-rules', name: 'List Discount Rules', description: 'List discount rules, optionally filtered to currently-valid ones', method: 'GET', path: '/discounts' },
            { id: 'get-discount-rule', name: 'Get Discount Rule', description: 'View discount rule details', method: 'GET', path: '/discounts/:id' },
            { id: 'update-discount-rule', name: 'Update Discount Rule', description: 'Update a discount rule', method: 'PATCH', path: '/discounts/:id' },
            { id: 'delete-discount-rule', name: 'Delete Discount Rule', description: 'Remove a discount rule not referenced by any bill', method: 'DELETE', path: '/discounts/:id' },
          ],
        },
      ],
    },
  ],
  dependencies: [{ name: 'Prisma' }],
};
