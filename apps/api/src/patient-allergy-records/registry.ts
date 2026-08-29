import type { IModuleRegistry } from '../common/interfaces/module-registry.interface';

export const registry: IModuleRegistry = {
  id: 'patient-allergy-records',
  name: 'Patient Allergy Records',
  description: 'Track patient-specific allergy records with severity, reaction, and status',
  version: '1.0.0',
  routePrefix: 'patient-allergy-records',
  features: [
    {
      id: 'patient-allergy-tracking',
      name: 'Patient Allergy Tracking',
      description: 'Manage allergy records for individual patients',
      capabilities: [
        {
          id: 'patient-allergy-crud',
          name: 'Patient Allergy CRUD',
          description: 'Full CRUD operations for patient allergy records',
          actions: [
            { id: 'create-patient-allergy', name: 'Create Patient Allergy', description: 'Record a new allergy for a patient', method: 'POST', path: '/patient-allergy-records' },
            { id: 'list-patient-allergies', name: 'List Patient Allergies', description: 'List allergy records for a patient', method: 'GET', path: '/patient-allergy-records' },
            { id: 'get-patient-allergy', name: 'Get Patient Allergy', description: 'Get a specific allergy record', method: 'GET', path: '/patient-allergy-records/:id' },
            { id: 'update-patient-allergy', name: 'Update Patient Allergy', description: 'Update an allergy record (e.g. change status)', method: 'PATCH', path: '/patient-allergy-records/:id' },
            { id: 'delete-patient-allergy', name: 'Delete Patient Allergy', description: 'Soft-delete an allergy record', method: 'DELETE', path: '/patient-allergy-records/:id' },
            { id: 'get-severe-allergies', name: 'Get Severe Allergies', description: 'Get severe/life-threatening allergies for a patient', method: 'GET', path: '/patient-allergy-records/severe/:patientId' },
          ],
        },
      ],
    },
  ],
  dependencies: [{ name: 'Prisma' }],
};
