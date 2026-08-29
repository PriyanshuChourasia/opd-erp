import type { IModuleRegistry } from '../common/interfaces/module-registry.interface';

export const registry: IModuleRegistry = {
  id: 'doctors',
  name: 'Doctors Module',
  description: 'Doctor profiles, credentials, verification workflow, and schedule management',
  version: '3.0.0',
  routePrefix: 'doctors',
  features: [
    {
      id: 'doctor-crud',
      name: 'Doctor Management',
      description: 'Manage doctor professional profiles and credentials',
      capabilities: [
        {
          id: 'doctor-profiles',
          name: 'Doctor Profiles',
          description: 'Create and manage doctor professional data',
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
    {
      id: 'doctor-schedules',
      name: 'Doctor Schedules',
      description: 'Manage weekly working schedules for doctors',
      capabilities: [
        {
          id: 'schedule-crud',
          name: 'Schedule CRUD',
          description: 'Create, update, and delete doctor weekly schedules',
          actions: [
            { id: 'create-schedule', name: 'Create Schedule', description: 'Add a working day schedule for a doctor', method: 'POST', path: '/employee-schedules' },
            { id: 'list-schedules', name: 'List Schedules', description: 'List all schedules for a doctor', method: 'GET', path: '/employee-schedules' },
            { id: 'update-schedule', name: 'Update Schedule', description: 'Update a schedule entry', method: 'PATCH', path: '/employee-schedules/:id' },
            { id: 'delete-schedule', name: 'Delete Schedule', description: 'Remove a schedule entry', method: 'DELETE', path: '/employee-schedules/:id' },
          ],
        },
      ],
    },
  ],
  dependencies: [{ name: 'Prisma' }, { name: 'Users' }],
};
