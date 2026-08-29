import type { IModuleRegistry } from '../common/interfaces/module-registry.interface';

export const registry: IModuleRegistry = {
  id: 'documents',
  name: 'Documents Module',
  description: 'Polymorphic document/file management for Patient photos, Doctor certificates, and other entity attachments',
  version: '1.0.0',
  routePrefix: 'documents',
  features: [
    {
      id: 'document-management',
      name: 'Document Management',
      description: 'Upload, store, and manage files attached to any entity via polymorphic relation',
      capabilities: [
        {
          id: 'document-crud',
          name: 'Document CRUD',
          description: 'Full CRUD + file upload for documents',
          actions: [
            { id: 'upload-document', name: 'Upload Document', description: 'Upload a file and attach it to an entity', method: 'POST', path: '/documents' },
            { id: 'list-documents', name: 'List Documents', description: 'List documents with polymorphic filtering', method: 'GET', path: '/documents' },
            { id: 'get-entity-documents', name: 'Get Entity Documents', description: 'Get all documents for a specific entity', method: 'GET', path: '/documents/by-entity' },
            { id: 'set-primary-document', name: 'Set Primary Document', description: 'Set a document as primary for its entity', method: 'PATCH', path: '/documents/:id/primary' },
            { id: 'get-document', name: 'Get Document', description: 'View document metadata', method: 'GET', path: '/documents/:id' },
            { id: 'update-document', name: 'Update Document', description: 'Update document metadata', method: 'PATCH', path: '/documents/:id' },
            { id: 'delete-document', name: 'Delete Document', description: 'Soft-delete a document', method: 'DELETE', path: '/documents/:id' },
          ],
        },
      ],
    },
  ],
  dependencies: [{ name: 'Prisma' }],
};
