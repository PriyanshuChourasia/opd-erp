import type { IModuleRegistry } from '../common/interfaces/module-registry.interface';

export const registry: IModuleRegistry = {
  id: 'sidebar-config',
  name: 'Sidebar Configuration',
  description: 'Manage which sidebar menu items are visible to each role',
  version: '1.0.0',
  features: [
    {
      id: 'menu-management',
      name: 'Menu Item Management',
      description: 'CRUD operations for sidebar menu items',
      capabilities: [
        {
          id: 'menu-crud',
          name: 'Menu CRUD',
          description: 'Create, read, update, and delete sidebar menu items',
          actions: [
            { id: 'list', name: 'List Menu Items', description: 'Get all sidebar menu items with role assignments', method: 'GET', path: '/sidebar-config' },
            { id: 'create', name: 'Create Menu Item', description: 'Add a new sidebar menu item', method: 'POST', path: '/sidebar-config' },
            { id: 'update', name: 'Update Menu Item', description: 'Update a sidebar menu item', method: 'PATCH', path: '/sidebar-config/:id' },
            { id: 'delete', name: 'Delete Menu Item', description: 'Remove a sidebar menu item', method: 'DELETE', path: '/sidebar-config/:id' },
          ],
        },
        {
          id: 'role-assignment',
          name: 'Role Assignment',
          description: 'Assign/revoke menu items to/from roles',
          actions: [
            { id: 'for-role', name: 'Get Menu for Role', description: 'Get menu items visible to a specific role', method: 'GET', path: '/sidebar-config/for-role/:roleId' },
            { id: 'assign-roles', name: 'Assign Roles', description: 'Set which roles can see a menu item', method: 'PATCH', path: '/sidebar-config/:id/assign-roles' },
          ],
        },
      ],
    },
  ],
};
