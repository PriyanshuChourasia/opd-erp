import type { IModuleRegistry } from '../common/interfaces/module-registry.interface';

export const registry: IModuleRegistry = {
  id: 'units',
  name: 'Units Module',
  description: 'Manage unit of measure master catalog (tablet, capsule, ml, etc.)',
  version: '1.0.0',
  routePrefix: 'units',
  features: [
    {
      id: 'unit-catalog',
      name: 'Unit Catalog',
      description: 'Create and manage units of measure as reference data for the clinic',
      capabilities: [
        {
          id: 'unit-crud',
          name: 'Unit CRUD',
          description: 'Full CRUD operations for unit definitions',
          actions: [
            { id: 'create-unit', name: 'Create Unit', description: 'Add a new unit to the catalog', method: 'POST', path: '/units' },
            { id: 'list-units', name: 'List Units', description: 'List all units with search and pagination', method: 'GET', path: '/units' },
            { id: 'get-unit', name: 'Get Unit', description: 'View unit details', method: 'GET', path: '/units/:id' },
            { id: 'update-unit', name: 'Update Unit', description: 'Update unit information', method: 'PATCH', path: '/units/:id' },
            { id: 'delete-unit', name: 'Delete Unit', description: 'Remove a unit from the catalog', method: 'DELETE', path: '/units/:id' },
          ],
        },
      ],
    },
  ],
  dependencies: [{ name: 'Prisma' }],
};
