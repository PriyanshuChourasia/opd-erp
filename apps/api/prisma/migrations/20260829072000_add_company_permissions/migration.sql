-- Ensure 'company' resource permissions exist (for the Organisation→Company rename)
-- Only add if they don't already exist (idempotent)

-- Actions: read, create, update, delete, manage
INSERT INTO "Permission" ("id", "resource", "action", "name", "createdAt", "updatedAt")
SELECT
  gen_random_uuid(),
  'company',
  a.action,
  CASE a.action
    WHEN 'read' THEN 'Read Company'
    WHEN 'create' THEN 'Create Company'
    WHEN 'update' THEN 'Update Company'
    WHEN 'delete' THEN 'Delete Company'
    WHEN 'manage' THEN 'Manage Company'
  END,
  NOW(),
  NOW()
FROM (VALUES ('read'), ('create'), ('update'), ('delete'), ('manage')) AS a(action)
WHERE NOT EXISTS (
  SELECT 1 FROM "Permission" p WHERE p.resource = 'company' AND p.action = a.action
);

-- Link company permissions to roles that already have organisation permissions
-- RolePermission uses composite key (roleId, permissionId), no separate id column
INSERT INTO "RolePermission" ("roleId", "permissionId")
SELECT
  rp."roleId",
  company_p.id
FROM "RolePermission" rp
JOIN "Permission" org_p ON rp."permissionId" = org_p.id
JOIN "Permission" company_p ON company_p.resource = 'company' AND company_p.action = org_p.action
WHERE org_p.resource = 'organisation'
  AND NOT EXISTS (
    SELECT 1 FROM "RolePermission" rp2
    WHERE rp2."roleId" = rp."roleId" AND rp2."permissionId" = company_p.id
  );
