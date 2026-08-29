import type { IModuleRegistry } from '../common/interfaces/module-registry.interface';

export const registry: IModuleRegistry = {
  id: 'diagnosis-systems',
  name: 'Diagnosis Systems Module',
  description: 'Manage diagnosis classification systems (e.g. ICD-10, SNOMED)',
  version: '1.0.0',
  routePrefix: 'diagnosis-systems',
  features: [
    {
      id: 'diagnosis-system-catalog',
      name: 'Diagnosis System Catalog',
      description: 'Create and manage diagnosis systems used to organize diagnoses',
      capabilities: [
        {
          id: 'diagnosis-system-crud',
          name: 'Diagnosis System CRUD',
          description: 'Full CRUD operations for diagnosis systems',
          actions: [
            { id: 'create-diagnosis-system', name: 'Create Diagnosis System', description: 'Add a new diagnosis system', method: 'POST', path: '/diagnosis-systems' },
            { id: 'list-diagnosis-systems', name: 'List Diagnosis Systems', description: 'List all diagnosis systems', method: 'GET', path: '/diagnosis-systems' },
            { id: 'get-diagnosis-system', name: 'Get Diagnosis System', description: 'View diagnosis system details', method: 'GET', path: '/diagnosis-systems/:id' },
            { id: 'update-diagnosis-system', name: 'Update Diagnosis System', description: 'Update diagnosis system information', method: 'PATCH', path: '/diagnosis-systems/:id' },
            { id: 'delete-diagnosis-system', name: 'Delete Diagnosis System', description: 'Remove a diagnosis system', method: 'DELETE', path: '/diagnosis-systems/:id' },
          ],
        },
      ],
    },
  ],
  dependencies: [{ name: 'Prisma' }],
};
