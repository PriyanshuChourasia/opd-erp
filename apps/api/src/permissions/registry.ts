import type { IModuleRegistry } from '../common/interfaces/module-registry.interface';

export const registry: IModuleRegistry = {
  id: 'permissions',
  name: 'Permissions Module',
  description: 'Granular permission rules — resource + action pairs that roles can reference',
  version: '1.0.0',
  routePrefix: 'permissions',
  features: [
    {
      id: 'permission-management',
      name: 'Permission Management',
      description: 'Define and manage permission rules',
      capabilities: [
        {
          id: 'permission-crud',
          name: 'Permission CRUD',
          description: 'Create, list, and delete permission rules',
          actions: [
            { id: 'create-permission', name: 'Create Permission', description: 'Add a new resource+action permission', method: 'POST', path: '/permissions' },
            { id: 'list-permissions', name: 'List Permissions', description: 'List all available permissions', method: 'GET', path: '/permissions' },
            { id: 'get-permission', name: 'Get Permission', description: 'View permission details', method: 'GET', path: '/permissions/:id' },
            { id: 'delete-permission', name: 'Delete Permission', description: 'Remove a permission rule', method: 'DELETE', path: '/permissions/:id' },
          ],
        },
      ],
    },
  ],
  dependencies: [{ name: 'Prisma' }],
};
