import type { IModuleRegistry } from '../common/interfaces/module-registry.interface';

export const registry: IModuleRegistry = {
  id: 'database-operations',
  name: 'Database Operations Module',
  description: 'Developer backup, snapshot, and maintenance operations against the database',
  version: '1.0.0',
  routePrefix: 'database-operations',
  features: [
    {
      id: 'table-backup',
      name: 'Table Backup',
      description: 'Export a single Prisma model as a downloadable JSON file',
      capabilities: [
        {
          id: 'list-tables',
          name: 'List Tables',
          description: 'All backupable Prisma models (excluding composite-key join tables)',
          actions: [
            {
              id: 'get-tables',
              name: 'Get Tables',
              description: 'Fetch the list of backupable model names',
              method: 'GET',
              path: '/database-operations/tables',
              request: 'No params',
              response: '{ data: string[] } — model names',
            },
          ],
        },
        {
          id: 'backup-table',
          name: 'Backup Table',
          description: 'Download every row of one model as JSON',
          actions: [
            {
              id: 'backup-table',
              name: 'Backup Table',
              description: 'Download all records of a model as a JSON file',
              method: 'GET',
              path: '/database-operations/tables/:model/backup',
              request: 'Path param: model name (e.g. Patient)',
              response: 'Binary JSON download — Content-Disposition: attachment; filename="<table>_<timestamp>.json"',
            },
          ],
        },
        {
          id: 'backup-document',
          name: 'Backup Document',
          description: 'Download a single record by id as JSON',
          actions: [
            {
              id: 'backup-document',
              name: 'Backup Document',
              description: 'Download one record by id as a JSON file',
              method: 'GET',
              path: '/database-operations/tables/:model/records/:id/backup',
              request: 'Path params: model name and record id',
              response: 'Binary JSON download — Content-Disposition: attachment; filename="<model>_<id>_<timestamp>.json"',
            },
          ],
        },
      ],
    },
    {
      id: 'snapshot',
      name: 'Snapshot',
      description: 'Full database dumps and date-range exports',
      capabilities: [
        {
          id: 'full-snapshot',
          name: 'Full Snapshot',
          description: 'pg_dump -Fc binary dump of the entire database',
          actions: [
            {
              id: 'full-snapshot',
              name: 'Full Snapshot',
              description: 'Download a complete pg_dump -Fc snapshot of the database',
              method: 'GET',
              path: '/database-operations/snapshot/full',
              request: 'No params',
              response: 'Binary .dump download — Content-Disposition: attachment; filename="<db>_full_<timestamp>.dump"',
            },
          ],
        },
        {
          id: 'range-snapshot',
          name: 'Date Range Snapshot',
          description: 'JSON export of records created within a date range',
          actions: [
            {
              id: 'range-snapshot',
              name: 'Range Snapshot',
              description: 'Download records created between startDate and endDate as JSON',
              method: 'GET',
              path: '/database-operations/snapshot/range',
              request: 'Query params: startDate, endDate (ISO dates), optional table',
              response: 'Binary JSON download — Content-Disposition: attachment; filename="snapshot_<table or range>_<timestamp>.json"',
            },
          ],
        },
      ],
    },
  ],
  dependencies: [{ name: '@prisma/client' }, { name: 'pg' }],
};
