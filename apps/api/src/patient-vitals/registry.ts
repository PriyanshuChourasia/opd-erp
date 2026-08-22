import type { IModuleRegistry } from '../common/interfaces/module-registry.interface';

export const registry: IModuleRegistry = {
  id: 'patient-vitals',
  name: 'Patient Vitals Module',
  description: 'Record and view patient vital signs (height, weight, BP, pulse, SpO₂, temperature)',
  version: '1.0.0',
  routePrefix: 'patient-vitals',
  features: [
    {
      id: 'vitals-recording',
      name: 'Vitals Recording',
      description: 'Record new vital signs for patients — immutable historical records',
      capabilities: [
        {
          id: 'vitals-create',
          name: 'Record Vitals',
          description: 'Create a new vitals record for a patient (BMI auto-calculated)',
          actions: [
            { id: 'create-vitals', name: 'Record Vitals', description: 'Record new vitals for a patient', method: 'POST', path: '/patient-vitals' },
            { id: 'list-vitals', name: 'List Vitals', description: 'List vitals records for a patient', method: 'GET', path: '/patient-vitals' },
            { id: 'get-vitals', name: 'Get Vitals', description: 'Get a single vitals record', method: 'GET', path: '/patient-vitals/:id' },
            { id: 'get-latest-vitals', name: 'Get Latest Vitals', description: 'Get the most recent vitals for a patient', method: 'GET', path: '/patient-vitals/latest/:patientId' },
          ],
        },
      ],
    },
  ],
  dependencies: [{ name: 'Prisma' }],
};
