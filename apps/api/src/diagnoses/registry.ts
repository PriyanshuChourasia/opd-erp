import type { IModuleRegistry } from '../common/interfaces/module-registry.interface';

export const registry: IModuleRegistry = {
  id: 'diagnoses',
  name: 'Diagnoses Module',
  description: 'Manage the diagnosis master catalog used when recording prescriptions',
  version: '1.0.0',
  routePrefix: 'diagnoses',
  features: [
    {
      id: 'diagnosis-catalog',
      name: 'Diagnosis Catalog',
      description: 'Create and manage known diagnoses as reference data for prescriptions',
      capabilities: [
        {
          id: 'diagnosis-crud',
          name: 'Diagnosis CRUD',
          description: 'Full CRUD operations for diagnosis definitions',
          actions: [
            { id: 'create-diagnosis', name: 'Create Diagnosis', description: 'Add a new diagnosis to the catalog', method: 'POST', path: '/diagnoses' },
            { id: 'list-diagnoses', name: 'List Diagnoses', description: 'List all diagnoses with search and pagination', method: 'GET', path: '/diagnoses' },
            { id: 'get-diagnosis', name: 'Get Diagnosis', description: 'View diagnosis details', method: 'GET', path: '/diagnoses/:id' },
            { id: 'update-diagnosis', name: 'Update Diagnosis', description: 'Update diagnosis information', method: 'PATCH', path: '/diagnoses/:id' },
            { id: 'delete-diagnosis', name: 'Delete Diagnosis', description: 'Remove a diagnosis from the catalog', method: 'DELETE', path: '/diagnoses/:id' },
          ],
        },
      ],
    },
  ],
  dependencies: [{ name: 'Prisma' }],
};
