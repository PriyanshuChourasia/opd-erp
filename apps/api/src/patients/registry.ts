import type { IModuleRegistry } from '../common/interfaces/module-registry.interface';

export const registry: IModuleRegistry = {
  id: 'patients',
  name: 'Patients Module',
  description: 'Patient registration, search, profile management, vitals tracking, and allergy records',
  version: '2.0.0',
  routePrefix: 'patients',
  features: [
    {
      id: 'patient-crud',
      name: 'Patient Management',
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
    {
      id: 'patient-vitals',
      name: 'Patient Vitals',
      description: 'Record and track patient vital signs over time',
      capabilities: [
        {
          id: 'vitals-crud',
          name: 'Vitals CRUD',
          description: 'Create and view patient vital sign records',
          actions: [
            { id: 'create-vitals', name: 'Record Vitals', description: 'Record new vital signs (height, weight, BP, temp, pulse, SpO2, respiratory rate)', method: 'POST', path: '/patient-vitals' },
            { id: 'list-vitals', name: 'List Vitals', description: 'List all vitals records for a patient', method: 'GET', path: '/patient-vitals' },
            { id: 'get-latest-vitals', name: 'Get Latest Vitals', description: 'Get the most recent vitals for a patient', method: 'GET', path: '/patient-vitals/latest' },
          ],
        },
      ],
    },
    {
      id: 'patient-allergies',
      name: 'Patient Allergy Records',
      description: 'Track patient allergies and link to the allergy catalog',
      capabilities: [
        {
          id: 'allergy-records-crud',
          name: 'Allergy Records CRUD',
          description: 'Create and manage patient allergy records',
          actions: [
            { id: 'create-allergy-record', name: 'Record Allergy', description: 'Link an allergy to a patient', method: 'POST', path: '/patient-allergy-records' },
            { id: 'list-allergy-records', name: 'List Allergies', description: 'List all allergies for a patient', method: 'GET', path: '/patient-allergy-records' },
            { id: 'delete-allergy-record', name: 'Remove Allergy', description: 'Remove an allergy record from a patient', method: 'DELETE', path: '/patient-allergy-records/:id' },
          ],
        },
      ],
    },
  ],
  dependencies: [{ name: 'Prisma' }, { name: 'Allergies' }],
};
