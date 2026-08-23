import type { IModuleRegistry } from '../common/interfaces/module-registry.interface';

export const registry: IModuleRegistry = {
  id: 'financial-year',
  name: 'Financial Year Module',
  description: 'Manage accounting periods (financial years) for the clinic',
  version: '1.0.0',
  routePrefix: 'financial-years',
  features: [
    {
      id: 'financial-year-management',
      name: 'Financial Year Management',
      description: 'Create, update, activate, and delete financial years',
      capabilities: [
        {
          id: 'financial-year-crud',
          name: 'Financial Year CRUD',
          description: 'Full lifecycle management of financial years',
          actions: [
            { id: 'list-financial-years', name: 'List Financial Years', description: 'List all financial years for the organisation', method: 'GET', path: '/financial-years' },
            { id: 'get-financial-year', name: 'Get Financial Year', description: 'Get a single financial year by ID', method: 'GET', path: '/financial-years/:id' },
            { id: 'get-active-financial-year', name: 'Get Active Financial Year', description: 'Get the currently active financial year', method: 'GET', path: '/financial-years/active' },
            { id: 'create-financial-year', name: 'Create Financial Year', description: 'Create a new financial year', method: 'POST', path: '/financial-years' },
            { id: 'update-financial-year', name: 'Update Financial Year', description: 'Update an existing financial year', method: 'PATCH', path: '/financial-years/:id' },
            { id: 'activate-financial-year', name: 'Activate Financial Year', description: 'Set a financial year as the active one', method: 'PATCH', path: '/financial-years/:id/activate' },
            { id: 'delete-financial-year', name: 'Delete Financial Year', description: 'Remove a financial year', method: 'DELETE', path: '/financial-years/:id' },
          ],
        },
      ],
    },
  ],
  dependencies: [{ name: 'Prisma' }, { name: 'Auth' }, { name: 'Organisation' }],
};
