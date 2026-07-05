import type { IModuleRegistry } from '../common/interfaces/module-registry.interface';

export const registry: IModuleRegistry = {
  id: 'dispensing',
  name: 'Dispensing Module',
  description: 'Pharmacy dispensing, partial fulfillment, substitution tracking, and inventory',
  version: '1.0.0',
  routePrefix: 'dispensing',
  features: [
    {
      id: 'dispensing-management',
      name: 'Dispensing Management',
      description: 'Manage prescription fulfillment and pharmacy operations',
      capabilities: [
        {
          id: 'dispensing-crud',
          name: 'Dispensing CRUD',
          description: 'Track and manage prescription dispensing',
          actions: [
            { id: 'create-dispensing', name: 'Create Dispensing Record', description: 'Start dispensing a prescription', method: 'POST', path: '/dispensing' },
            { id: 'list-dispensing', name: 'List Dispensing', description: 'View dispensing records', method: 'GET', path: '/dispensing' },
            { id: 'get-dispensing', name: 'Get Dispensing', description: 'View dispensing details', method: 'GET', path: '/dispensing/:id' },
            { id: 'update-dispensing', name: 'Update Dispensing', description: 'Update dispensing quantities', method: 'PATCH', path: '/dispensing/:id' },
            { id: 'cancel-dispensing', name: 'Cancel Dispensing', description: 'Cancel a dispensing record', method: 'DELETE', path: '/dispensing/:id' },
          ],
        },
      ],
    },
  ],
  dependencies: [{ name: 'Prisma' }, { name: 'Prescriptions' }, { name: 'Medicine Catalog' }],
};
