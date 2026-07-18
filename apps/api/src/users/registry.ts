import type { IModuleRegistry } from '../common/interfaces/module-registry.interface';

export const registry: IModuleRegistry = {
  id: 'users',
  name: 'Users Module',
  description: 'Manage application user accounts with full CRUD, role assignment, and soft-delete',
  version: '2.0.0',
  routePrefix: 'users',
  features: [
    {
      id: 'user-management',
      name: 'User Management',
      description: 'Create, read, update, soft-delete, and restore user accounts',
      capabilities: [
        {
          id: 'user-crud',
          name: 'User CRUD',
          description: 'Full CRUD operations on user accounts',
          actions: [
            { id: 'list-users', name: 'List Users', description: 'Search and list users', method: 'GET', path: '/users' },
            { id: 'get-user', name: 'Get User', description: 'View user account details', method: 'GET', path: '/users/:id' },
            { id: 'create-user', name: 'Create User', description: 'Create a new user account with role assignment', method: 'POST', path: '/users' },
            { id: 'update-user', name: 'Update User', description: 'Update user account details and role', method: 'PATCH', path: '/users/:id' },
            { id: 'delete-user', name: 'Delete User', description: 'Soft-delete a user account', method: 'DELETE', path: '/users/:id' },
            { id: 'restore-user', name: 'Restore User', description: 'Restore a soft-deleted user account', method: 'PATCH', path: '/users/:id/restore' },
          ],
        },
        {
          id: 'roles-listing',
          name: 'Roles Listing',
          description: 'List available roles for user assignment forms',
          actions: [
            { id: 'list-roles', name: 'List Roles', description: 'Get all available roles for user management', method: 'GET', path: '/users/roles' },
          ],
        },
      ],
    },
  ],
  dependencies: [{ name: 'Prisma' }, { name: 'Auth' }],
};
