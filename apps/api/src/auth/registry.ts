import type { IModuleRegistry } from '../common/interfaces/module-registry.interface';

export const registry: IModuleRegistry = {
  id: 'auth',
  name: 'Auth Module',
  description: 'Authentication & authorization — JWT, login, registration, token management',
  version: '1.0.0',
  routePrefix: 'auth',
  features: [
    {
      id: 'authentication',
      name: 'Authentication',
      description: 'User login, registration, and session management',
      capabilities: [
        {
          id: 'auth-flows',
          name: 'Auth Flows',
          description: 'Authentication mechanisms',
          actions: [
            { id: 'login', name: 'Login', description: 'Authenticate with email and password', method: 'POST', path: '/auth/login' },
            { id: 'register', name: 'Register', description: 'Create a new user account', method: 'POST', path: '/auth/register' },
            { id: 'logout', name: 'Logout', description: 'Invalidate current session', method: 'POST', path: '/auth/logout' },
            { id: 'refresh-token', name: 'Refresh Token', description: 'Rotate access token using refresh token', method: 'POST', path: '/auth/refresh' },
            { id: 'get-me', name: 'Get Current User', description: 'Get authenticated user profile', method: 'GET', path: '/auth/me' },
            { id: 'update-profile', name: 'Update Profile', description: 'Update name and email', method: 'PATCH', path: '/auth/me' },
            { id: 'change-password', name: 'Change Password', description: 'Update account password', method: 'POST', path: '/auth/change-password' },
          ],
        },
      ],
    },
  ],
  dependencies: [{ name: 'Prisma' }, { name: 'JWT' }],
};
