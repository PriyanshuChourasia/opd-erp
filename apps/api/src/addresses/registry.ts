import type { IModuleRegistry } from '../common/interfaces/module-registry.interface';

export const registry: IModuleRegistry = {
  id: 'addresses',
  name: 'Addresses Module',
  description: 'Polymorphic address management for Users, Doctors, Organisations, and other entities',
  version: '1.0.0',
  routePrefix: 'addresses',
  features: [
    {
      id: 'address-management',
      name: 'Address Management',
      description: 'Manage polymorphic addresses with primary address support',
      capabilities: [
        {
          id: 'address-crud',
          name: 'Address CRUD',
          description: 'Full CRUD operations for addresses',
          actions: [
            { id: 'create-address', name: 'Create Address', description: 'Create a new address for an entity', method: 'POST', path: '/addresses' },
            { id: 'list-addresses', name: 'List Addresses', description: 'List addresses with polymorphic filtering', method: 'GET', path: '/addresses' },
            { id: 'get-entity-addresses', name: 'Get Entity Addresses', description: 'Get all addresses for a specific entity', method: 'GET', path: '/addresses/by-entity' },
            { id: 'set-primary-address', name: 'Set Primary Address', description: 'Set an address as the primary for its entity', method: 'PATCH', path: '/addresses/:id/primary' },
            { id: 'get-address', name: 'Get Address', description: 'View address details', method: 'GET', path: '/addresses/:id' },
            { id: 'update-address', name: 'Update Address', description: 'Update address information', method: 'PATCH', path: '/addresses/:id' },
            { id: 'delete-address', name: 'Delete Address', description: 'Remove an address', method: 'DELETE', path: '/addresses/:id' },
          ],
        },
      ],
    },
  ],
  dependencies: [{ name: 'Prisma' }],
};
