import type { IModuleRegistry } from '../common/interfaces/module-registry.interface';

export const registry: IModuleRegistry = {
  id: 'lab-orders',
  name: 'Lab Orders Module',
  description: 'Lab test ordering, result recording, and status tracking',
  version: '1.0.0',
  routePrefix: 'lab-orders',
  features: [
    {
      id: 'lab-order-management',
      name: 'Lab Order Management',
      description: 'Order and track laboratory tests',
      capabilities: [
        {
          id: 'lab-order-crud',
          name: 'Lab Order CRUD',
          description: 'Create and manage lab test orders',
          actions: [
            { id: 'create-lab-order', name: 'Create Lab Order', description: 'Order a lab test', method: 'POST', path: '/lab-orders' },
            { id: 'list-lab-orders', name: 'List Lab Orders', description: 'View all lab orders', method: 'GET', path: '/lab-orders' },
            { id: 'get-lab-order', name: 'Get Lab Order', description: 'View lab order details', method: 'GET', path: '/lab-orders/:id' },
            { id: 'update-lab-result', name: 'Update Lab Result', description: 'Record lab test results', method: 'PATCH', path: '/lab-orders/:id' },
            { id: 'cancel-lab-order', name: 'Cancel Lab Order', description: 'Cancel a lab order', method: 'DELETE', path: '/lab-orders/:id' },
          ],
        },
      ],
    },
  ],
  dependencies: [{ name: 'Prisma' }, { name: 'Prescriptions' }],
};
