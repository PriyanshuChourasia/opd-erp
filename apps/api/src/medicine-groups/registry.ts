import type { IModuleRegistry } from '../common/interfaces/module-registry.interface';

export const registry: IModuleRegistry = {
  id: 'medicine-groups',
  name: 'Medicine Groups Module',
  description: 'Manage medicine group master catalog (Antibiotics, Analgesics, etc.)',
  version: '1.0.0',
  routePrefix: 'medicine-groups',
  features: [
    {
      id: 'medicine-group-catalog',
      name: 'Medicine Group Catalog',
      description: 'Create and manage medicine groups as reference data for the clinic',
      capabilities: [
        {
          id: 'medicine-group-crud',
          name: 'Medicine Group CRUD',
          description: 'Full CRUD operations for medicine group definitions',
          actions: [
            { id: 'create-medicine-group', name: 'Create Medicine Group', description: 'Add a new medicine group to the catalog', method: 'POST', path: '/medicine-groups' },
            { id: 'list-medicine-groups', name: 'List Medicine Groups', description: 'List all medicine groups with search and pagination', method: 'GET', path: '/medicine-groups' },
            { id: 'get-medicine-group', name: 'Get Medicine Group', description: 'View medicine group details', method: 'GET', path: '/medicine-groups/:id' },
            { id: 'update-medicine-group', name: 'Update Medicine Group', description: 'Update medicine group information', method: 'PATCH', path: '/medicine-groups/:id' },
            { id: 'delete-medicine-group', name: 'Delete Medicine Group', description: 'Remove a medicine group from the catalog', method: 'DELETE', path: '/medicine-groups/:id' },
          ],
        },
      ],
    },
  ],
  dependencies: [{ name: 'Prisma' }],
};
