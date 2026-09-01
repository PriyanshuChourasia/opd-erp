/**
 * One-off script: add the "Discounts" sidebar entry under Organisation,
 * assigned to the same roles as Departments (Admin, Developer).
 *
 * Run: npx ts-node --transpile-only --project prisma/tsconfig.seed.json prisma/seed-discounts-sidebar.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const menuItem = await prisma.sidebarMenu.upsert({
    where: { path: '/organisation/discounts' },
    update: {},
    create: {
      label: 'Discounts',
      path: '/organisation/discounts',
      icon: 'BadgePercent',
      group: 'Organisation',
      sortOrder: 9,
      isHidden: false,
    },
  });
  console.log(`✓ Sidebar menu item: ${menuItem.label} (${menuItem.id})`);

  const deptMenu = await prisma.sidebarMenu.findFirst({ where: { path: '/organisation/departments' } });
  const roleIds = deptMenu
    ? (await prisma.roleSidebarMenu.findMany({ where: { sidebarMenuId: deptMenu.id }, select: { roleId: true } })).map((r) => r.roleId)
    : [];

  for (const roleId of roleIds) {
    await prisma.roleSidebarMenu.upsert({
      where: { roleId_sidebarMenuId: { roleId, sidebarMenuId: menuItem.id } },
      update: {},
      create: { roleId, sidebarMenuId: menuItem.id },
    });
  }
  console.log(`✅ Assigned "Discounts" to ${roleIds.length} role(s) (matching Departments' visibility)`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
