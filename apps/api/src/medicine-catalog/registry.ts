import type { IModuleRegistry } from '../common/interfaces/module-registry.interface';

export const registry: IModuleRegistry = {
  id: 'medicine-catalog',
  name: 'Medicine Catalog Module',
  description: 'Medicine catalog management — brands, generics, categories, pricing, and stock',
  version: '2.0.0',
  routePrefix: 'medicine-catalog',
  features: [
    {
      id: 'medicine-management',
      name: 'Medicine Management',
      description: 'Manage the medicine catalog with brands, generics, and pricing',
      capabilities: [
        {
          id: 'medicine-crud',
          name: 'Medicine CRUD',
          description: 'Create, update, and manage medicine entries',
          actions: [
            { id: 'create-medicine', name: 'Create Medicine', description: 'Add a new medicine to the catalog', method: 'POST', path: '/medicine-catalog' },
            { id: 'list-medicines', name: 'List Medicines', description: 'Search and list medicines with filters', method: 'GET', path: '/medicine-catalog' },
            { id: 'get-medicine', name: 'Get Medicine', description: 'View medicine details', method: 'GET', path: '/medicine-catalog/:id' },
            { id: 'update-medicine', name: 'Update Medicine', description: 'Update medicine information', method: 'PATCH', path: '/medicine-catalog/:id' },
            { id: 'delete-medicine', name: 'Delete Medicine', description: 'Remove a medicine from the catalog', method: 'DELETE', path: '/medicine-catalog/:id' },
          ],
        },
        {
          id: 'medicine-search',
          name: 'Medicine Search',
          description: 'Search medicines by name, generic, or brand',
          actions: [
            { id: 'search-medicines', name: 'Search Medicines', description: 'Search medicines by name, generic, or brand', method: 'GET', path: '/medicine-catalog?search=' },
          ],
        },
      ],
    },
  ],
  dependencies: [{ name: 'Prisma' }],
};
