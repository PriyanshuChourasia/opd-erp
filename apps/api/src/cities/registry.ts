import type { IModuleRegistry } from '../common/interfaces/module-registry.interface';

export const registry: IModuleRegistry = {
  id: 'cities',
  name: 'Cities Module',
  description: 'Auto-growing city catalog per state for address forms',
  version: '1.0.0',
  routePrefix: 'cities',
  features: [
    {
      id: 'city-catalog',
      name: 'City Catalog',
      description: 'Cities typed against a state are cataloged on first use and offered in state-scoped city selects afterwards',
      capabilities: [
        {
          id: 'city-crud',
          name: 'City CRUD',
          description: 'Find-or-create on read, plus full CRUD for city catalog rows',
          actions: [
            { id: 'list-cities', name: 'List Cities', description: 'List cities, optionally by state; name+state finds-or-creates', method: 'GET', path: '/cities' },
            { id: 'list-cities-by-state', name: 'Cities By State', description: 'List the city catalog for one state', method: 'GET', path: '/cities/by-state/:state' },
            { id: 'create-city', name: 'Create City', description: 'Add a city to the catalog', method: 'POST', path: '/cities' },
            { id: 'find-or-create-city', name: 'Find Or Create City', description: 'Return the (name, state) row, creating it on first use', method: 'POST', path: '/cities/find-or-create' },
            { id: 'get-city', name: 'Get City', description: 'View city details', method: 'GET', path: '/cities/:id' },
            { id: 'update-city', name: 'Update City', description: 'Update city information', method: 'PATCH', path: '/cities/:id' },
            { id: 'delete-city', name: 'Delete City', description: 'Deactivate a city catalog row', method: 'DELETE', path: '/cities/:id' },
          ],
        },
      ],
    },
  ],
  dependencies: [{ name: 'Prisma' }],
};
