import type { IModuleRegistry } from '../common/interfaces/module-registry.interface';

export const registry: IModuleRegistry = {
  id: 'doctors',
  name: 'Doctors Module',
  description: 'Doctor profile management, specializations, and license tracking',
  version: '1.0.0',
  routePrefix: 'doctors',
  features: [
    {
      id: 'doctor-crud',
      name: 'Doctor CRUD',
      description: 'Manage doctor profiles and credentials',
      capabilities: [
        {
          id: 'doctor-profiles',
          name: 'Doctor Profiles',
          description: 'Create and manage doctor information',
          actions: [
            { id: 'create-doctor', name: 'Create Doctor', description: 'Register a new doctor', method: 'POST', path: '/doctors' },
            { id: 'list-doctors', name: 'List Doctors', description: 'List all doctors with search', method: 'GET', path: '/doctors' },
            { id: 'get-doctor', name: 'Get Doctor', description: 'View doctor details', method: 'GET', path: '/doctors/:id' },
            { id: 'update-doctor', name: 'Update Doctor', description: 'Update doctor information', method: 'PATCH', path: '/doctors/:id' },
            { id: 'delete-doctor', name: 'Delete Doctor', description: 'Remove a doctor profile', method: 'DELETE', path: '/doctors/:id' },
          ],
        },
      ],
    },
  ],
  dependencies: [{ name: 'Prisma' }],
};
