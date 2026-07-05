import type { IModuleRegistry } from '../common/interfaces/module-registry.interface';

export const registry: IModuleRegistry = {
  id: 'roles',
  name: 'Roles Module',
  description: 'Role-based access control — define roles and assign permissions',
  version: '1.0.0',
  routePrefix: 'roles',
  features: [
    {
      id: 'role-management',
      name: 'Role Management',
      description: 'Define and manage user roles with granular permissions',
      capabilities: [
        {
          id: 'role-crud',
          name: 'Role CRUD',
          description: 'Full lifecycle management of roles',
          actions: [
            { id: 'create-role', name: 'Create Role', description: 'Create a new role with permission assignments', method: 'POST', path: '/roles' },
            { id: 'list-roles', name: 'List Roles', description: 'List all roles with permission details', method: 'GET', path: '/roles' },
            { id: 'get-role', name: 'Get Role', description: 'View role details and permissions', method: 'GET', path: '/roles/:id' },
            { id: 'update-role', name: 'Update Role', description: 'Update role name, description, and permissions', method: 'PATCH', path: '/roles/:id' },
            { id: 'delete-role', name: 'Delete Role', description: 'Remove a role (system roles protected)', method: 'DELETE', path: '/roles/:id' },
          ],
        },
      ],
    },
  ],
  dependencies: [{ name: 'Prisma' }, { name: 'Permissions' }],
};
