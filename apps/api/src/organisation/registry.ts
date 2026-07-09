import type { IModuleRegistry } from '../common/interfaces/module-registry.interface';

export const registry: IModuleRegistry = {
  id: 'organisation',
  name: 'Organisation Module',
  description: 'Singleton clinic/organisation profile settings',
  version: '1.0.0',
  routePrefix: 'organisation',
  features: [
    {
      id: 'organisation-profile',
      name: 'Organisation Profile',
      description: 'View and update the clinic organisation profile',
      capabilities: [
        {
          id: 'organisation-settings',
          name: 'Organisation Settings',
          description: 'Manage the singleton organisation record',
          actions: [
            { id: 'get-organisation', name: 'Get Organisation', description: 'Fetch the organisation profile (auth required)', method: 'GET', path: '/organisation' },
            { id: 'update-organisation', name: 'Update Organisation', description: 'Create or update the organisation profile (auth required)', method: 'PATCH', path: '/organisation' },
          ],
        },
      ],
    },
  ],
  dependencies: [{ name: 'Prisma' }, { name: 'Auth' }],
};
