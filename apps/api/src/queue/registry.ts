import type { IModuleRegistry } from '../common/interfaces/module-registry.interface';

export const registry: IModuleRegistry = {
  id: 'queue',
  name: 'Queue Management Module',
  description: 'Live token queue with status tracking, check-in, and priority management',
  version: '1.0.0',
  routePrefix: 'queue',
  features: [
    {
      id: 'queue-management',
      name: 'Queue Management',
      description: 'Real-time patient queue with token system',
      capabilities: [
        {
          id: 'queue-entries',
          name: 'Queue Entries',
          description: 'Manage individual queue entries',
          actions: [
            { id: 'add-to-queue', name: 'Add to Queue', description: 'Create a new queue entry with auto token', method: 'POST', path: '/queue' },
            { id: 'list-queue', name: 'List Queue', description: 'View queue filtered by doctor and date', method: 'GET', path: '/queue' },
            { id: 'get-queue-entry', name: 'Get Queue Entry', description: 'View queue entry details', method: 'GET', path: '/queue/:id' },
            { id: 'update-status', name: 'Update Status', description: 'Advance queue status (WAITING→IN_PROGRESS→COMPLETED)', method: 'PATCH', path: '/queue/:id/status' },
            { id: 'remove-queue-entry', name: 'Remove Entry', description: 'Delete a queue entry', method: 'DELETE', path: '/queue/:id' },
          ],
        },
      ],
    },
  ],
  dependencies: [{ name: 'Prisma' }, { name: 'Patients' }, { name: 'Doctors' }],
};
