import type { IModuleRegistry } from '../common/interfaces/module-registry.interface';

export const registry: IModuleRegistry = {
  id: 'procedure-orders',
  name: 'Procedure Orders Module',
  description: 'Medical procedure ordering, scheduling, and result tracking',
  version: '1.0.0',
  routePrefix: 'procedure-orders',
  features: [
    {
      id: 'procedure-order-management',
      name: 'Procedure Order Management',
      description: 'Order and track medical procedures',
      capabilities: [
        {
          id: 'procedure-order-crud',
          name: 'Procedure Order CRUD',
          description: 'Create and manage procedure orders',
          actions: [
            { id: 'create-procedure-order', name: 'Create Order', description: 'Order a medical procedure', method: 'POST', path: '/procedure-orders' },
            { id: 'list-procedure-orders', name: 'List Orders', description: 'View all procedure orders', method: 'GET', path: '/procedure-orders' },
            { id: 'get-procedure-order', name: 'Get Order', description: 'View procedure order details', method: 'GET', path: '/procedure-orders/:id' },
            { id: 'update-procedure-result', name: 'Update Result', description: 'Record procedure results', method: 'PATCH', path: '/procedure-orders/:id' },
            { id: 'cancel-procedure-order', name: 'Cancel Order', description: 'Cancel a procedure order', method: 'DELETE', path: '/procedure-orders/:id' },
          ],
        },
      ],
    },
  ],
  dependencies: [{ name: 'Prisma' }, { name: 'Prescriptions' }],
};
