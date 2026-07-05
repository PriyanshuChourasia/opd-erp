import type { IModuleRegistry } from '../common/interfaces/module-registry.interface';

export const registry: IModuleRegistry = {
  id: 'prescriptions',
  name: 'Prescriptions Module',
  description: 'E-prescriptions, medicine selection, dosage tracking, and printing',
  version: '1.0.0',
  routePrefix: 'prescriptions',
  features: [
    {
      id: 'prescription-management',
      name: 'Prescription Management',
      description: 'Digital prescription generation and management',
      capabilities: [
        {
          id: 'prescription-crud',
          name: 'Prescription CRUD',
          description: 'Create and manage prescriptions',
          actions: [
            { id: 'create-prescription', name: 'Create Prescription', description: 'Generate a new e-prescription', method: 'POST', path: '/prescriptions' },
            { id: 'list-prescriptions', name: 'List Prescriptions', description: 'Search prescriptions by patient', method: 'GET', path: '/prescriptions' },
            { id: 'get-prescription', name: 'Get Prescription', description: 'View prescription details', method: 'GET', path: '/prescriptions/:id' },
            { id: 'update-prescription', name: 'Update Prescription', description: 'Update prescription details', method: 'PATCH', path: '/prescriptions/:id' },
            { id: 'delete-prescription', name: 'Delete Prescription', description: 'Remove a prescription', method: 'DELETE', path: '/prescriptions/:id' },
          ],
        },
      ],
    },
  ],
  dependencies: [{ name: 'Prisma' }, { name: 'Medicine Catalog' }, { name: 'Patients' }],
};
