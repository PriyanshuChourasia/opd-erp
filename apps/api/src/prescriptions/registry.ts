import type { IModuleRegistry } from '../common/interfaces/module-registry.interface';

export const registry: IModuleRegistry = {
  id: 'prescriptions',
  name: 'Prescriptions Module',
  description: 'E-prescriptions, medicine selection, dosage tracking, dispensing, and printing',
  version: '2.0.0',
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
          description: 'Create and manage prescriptions with medicine items',
          actions: [
            { id: 'create-prescription', name: 'Create Prescription', description: 'Generate a new e-prescription with medicine items', method: 'POST', path: '/prescriptions' },
            { id: 'list-prescriptions', name: 'List Prescriptions', description: 'Search prescriptions by patient, doctor, or status', method: 'GET', path: '/prescriptions' },
            { id: 'get-prescription', name: 'Get Prescription', description: 'View prescription details with items', method: 'GET', path: '/prescriptions/:id' },
            { id: 'update-prescription', name: 'Update Prescription', description: 'Update prescription details or items', method: 'PATCH', path: '/prescriptions/:id' },
            { id: 'delete-prescription', name: 'Delete Prescription', description: 'Remove a prescription', method: 'DELETE', path: '/prescriptions/:id' },
          ],
        },
      ],
    },
    {
      id: 'dispensing-management',
      name: 'Dispensing Management',
      description: 'Track medicine dispensing against prescriptions',
      capabilities: [
        {
          id: 'dispensing-operations',
          name: 'Dispensing Operations',
          description: 'Mark medicines as dispensed and track fulfillment',
          actions: [
            { id: 'create-dispensing', name: 'Record Dispensing', description: 'Record dispensing of prescribed medicines', method: 'POST', path: '/dispensing' },
            { id: 'list-dispensing', name: 'List Dispensing Records', description: 'List all dispensing records', method: 'GET', path: '/dispensing' },
            { id: 'get-dispensing', name: 'Get Dispensing Record', description: 'View a dispensing record', method: 'GET', path: '/dispensing/:id' },
          ],
        },
      ],
    },
  ],
  dependencies: [{ name: 'Prisma' }, { name: 'Medicine Catalog' }, { name: 'Patients' }],
};
