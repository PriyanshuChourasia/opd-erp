import type { IModuleRegistry } from '../common/interfaces/module-registry.interface';

export const registry: IModuleRegistry = {
  id: 'shifts',
  name: 'Shifts Module',
  description: 'Manage work shifts (Morning, Evening, Night, etc.) used in employee scheduling',
  version: '1.0.0',
  routePrefix: 'shifts',
  features: [
    {
      id: 'shift-management',
      name: 'Shift Management',
      description: 'Create and manage work shift definitions',
      capabilities: [
        {
          id: 'shift-crud',
          name: 'Shift CRUD',
          description: 'Full CRUD operations for shift definitions',
          actions: [
            { id: 'create-shift', name: 'Create Shift', description: 'Create a new shift definition', method: 'POST', path: '/shifts' },
            { id: 'list-shifts', name: 'List Shifts', description: 'List all shifts with search and pagination', method: 'GET', path: '/shifts' },
            { id: 'get-shift', name: 'Get Shift', description: 'View shift details', method: 'GET', path: '/shifts/:id' },
            { id: 'update-shift', name: 'Update Shift', description: 'Update shift information', method: 'PATCH', path: '/shifts/:id' },
            { id: 'delete-shift', name: 'Delete Shift', description: 'Remove a shift definition', method: 'DELETE', path: '/shifts/:id' },
          ],
        },
      ],
    },
  ],
  dependencies: [{ name: 'Prisma' }],
};
