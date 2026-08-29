import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const NEW_RESOURCES = ['departments', 'designations', 'financial-years'];
const ACTIONS = ['read', 'create', 'update', 'delete'] as const;

function permissionName(action: string, resource: string) {
  const label = resource.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  return `${action.charAt(0).toUpperCase() + action.slice(1)} ${label}`;
}

async function main() {
  const created: string[] = [];
  for (const resource of NEW_RESOURCES) {
    for (const action of ACTIONS) {
      const perm = await prisma.permission.upsert({
        where: { resource_action: { resource, action } },
        update: {},
        create: { resource, action, name: permissionName(action, resource) },
      });
      created.push(perm.id);
      console.log(`✓ ${action}:${resource}`);
    }
  }

  // Assign to all roles that have medicine-catalog permissions
  const medCatalogPerms = await prisma.permission.findMany({ where: { resource: 'medicine-catalog' } });
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
  console.log(`\n✅ Assigned ${created.length} permissions to ${roleIds.length} role(s)`);
}

main().then(() => prisma.$disconnect()).catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
