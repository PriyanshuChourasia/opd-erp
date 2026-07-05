import type { IModuleRegistry } from '../common/interfaces/module-registry.interface';

export const registry: IModuleRegistry = {
  id: 'doctor-schedules',
  name: 'Doctor Schedules Module',
  description: 'Weekly recurring schedules, slot generation, and availability management',
  version: '1.0.0',
  routePrefix: 'doctor-schedules',
  features: [
    {
      id: 'schedule-management',
      name: 'Schedule Management',
      description: 'Manage doctor availability with recurring weekly schedules',
      capabilities: [
        {
          id: 'schedule-crud',
          name: 'Schedule CRUD',
          description: 'Upsert and manage weekly schedules',
          actions: [
            { id: 'upsert-schedule', name: 'Upsert Schedule', description: 'Create or update a weekly schedule for a doctor/day', method: 'POST', path: '/doctor-schedules' },
            { id: 'list-schedules', name: 'List Schedules', description: 'View all schedules for a doctor', method: 'GET', path: '/doctor-schedules/doctor/:doctorId' },
            { id: 'delete-schedule', name: 'Delete Schedule', description: 'Remove a schedule entry', method: 'DELETE', path: '/doctor-schedules/:id' },
          ],
        },
        {
          id: 'slot-generation',
          name: 'Slot Generation',
          description: 'Generate available appointment slots from schedules',
          actions: [
            { id: 'get-slots', name: 'Get Slots', description: 'Generate available time slots for a doctor on a given date', method: 'GET', path: '/doctor-schedules/:doctorId/slots' },
          ],
        },
      ],
    },
  ],
  dependencies: [{ name: 'Prisma' }, { name: 'Doctors' }, { name: 'Appointments' }],
};
