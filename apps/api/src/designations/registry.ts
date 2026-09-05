import type { IModuleRegistry } from '../common/interfaces/module-registry.interface';

export const registry: IModuleRegistry = {
  id: 'designations',
  name: 'Designations Module',
  description: 'Manage designation master catalog',
  version: '1.0.0',
  routePrefix: 'designations',
  features: [{
    id: 'designation-catalog', name: 'Designation Catalog', description: 'CRUD for designations',
    capabilities: [{
      id: 'designation-crud', name: 'Designation CRUD', description: 'Full CRUD for designations',
      actions: [
        { id: 'create-designation', name: 'Create Designation', description: 'Add a new designation', method: 'POST', path: '/designations' },
        { id: 'list-designations', name: 'List Designations', description: 'List all designations', method: 'GET', path: '/designations' },
        { id: 'get-designation', name: 'Get Designation', description: 'View designation details', method: 'GET', path: '/designations/:id' },
        { id: 'update-designation', name: 'Update Designation', description: 'Update designation info', method: 'PATCH', path: '/designations/:id' },
        { id: 'delete-designation', name: 'Delete Designation', description: 'Remove a designation', method: 'DELETE', path: '/designations/:id' },
      ],
    }],
  }],
  dependencies: [{ name: 'Prisma' }],
};
