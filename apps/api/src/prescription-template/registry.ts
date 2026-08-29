import type { IModuleRegistry } from '../common/interfaces/module-registry.interface';

export const registry: IModuleRegistry = {
  id: 'prescription-template',
  name: 'Document Template Module',
  description: 'Design and manage prescription, diagnosis, and lab test document templates with branding and layout options',
  version: '2.0.0',
  routePrefix: 'prescription-templates',
  features: [
    {
      id: 'prescription-template-management',
      name: 'Prescription Template Management',
      description: 'Create, update, preview, and manage prescription templates with medicine tables and dosage layouts',
      capabilities: [
        {
          id: 'prescription-template-crud',
          name: 'Prescription Template CRUD',
          description: 'Full lifecycle management of prescription templates',
          actions: [
            { id: 'list-prescription-templates', name: 'List Templates', description: 'List all prescription templates', method: 'GET', path: '/prescription-templates' },
            { id: 'get-prescription-template', name: 'Get Template', description: 'Get a single template by ID', method: 'GET', path: '/prescription-templates/:id' },
            { id: 'get-default-template', name: 'Get Default Template', description: 'Get the currently active default template', method: 'GET', path: '/prescription-templates/default' },
            { id: 'create-prescription-template', name: 'Create Template', description: 'Create a new prescription template', method: 'POST', path: '/prescription-templates' },
            { id: 'update-prescription-template', name: 'Update Template', description: 'Update an existing prescription template', method: 'PATCH', path: '/prescription-templates/:id' },
            { id: 'set-default-template', name: 'Set Default Template', description: 'Set a template as the default for printing', method: 'PATCH', path: '/prescription-templates/:id/default' },
            { id: 'delete-prescription-template', name: 'Delete Template', description: 'Remove a prescription template (cannot delete default)', method: 'DELETE', path: '/prescription-templates/:id' },
          ],
        },
      ],
    },
    {
      id: 'diagnosis-template-management',
      name: 'Diagnosis Template Management',
      description: 'Create and manage diagnosis report templates, fitness certificates, and sick leave forms',
      capabilities: [
        {
          id: 'diagnosis-template-crud',
          name: 'Diagnosis Template CRUD',
          description: 'Manage diagnosis report and certificate templates',
          actions: [
            { id: 'list-diagnosis-templates', name: 'List Diagnosis Templates', description: 'List all diagnosis templates', method: 'GET', path: '/prescription-templates?type=diagnosis' },
            { id: 'create-diagnosis-template', name: 'Create Diagnosis Template', description: 'Create a new diagnosis report template', method: 'POST', path: '/prescription-templates' },
          ],
        },
      ],
    },
    {
      id: 'lab-test-template-management',
      name: 'Lab Test Template Management',
      description: 'Create and manage lab test requisition forms with test categories and checkboxes',
      capabilities: [
        {
          id: 'lab-test-template-crud',
          name: 'Lab Test Template CRUD',
          description: 'Manage lab test order and requisition templates',
          actions: [
            { id: 'list-test-templates', name: 'List Test Templates', description: 'List all lab test templates', method: 'GET', path: '/prescription-templates?type=test' },
            { id: 'create-test-template', name: 'Create Test Template', description: 'Create a new lab test requisition template', method: 'POST', path: '/prescription-templates' },
          ],
        },
      ],
    },
  ],
  dependencies: [{ name: 'Prisma' }, { name: 'Auth' }],
};
