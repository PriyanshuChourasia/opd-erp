import type { IModuleRegistry } from '../common/interfaces/module-registry.interface';

export const registry: IModuleRegistry = {
  id: 'roles',
  name: 'Roles Module',
  description: 'Role-based access control — define roles and assign permissions to control system access',
  version: '2.0.0',
  routePrefix: 'roles',
  features: [
    {
      id: 'role-management',
      name: 'Role Management',
      description: 'Create, update, and manage roles with permission assignments',
      capabilities: [
        {
          id: 'role-crud',
          name: 'Role CRUD',
          description: 'Full lifecycle management of roles',
          actions: [
            { id: 'create-role', name: 'Create Role', description: 'Create a new role with optional permission assignments', method: 'POST', path: '/roles' },
            { id: 'list-roles', name: 'List Roles', description: 'List all roles with permission counts', method: 'GET', path: '/roles' },
            { id: 'get-role', name: 'Get Role', description: 'Get a role with its assigned permissions', method: 'GET', path: '/roles/:id' },
            { id: 'update-role', name: 'Update Role', description: 'Update role name, description, and permission assignments', method: 'PATCH', path: '/roles/:id' },
            { id: 'delete-role', name: 'Delete Role', description: 'Remove a role (system roles cannot be deleted)', method: 'DELETE', path: '/roles/:id' },
          ],
        },
      ],
    },
  ],
  dependencies: [{ name: 'Prisma' }, { name: 'Permissions' }],
};
