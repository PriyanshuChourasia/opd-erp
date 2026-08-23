import type { IModuleRegistry } from '../common/interfaces/module-registry.interface';

export const registry: IModuleRegistry = {
  id: 'appointments',
  name: 'Appointments Module',
  description: 'Appointment booking, scheduling, status tracking, queue management, and slot generation',
  version: '2.0.0',
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
            { id: 'update-appointment', name: 'Update Appointment', description: 'Update appointment details', method: 'PATCH', path: '/appointments/:id' },
            { id: 'update-status', name: 'Update Status', description: 'Update appointment status', method: 'PATCH', path: '/appointments/:id/status' },
            { id: 'invoice-preview', name: 'Invoice Preview', description: 'Get a draft invoice for checkout', method: 'GET', path: '/appointments/:id/invoice-preview' },
            { id: 'delete-appointment', name: 'Delete Appointment', description: 'Cancel an appointment', method: 'DELETE', path: '/appointments/:id' },
          ],
        },
      ],
    },
    {
      id: 'slot-management',
      name: 'Slot Management',
      description: 'Generate and manage appointment time slots for doctors',
      capabilities: [
        {
          id: 'slot-generation',
          name: 'Slot Generation',
          description: 'Auto-generate time slots based on doctor schedules',
          actions: [
            { id: 'generate-slots', name: 'Generate Slots', description: 'Generate available slots for a doctor on a given date', method: 'POST', path: '/appointments/slots/generate' },
            { id: 'get-slots', name: 'Get Slots', description: 'Get available slots for a doctor', method: 'GET', path: '/appointments/slots' },
          ],
        },
      ],
    },
    {
      id: 'queue-management',
      name: 'Queue Management',
      description: 'Patient queue tracking and status updates',
      capabilities: [
        {
          id: 'queue-operations',
          name: 'Queue Operations',
          description: 'Add patients to queue, call, and complete visits',
          actions: [
            { id: 'add-to-queue', name: 'Add to Queue', description: 'Add a patient to the doctor queue', method: 'POST', path: '/queue' },
            { id: 'get-queue', name: 'Get Queue', description: 'Get current queue for a doctor', method: 'GET', path: '/queue' },
            { id: 'call-next', name: 'Call Next', description: 'Call the next patient in queue', method: 'PATCH', path: '/queue/:id/call' },
            { id: 'complete-visit', name: 'Complete Visit', description: 'Mark a queue entry as completed', method: 'PATCH', path: '/queue/:id/complete' },
            { id: 'cancel-queue', name: 'Cancel Queue Entry', description: 'Remove a patient from queue', method: 'DELETE', path: '/queue/:id' },
          ],
        },
      ],
    },
  ],
  dependencies: [{ name: 'Prisma' }, { name: 'Patients' }, { name: 'Doctors' }],
};
