import type { IModuleRegistry } from '../common/interfaces/module-registry.interface';

export const registry: IModuleRegistry = {
  id: 'allergies',
  name: 'Allergies Module',
  description: 'Manage the allergy master catalog (drug, food, environmental, etc.)',
  version: '1.0.0',
  routePrefix: 'allergies',
  features: [
    {
      id: 'allergy-catalog',
      name: 'Allergy Catalog',
      description: 'Create and manage known allergies as reference data for patient records',
      capabilities: [
        {
          id: 'allergy-crud',
          name: 'Allergy CRUD',
          description: 'Full CRUD operations for allergy definitions',
          actions: [
            { id: 'create-allergy', name: 'Create Allergy', description: 'Add a new allergy to the catalog', method: 'POST', path: '/allergies' },
            { id: 'list-allergies', name: 'List Allergies', description: 'List all allergies with search and pagination', method: 'GET', path: '/allergies' },
            { id: 'get-allergy', name: 'Get Allergy', description: 'View allergy details', method: 'GET', path: '/allergies/:id' },
            { id: 'update-allergy', name: 'Update Allergy', description: 'Update allergy information', method: 'PATCH', path: '/allergies/:id' },
            { id: 'delete-allergy', name: 'Delete Allergy', description: 'Remove an allergy from the catalog', method: 'DELETE', path: '/allergies/:id' },
          ],
        },
      ],
    },
  ],
  dependencies: [{ name: 'Prisma' }],
};
