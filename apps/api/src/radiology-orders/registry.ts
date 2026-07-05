import type { IModuleRegistry } from '../common/interfaces/module-registry.interface';

export const registry: IModuleRegistry = {
  id: 'radiology-orders',
  name: 'Radiology Orders Module',
  description: 'Radiology/imaging test ordering, result recording, and status tracking',
  version: '1.0.0',
  routePrefix: 'radiology-orders',
  features: [
    {
      id: 'radiology-order-management',
      name: 'Radiology Order Management',
      description: 'Order and track imaging studies',
      capabilities: [
        {
          id: 'radiology-order-crud',
          name: 'Radiology Order CRUD',
          description: 'Create and manage imaging orders',
          actions: [
            { id: 'create-radiology-order', name: 'Create Order', description: 'Order an imaging study', method: 'POST', path: '/radiology-orders' },
            { id: 'list-radiology-orders', name: 'List Orders', description: 'View all imaging orders', method: 'GET', path: '/radiology-orders' },
            { id: 'get-radiology-order', name: 'Get Order', description: 'View imaging order details', method: 'GET', path: '/radiology-orders/:id' },
            { id: 'update-radiology-result', name: 'Update Result', description: 'Record imaging results', method: 'PATCH', path: '/radiology-orders/:id' },
            { id: 'cancel-radiology-order', name: 'Cancel Order', description: 'Cancel an imaging order', method: 'DELETE', path: '/radiology-orders/:id' },
          ],
        },
      ],
    },
  ],
  dependencies: [{ name: 'Prisma' }, { name: 'Prescriptions' }],
};
