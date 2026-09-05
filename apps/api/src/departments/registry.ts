import type { IModuleRegistry } from '../common/interfaces/module-registry.interface';

export const registry: IModuleRegistry = {
  id: 'departments',
  name: 'Departments Module',
  description: 'Manage department master catalog',
  version: '1.0.0',
  routePrefix: 'departments',
  features: [{
    id: 'department-catalog', name: 'Department Catalog', description: 'CRUD for departments',
    capabilities: [{
      id: 'department-crud', name: 'Department CRUD', description: 'Full CRUD for departments',
      actions: [
        { id: 'create-department', name: 'Create Department', description: 'Add a new department', method: 'POST', path: '/departments' },
        { id: 'list-departments', name: 'List Departments', description: 'List all departments', method: 'GET', path: '/departments' },
        { id: 'get-department', name: 'Get Department', description: 'View department details', method: 'GET', path: '/departments/:id' },
        { id: 'update-department', name: 'Update Department', description: 'Update department info', method: 'PATCH', path: '/departments/:id' },
        { id: 'delete-department', name: 'Delete Department', description: 'Remove a department', method: 'DELETE', path: '/departments/:id' },
      ],
    }],
  }],
  dependencies: [{ name: 'Prisma' }],
};
