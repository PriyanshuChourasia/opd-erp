import type { IModuleRegistry } from '../common/interfaces/module-registry.interface';

export const registry: IModuleRegistry = {
  id: 'financial-years',
  name: 'Financial Years Module',
  description: 'Manage financial year periods',
  version: '1.0.0',
  routePrefix: 'financial-years',
  features: [{
    id: 'financial-year-catalog', name: 'Financial Year Catalog', description: 'CRUD for financial years',
    capabilities: [{
      id: 'financial-year-crud', name: 'Financial Year CRUD', description: 'Full CRUD for financial years',
      actions: [
        { id: 'create-financial-year', name: 'Create Financial Year', description: 'Add a new financial year', method: 'POST', path: '/financial-years' },
        { id: 'list-financial-years', name: 'List Financial Years', description: 'List all financial years', method: 'GET', path: '/financial-years' },
        { id: 'get-financial-year', name: 'Get Financial Year', description: 'View financial year details', method: 'GET', path: '/financial-years/:id' },
        { id: 'update-financial-year', name: 'Update Financial Year', description: 'Update financial year info', method: 'PATCH', path: '/financial-years/:id' },
        { id: 'delete-financial-year', name: 'Delete Financial Year', description: 'Remove a financial year', method: 'DELETE', path: '/financial-years/:id' },
      ],
    }],
  }],
  dependencies: [{ name: 'Prisma' }],
};
