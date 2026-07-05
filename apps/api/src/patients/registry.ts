import type { IModuleRegistry } from '../common/interfaces/module-registry.interface';

export const registry: IModuleRegistry = {
  id: 'patients',
  name: 'Patients Module',
  description: 'Patient registration, search, and profile management',
  version: '1.0.0',
  routePrefix: 'patients',
  features: [
    {
      id: 'patient-crud',
      name: 'Patient CRUD',
      description: 'Full lifecycle management of patient records',
      capabilities: [
        {
          id: 'patient-registration',
          name: 'Patient Registration',
          description: 'Register new patients with demographic and contact info',
          actions: [
            { id: 'create-patient', name: 'Create Patient', description: 'Register a new patient', method: 'POST', path: '/patients' },
            { id: 'list-patients', name: 'List Patients', description: 'Search and list patients', method: 'GET', path: '/patients' },
            { id: 'get-patient', name: 'Get Patient', description: 'View patient details', method: 'GET', path: '/patients/:id' },
            { id: 'update-patient', name: 'Update Patient', description: 'Update patient information', method: 'PATCH', path: '/patients/:id' },
            { id: 'delete-patient', name: 'Delete Patient', description: 'Remove a patient record', method: 'DELETE', path: '/patients/:id' },
          ],
        },
        {
          id: 'patient-search',
          name: 'Patient Search',
          description: 'Advanced search across patient records',
          actions: [
            { id: 'search-patients', name: 'Search Patients', description: 'Search by name, phone, or email', method: 'GET', path: '/patients?search=' },
          ],
        },
      ],
    },
  ],
  dependencies: [{ name: 'Prisma' }],
};
