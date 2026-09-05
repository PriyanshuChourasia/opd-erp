import type { IModuleRegistry } from '../common/interfaces/module-registry.interface';

export const registry: IModuleRegistry = {
  id: 'company',
  name: 'Company Module',
  description: 'Clinic profile, financial years, document templates, users, and roles & permissions',
  version: '4.0.0',
  routePrefix: 'company',
  features: [
    {
      id: 'company-profile',
      name: 'Company Profile',
      description: 'View and update the clinic company profile',
      capabilities: [
        {
          id: 'company-settings',
          name: 'Company Settings',
          description: 'Manage the singleton company record',
          actions: [
            { id: 'get-company', name: 'Get Company', description: 'Fetch the company profile', method: 'GET', path: '/company' },
            { id: 'update-company', name: 'Update Company', description: 'Create or update the company profile', method: 'PATCH', path: '/company' },
          ],
        },
      ],
    },
    {
      id: 'document-template-management',
      name: 'Document Templates',
      description: 'Design and manage prescription, diagnosis, and lab test document templates',
      capabilities: [
        {
          id: 'prescription-template-crud',
          name: 'Prescription Templates',
          description: 'Create, update, and manage prescription print layouts',
          actions: [
            { id: 'list-prescription-templates', name: 'List Templates', description: 'List all prescription templates', method: 'GET', path: '/prescription-templates' },
            { id: 'create-prescription-template', name: 'Create Template', description: 'Create a new prescription template', method: 'POST', path: '/prescription-templates' },
            { id: 'update-prescription-template', name: 'Update Template', description: 'Update an existing template', method: 'PATCH', path: '/prescription-templates/:id' },
            { id: 'set-default-template', name: 'Set Default Template', description: 'Set a template as the default', method: 'PATCH', path: '/prescription-templates/:id/default' },
            { id: 'delete-prescription-template', name: 'Delete Template', description: 'Remove a template', method: 'DELETE', path: '/prescription-templates/:id' },
          ],
        },
        {
          id: 'diagnosis-template-crud',
          name: 'Diagnosis Templates',
          description: 'Diagnosis reports, fitness certificates, sick leave forms',
          actions: [
            { id: 'list-diagnosis-templates', name: 'List Diagnosis Templates', description: 'List diagnosis templates', method: 'GET', path: '/prescription-templates?type=diagnosis' },
          ],
        },
        {
          id: 'lab-test-template-crud',
          name: 'Lab Test Templates',
          description: 'Lab test requisition forms with test categories',
          actions: [
            { id: 'list-test-templates', name: 'List Test Templates', description: 'List lab test templates', method: 'GET', path: '/prescription-templates?type=test' },
          ],
        },
      ],
    },
    {
      id: 'user-management',
      name: 'User Management',
      description: 'Manage system users and their roles',
      capabilities: [
        {
          id: 'user-administration',
          name: 'User Administration',
          description: 'Create, update, and manage user accounts',
          actions: [
            { id: 'list-users', name: 'List Users', description: 'List all system users', method: 'GET', path: '/users' },
            { id: 'create-user', name: 'Create User', description: 'Create a new user account', method: 'POST', path: '/users' },
            { id: 'update-user', name: 'Update User', description: 'Update user account details', method: 'PATCH', path: '/users/:id' },
            { id: 'delete-user', name: 'Delete User', description: 'Remove a user account', method: 'DELETE', path: '/users/:id' },
          ],
        },
      ],
    },
    {
      id: 'role-permission-management',
      name: 'Roles & Permissions',
      description: 'Define roles and manage granular permissions',
      capabilities: [
        {
          id: 'role-administration',
          name: 'Role Administration',
          description: 'Create, update, and manage roles with permission assignments',
          actions: [
            { id: 'list-roles', name: 'List Roles', description: 'List all roles', method: 'GET', path: '/roles' },
            { id: 'create-role', name: 'Create Role', description: 'Create a new role', method: 'POST', path: '/roles' },
            { id: 'update-role', name: 'Update Role', description: 'Update an existing role', method: 'PATCH', path: '/roles/:id' },
            { id: 'delete-role', name: 'Delete Role', description: 'Remove a role', method: 'DELETE', path: '/roles/:id' },
          ],
        },
      ],
    },
  ],
  dependencies: [{ name: 'Prisma' }, { name: 'Auth' }],
};
