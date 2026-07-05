import type { IModuleRegistry } from '../common/interfaces/module-registry.interface';

export const registry: IModuleRegistry = {
  id: 'medicine-catalog',
  name: 'Medicine Catalog Module',
  description: 'Drug master management, search, autocomplete, and formulary control',
  version: '1.0.0',
  routePrefix: 'medicine-catalog',
  features: [
    {
      id: 'catalog-management',
      name: 'Catalog Management',
      description: 'Manage the medicine/drug master database',
      capabilities: [
        {
          id: 'catalog-crud',
          name: 'Catalog CRUD',
          description: 'Add, search, edit, and remove medicines',
          actions: [
            { id: 'create-medicine', name: 'Create Medicine', description: 'Add a new medicine to catalog', method: 'POST', path: '/medicine-catalog' },
            { id: 'list-medicines', name: 'List Medicines', description: 'Browse the medicine catalog', method: 'GET', path: '/medicine-catalog' },
            { id: 'search-medicines', name: 'Search Medicines', description: 'Autocomplete search by brand/generic name', method: 'GET', path: '/medicine-catalog/search' },
            { id: 'update-medicine', name: 'Update Medicine', description: 'Update medicine details', method: 'PATCH', path: '/medicine-catalog/:id' },
            { id: 'delete-medicine', name: 'Delete Medicine', description: 'Remove a medicine from catalog', method: 'DELETE', path: '/medicine-catalog/:id' },
          ],
        },
      ],
    },
  ],
  dependencies: [{ name: 'Prisma' }],
};
