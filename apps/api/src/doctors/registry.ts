import type { IModuleRegistry } from '../common/interfaces/module-registry.interface';

export const registry: IModuleRegistry = {
  id: 'doctors',
  name: 'Doctors Module',
  description: 'Doctor professional profile management, verification workflow, and credentials',
  version: '2.0.0',
  routePrefix: 'doctors',
  features: [
    {
      id: 'doctor-crud',
      name: 'Doctor CRUD',
      description: 'Manage doctor professional profiles and credentials',
      capabilities: [
        {
          id: 'doctor-profiles',
          name: 'Doctor Profiles',
          description: 'Create and manage doctor professional data (personal info via User entity)',
          actions: [
            { id: 'create-doctor', name: 'Create Doctor', description: 'Register a new doctor profile', method: 'POST', path: '/doctors' },
            { id: 'list-doctors', name: 'List Doctors', description: 'List all doctors with search and pagination', method: 'GET', path: '/doctors' },
            { id: 'get-doctor', name: 'Get Doctor', description: 'View doctor professional details', method: 'GET', path: '/doctors/:id' },
            { id: 'update-doctor', name: 'Update Doctor', description: 'Update doctor professional information', method: 'PATCH', path: '/doctors/:id' },
            { id: 'delete-doctor', name: 'Delete Doctor', description: 'Remove a doctor profile', method: 'DELETE', path: '/doctors/:id' },
          ],
        },
        {
          id: 'doctor-verification',
          name: 'Doctor Verification',
          description: 'Manage doctor verification workflow',
          actions: [
            { id: 'update-verification', name: 'Update Verification', description: 'Update doctor verification status', method: 'PATCH', path: '/doctors/:id/verification' },
          ],
        },
      ],
    },
  ],
  dependencies: [{ name: 'Prisma' }, { name: 'Users' }],
};
