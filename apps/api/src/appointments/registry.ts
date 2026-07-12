import type { IModuleRegistry } from '../common/interfaces/module-registry.interface';

export const registry: IModuleRegistry = {
  id: 'appointments',
  name: 'Appointments Module',
  description: 'Appointment booking, scheduling, status tracking, and calendar management',
  version: '1.0.0',
  routePrefix: 'appointments',
  features: [
    {
      id: 'appointment-management',
      name: 'Appointment Management',
      description: 'Full lifecycle of patient appointments',
      capabilities: [
        {
          id: 'appointment-crud',
          name: 'Appointment CRUD',
          description: 'Create and manage appointments',
          actions: [
            { id: 'create-appointment', name: 'Create Appointment', description: 'Book a new appointment', method: 'POST', path: '/appointments' },
            { id: 'list-appointments', name: 'List Appointments', description: 'List appointments with filters', method: 'GET', path: '/appointments' },
            { id: 'get-appointment', name: 'Get Appointment', description: 'View appointment details', method: 'GET', path: '/appointments/:id' },
            { id: 'update-status', name: 'Update Status', description: 'Update appointment status', method: 'PATCH', path: '/appointments/:id/status' },
            { id: 'invoice-preview', name: 'Invoice Preview', description: 'Get a draft invoice (consultation fee line item) for checkout', method: 'GET', path: '/appointments/:id/invoice-preview' },
            { id: 'delete-appointment', name: 'Delete Appointment', description: 'Cancel an appointment', method: 'DELETE', path: '/appointments/:id' },
          ],
        },
      ],
    },
  ],
  dependencies: [{ name: 'Prisma' }, { name: 'Patients' }, { name: 'Doctors' }],
};
