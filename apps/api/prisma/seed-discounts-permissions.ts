/**
 * Quick one-off script: seed the `discounts` resource's permissions, assign
 * all of them to Admin, and give `read:discounts` to any role that already
 * has billing access (they need to see the list at payment time).
 *
 * Run: npx ts-node --transpile-only --project prisma/tsconfig.seed.json prisma/seed-discounts-permissions.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const RESOURCE = 'discounts';
const ACTIONS = ['read', 'create', 'update', 'delete'] as const;

function permissionName(action: string, resource: string) {
  const label = resource.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  return `${action.charAt(0).toUpperCase() + action.slice(1)} ${label}`;
}

async function main() {
  const created: Record<string, string> = {};
  for (const action of ACTIONS) {
    const perm = await prisma.permission.upsert({
      where: { resource_action: { resource: RESOURCE, action } },
      update: {},
      create: { resource: RESOURCE, action, name: permissionName(action, RESOURCE) },
    });
    created[action] = perm.id;
    console.log(`✓ Permission: ${action}:${RESOURCE} (${perm.id})`);
  }

  const adminRole = await prisma.role.findFirst({ where: { name: 'Admin' } });
  if (!adminRole) {
    console.error('❌ Admin role not found — cannot assign permissions');
    process.exit(1);
  }
  for (const permId of Object.values(created)) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: adminRole.id, permissionId: permId } },
      update: {},
      create: { roleId: adminRole.id, permissionId: permId },
    });
  }
  console.log(`✅ Assigned all ${RESOURCE} permissions to Admin role`);

  // Any role with billing read access also gets read:discounts (needed to
  // populate the dropdown at payment time), but not create/update/delete —
  // configuring discount rules stays an admin-level action.
  const billingReadPerm = await prisma.permission.findFirst({ where: { resource: 'billing', action: 'read' } });
  if (billingReadPerm) {
    const rolePerms = await prisma.rolePermission.findMany({
      where: { permissionId: billingReadPerm.id },
      select: { roleId: true },
    });
    const roleIds = [...new Set(rolePerms.map((rp) => rp.roleId))].filter((id) => id !== adminRole.id);
    for (const roleId of roleIds) {
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId, permissionId: created.read } },
        update: {},
        create: { roleId, permissionId: created.read },
      });
    }
    console.log(`✅ Also assigned read:discounts to ${roleIds.length} other role(s) with billing access`);
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
