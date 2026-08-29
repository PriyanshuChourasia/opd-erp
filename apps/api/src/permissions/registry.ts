import type { IModuleRegistry } from '../common/interfaces/module-registry.interface';

export const registry: IModuleRegistry = {
  id: 'permissions',
  name: 'Permissions Module',
  description: 'Granular permission rules — resource + action pairs that roles reference for access control',
  version: '2.0.0',
  routePrefix: 'permissions',
  features: [
    {
      id: 'permission-management',
      name: 'Permission Management',
      description: 'Create, update, and manage granular permission rules',
      capabilities: [
        {
          id: 'permission-crud',
          name: 'Permission CRUD',
          description: 'Full lifecycle management of permission rules',
          actions: [
            { id: 'create-permission', name: 'Create Permission', description: 'Create a new permission (resource + action pair)', method: 'POST', path: '/permissions' },
            { id: 'list-permissions', name: 'List Permissions', description: 'List all permissions with pagination', method: 'GET', path: '/permissions' },
            { id: 'get-permission', name: 'Get Permission', description: 'Get a single permission by ID', method: 'GET', path: '/permissions/:id' },
            { id: 'update-permission', name: 'Update Permission', description: 'Update a permission rule', method: 'PATCH', path: '/permissions/:id' },
            { id: 'delete-permission', name: 'Delete Permission', description: 'Remove a permission rule', method: 'DELETE', path: '/permissions/:id' },
          ],
        },
      ],
    },
    {
      id: 'permission-matrix',
      name: 'Permission Matrix',
      description: 'View and manage the role-permission matrix across all resources',
      capabilities: [
        {
          id: 'matrix-view',
          name: 'Matrix View',
          description: 'View which roles have access to which resources',
          actions: [
            { id: 'get-matrix', name: 'Get Permission Matrix', description: 'Get the full role-permission matrix', method: 'GET', path: '/permissions/matrix' },
          ],
        },
      ],
    },
  ],
  dependencies: [{ name: 'Prisma' }],
};
