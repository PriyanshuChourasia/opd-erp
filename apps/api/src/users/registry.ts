import type { IModuleRegistry } from '../common/interfaces/module-registry.interface';

export const registry: IModuleRegistry = {
  id: 'users',
  name: 'Users Module',
  description: 'Read-only listing of application user accounts',
  version: '1.0.0',
  routePrefix: 'users',
  features: [
    {
      id: 'user-listing',
      name: 'User Listing',
      description: 'Search and list application users (PII excludes password/refresh tokens)',
      capabilities: [
        {
          id: 'user-search',
          name: 'User Search',
          description: 'Search users by name or email',
          actions: [
            { id: 'list-users', name: 'List Users', description: 'Search and list users (auth required)', method: 'GET', path: '/users' },
          ],
        },
      ],
    },
  ],
  dependencies: [{ name: 'Prisma' }, { name: 'Auth' }],
};
