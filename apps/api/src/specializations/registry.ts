import type { IModuleRegistry } from '../common/interfaces/module-registry.interface';

export const registry: IModuleRegistry = {
  id: 'specializations',
  name: 'Specializations Module',
  description: 'Manage the doctor specialization master catalog (Cardiology, Dermatology, etc.)',
  version: '1.0.0',
  routePrefix: 'specializations',
  features: [
    {
      id: 'specialization-catalog',
      name: 'Specialization Catalog',
      description: 'Create and manage doctor specializations as reference data for the clinic',
      capabilities: [
        {
          id: 'specialization-crud',
          name: 'Specialization CRUD',
          description: 'Full CRUD operations for specialization definitions',
          actions: [
            { id: 'create-specialization', name: 'Create Specialization', description: 'Add a new specialization to the catalog', method: 'POST', path: '/specializations' },
            { id: 'list-specializations', name: 'List Specializations', description: 'List all specializations with search and pagination', method: 'GET', path: '/specializations' },
            { id: 'get-specialization', name: 'Get Specialization', description: 'View specialization details', method: 'GET', path: '/specializations/:id' },
            { id: 'update-specialization', name: 'Update Specialization', description: 'Update specialization information', method: 'PATCH', path: '/specializations/:id' },
            { id: 'delete-specialization', name: 'Delete Specialization', description: 'Remove a specialization from the catalog', method: 'DELETE', path: '/specializations/:id' },
          ],
        },
      ],
    },
  ],
  dependencies: [{ name: 'Prisma' }],
};
