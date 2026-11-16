/**
 * One-off script: give the "Super Admin" role every sidebar menu that the
 * "Admin" role has, except the Developer group. Mirrors the Super Admin role
 * definition in seed.ts (every permission except Developer tooling).
 *
 * Additive only — never removes an existing role ↔ menu assignment.
 *
 * Run: npx ts-node --transpile-only --project prisma/tsconfig.seed.json prisma/sync-super-admin-sidebar.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const superAdmin = await prisma.role.findUnique({ where: { name: 'Super Admin' } });
  const admin = await prisma.role.findUnique({ where: { name: 'Admin' } });
  if (!superAdmin || !admin) {
    console.log('⏭️  Super Admin or Admin role not found, nothing to do.');
    return;
  }

  const adminMenus = await prisma.sidebarMenu.findMany({
    where: {
      group: { not: 'Developer' },
      roleMenus: { some: { roleId: admin.id } },
    },
    select: { id: true, label: true, path: true },
  });

  const result = await prisma.roleSidebarMenu.createMany({
    data: adminMenus.map((m) => ({ roleId: superAdmin.id, sidebarMenuId: m.id })),
    skipDuplicates: true,
  });

  console.log(`✅ Super Admin: added ${result.count} menu(s) (of ${adminMenus.length} Admin non-Developer menus).`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
