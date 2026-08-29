import type { IModuleRegistry } from '../common/interfaces/module-registry.interface';

export const registry: IModuleRegistry = {
  id: 'health',
  name: 'Health Check Module',
  description: 'System health monitoring, uptime checks, and diagnostics',
  version: '1.0.0',
  routePrefix: 'health',
  features: [
    {
      id: 'health-monitoring',
      name: 'Health Monitoring',
      description: 'System health and diagnostics',
      capabilities: [
        {
          id: 'health-checks',
          name: 'Health Checks',
          description: 'Monitor system availability',
          actions: [
            { id: 'check-health', name: 'Health Check', description: 'Returns system health status and timestamp', method: 'GET', path: '/health' },
          ],
        },
      ],
    },
  ],
  dependencies: [],
};
