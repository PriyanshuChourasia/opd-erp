import type { IModuleRegistry } from '../common/interfaces/module-registry.interface';

export const registry: IModuleRegistry = {
  id: 'diagnoses',
  name: 'Diagnoses Module',
  description: 'Diagnosis catalog management — ICD codes, classification systems, and search',
  version: '2.0.0',
  routePrefix: 'diagnoses',
  features: [
    {
      id: 'diagnosis-management',
      name: 'Diagnosis Management',
      description: 'Manage the diagnosis catalog with ICD codes and descriptions',
      capabilities: [
        {
          id: 'diagnosis-crud',
          name: 'Diagnosis CRUD',
          description: 'Create, update, and manage diagnosis entries',
          actions: [
            { id: 'create-diagnosis', name: 'Create Diagnosis', description: 'Add a new diagnosis to the catalog', method: 'POST', path: '/diagnoses' },
            { id: 'list-diagnoses', name: 'List Diagnoses', description: 'Search and list diagnoses', method: 'GET', path: '/diagnoses' },
            { id: 'get-diagnosis', name: 'Get Diagnosis', description: 'View diagnosis details', method: 'GET', path: '/diagnoses/:id' },
            { id: 'update-diagnosis', name: 'Update Diagnosis', description: 'Update diagnosis information', method: 'PATCH', path: '/diagnoses/:id' },
            { id: 'delete-diagnosis', name: 'Delete Diagnosis', description: 'Remove a diagnosis from the catalog', method: 'DELETE', path: '/diagnoses/:id' },
          ],
        },
      ],
    },
    {
      id: 'diagnosis-systems',
      name: 'Diagnosis Classification Systems',
      description: 'Manage ICD and other classification systems',
      capabilities: [
        {
          id: 'system-crud',
          name: 'System CRUD',
          description: 'Create and manage diagnosis classification systems (ICD-10, SNOMED, etc.)',
          actions: [
            { id: 'create-system', name: 'Create System', description: 'Add a new classification system', method: 'POST', path: '/diagnosis-systems' },
            { id: 'list-systems', name: 'List Systems', description: 'List all classification systems', method: 'GET', path: '/diagnosis-systems' },
            { id: 'get-system', name: 'Get System', description: 'Get a classification system', method: 'GET', path: '/diagnosis-systems/:id' },
            { id: 'update-system', name: 'Update System', description: 'Update a classification system', method: 'PATCH', path: '/diagnosis-systems/:id' },
            { id: 'delete-system', name: 'Delete System', description: 'Remove a classification system', method: 'DELETE', path: '/diagnosis-systems/:id' },
          ],
        },
      ],
    },
  ],
  dependencies: [{ name: 'Prisma' }],
};
