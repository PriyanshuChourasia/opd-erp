/**
 * Quick one-off script: seed just the medicine-groups and units permissions,
 * then assign them to the Admin role.
 *
 * Run: npx ts-node --transpile-only --project prisma/tsconfig.seed.json prisma/seed-new-permissions.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const NEW_RESOURCES = ['medicine-groups', 'units'];
const ACTIONS = ['read', 'create', 'update', 'delete'] as const;

function permissionName(action: string, resource: string) {
  const label = resource.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  return `${action.charAt(0).toUpperCase() + action.slice(1)} ${label}`;
}

async function main() {
  // 1. Create the new permissions (skip if they already exist)
  const created: string[] = [];
  for (const resource of NEW_RESOURCES) {
    for (const action of ACTIONS) {
      const perm = await prisma.permission.upsert({
        where: { resource_action: { resource, action } },
        update: {},
        create: {
          resource,
          action,
          name: permissionName(action, resource),
        },
      });
      created.push(perm.id);
      console.log(`✓ Permission: ${action}:${resource} (${perm.id})`);
    }
  }

  // 2. Find the Admin role
  const adminRole = await prisma.role.findFirst({ where: { name: 'Admin' } });
  if (!adminRole) {
    console.error('❌ Admin role not found — cannot assign permissions');
    process.exit(1);
  }
  console.log(`\nAdmin role: ${adminRole.name} (${adminRole.id})`);

  // 3. Assign all new permissions to the Admin role
  for (const permId of created) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: adminRole.id, permissionId: permId } },
      update: {},
      create: { roleId: adminRole.id, permissionId: permId },
    });
  }
  console.log(`✅ Assigned ${created.length} new permissions to Admin role`);

  // 4. Also assign to any role that already has medicine-catalog permissions
  const medCatalogPerms = await prisma.permission.findMany({
    where: { resource: 'medicine-catalog' },
  });
  if (medCatalogPerms.length > 0) {
    const rolePerms = await prisma.rolePermission.findMany({
      where: { permissionId: { in: medCatalogPerms.map((p) => p.id) } },
      select: { roleId: true },
    });
    const roleIds = [...new Set(rolePerms.map((rp) => rp.roleId))];
    for (const roleId of roleIds) {
      for (const permId of created) {
        await prisma.rolePermission.upsert({
          where: { roleId_permissionId: { roleId, permissionId: permId } },
          update: {},
          create: { roleId, permissionId: permId },
        });
      }
    }
    console.log(`✅ Also assigned to ${roleIds.length} other role(s) with medicine-catalog access`);
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
