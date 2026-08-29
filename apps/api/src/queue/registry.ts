import type { IModuleRegistry } from '../common/interfaces/module-registry.interface';

export const registry: IModuleRegistry = {
  id: 'queue',
  name: 'Queue Module',
  description: 'Patient queue management — add, call, complete, and display queue status',
  version: '2.0.0',
  routePrefix: 'queue',
  features: [
    {
      id: 'queue-management',
      name: 'Queue Management',
      description: 'Manage patient queues for doctors and display screens',
      capabilities: [
        {
          id: 'queue-operations',
          name: 'Queue Operations',
          description: 'Add, call, complete, and cancel queue entries',
          actions: [
            { id: 'add-to-queue', name: 'Add to Queue', description: 'Add a patient appointment to the doctor queue', method: 'POST', path: '/queue' },
            { id: 'get-queue', name: 'Get Queue', description: 'Get current queue for a doctor or all doctors', method: 'GET', path: '/queue' },
            { id: 'get-queue-entry', name: 'Get Queue Entry', description: 'Get a specific queue entry with patient details', method: 'GET', path: '/queue/:id' },
            { id: 'call-next', name: 'Call Next', description: 'Mark the next patient as IN_PROGRESS', method: 'PATCH', path: '/queue/:id/call' },
            { id: 'complete-visit', name: 'Complete Visit', description: 'Mark a queue entry as COMPLETED', method: 'PATCH', path: '/queue/:id/complete' },
            { id: 'cancel-queue', name: 'Cancel Queue Entry', description: 'Remove a patient from the queue', method: 'DELETE', path: '/queue/:id' },
          ],
        },
        {
          id: 'queue-display',
          name: 'Queue Display',
          description: 'Public display queue for waiting areas',
          actions: [
            { id: 'get-display-queue', name: 'Get Display Queue', description: 'Get queue status for public display screens', method: 'GET', path: '/queue/display' },
          ],
        },
      ],
    },
  ],
  dependencies: [{ name: 'Prisma' }, { name: 'Appointments' }],
};
