import type { IModuleRegistry } from '../common/interfaces/module-registry.interface';

export const registry: IModuleRegistry = {
  id: 'employee-schedules',
  name: 'Employee Schedules Module',
  description: 'Generic scheduling for doctors, nurses, receptionists, pharmacists, lab staff, and other employee types',
  version: '1.0.0',
  routePrefix: 'employee-schedules',
  features: [
    {
      id: 'schedule-management',
      name: 'Schedule Management',
      description: 'Manage employee availability with weekly recurring schedules',
      capabilities: [
        {
          id: 'schedule-crud',
          name: 'Schedule CRUD',
          description: 'Create, read, update, and delete weekly schedules',
          actions: [
            { id: 'create-schedule', name: 'Create Schedule', description: 'Create a new weekly schedule for an employee', method: 'POST', path: '/employee-schedules' },
            { id: 'list-schedules', name: 'List Schedules', description: 'List all schedules with polymorphic filtering', method: 'GET', path: '/employee-schedules' },
            { id: 'get-employee-schedules', name: 'Get Employee Schedules', description: 'Get all schedules for a specific employee', method: 'GET', path: '/employee-schedules/by-employee' },
            { id: 'get-schedule', name: 'Get Schedule', description: 'View schedule details', method: 'GET', path: '/employee-schedules/:id' },
            { id: 'update-schedule', name: 'Update Schedule', description: 'Update a schedule entry', method: 'PATCH', path: '/employee-schedules/:id' },
            { id: 'delete-schedule', name: 'Delete Schedule', description: 'Remove a schedule entry', method: 'DELETE', path: '/employee-schedules/:id' },
          ],
        },
      ],
    },
  ],
  dependencies: [{ name: 'Prisma' }, { name: 'Shifts' }],
};
