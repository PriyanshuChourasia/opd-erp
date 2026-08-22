import type { IModuleRegistry } from '../common/interfaces/module-registry.interface';

export const registry: IModuleRegistry = {
  id: 'database-schema',
  name: 'Database Schema Module',
  description: 'Developer introspection of the Prisma data model — models, fields, relations, and enums',
  version: '1.0.0',
  routePrefix: 'schema',
  features: [
    {
      id: 'schema-inspection',
      name: 'Schema Inspection',
      description: 'Browse the database schema derived from the Prisma client DMMF',
      capabilities: [
        {
          id: 'list-models',
          name: 'List Models',
          description: 'All Prisma models with field and relation metadata',
          actions: [
            { id: 'get-schema', name: 'Get Schema', description: 'Fetch every model and enum in the data model', method: 'GET', path: '/database-schema', request: 'No params', response: '{ data: { models: [{ name, fields[], relations[], uniqueFields }], enums: [{ name, values[] }] }, total }' },
          ],
        },
        {
          id: 'get-model',
          name: 'Get Model',
          description: 'A single model with its full field list',
          actions: [
            { id: 'get-schema-model', name: 'Get Model', description: 'Fetch one model by name', method: 'GET', path: '/database-schema/:model', request: 'Path param: model name (e.g. Patient)', response: '{ data: SchemaModel } — fields with type/kind/isRequired/isList/isId/isUnique/hasDefault/isUpdatedAt' },
          ],
        },
      ],
    },
    {
      id: 'schema-change-plan',
      name: 'Schema Change Plan',
      description: 'Persisted developer annotations — remarks, edit/removal marks, and proposed fields per model',
      capabilities: [
        {
          id: 'schema-changes',
          name: 'Schema Changes',
          description: 'Read and replace the saved change plan for a model',
          actions: [
            { id: 'get-schema-changes', name: 'Get Changes', description: 'Fetch the saved change plan for one model', method: 'GET', path: '/database-schema/:model/changes', request: 'Path param: model name', response: '{ data: SchemaFieldChange[] } — rows of kind REMARK|REMOVE|EDIT|ADD' },
            { id: 'save-schema-changes', name: 'Save Changes', description: 'Replace the saved change plan for one model', method: 'PATCH', path: '/database-schema/:model/changes', request: "Body: { changes: [{ fieldName, kind: 'REMARK'|'REMOVE'|'EDIT'|'ADD', remark?, editedName?, editedType?, fieldType?, targetModel?, isRequired?, isList? }] } (PUT also accepted)", response: '{ data: SchemaFieldChange[] } — the saved plan after replacement' },
          ],
        },
      ],
    },
  ],
  dependencies: [{ name: '@prisma/client' }],
};
