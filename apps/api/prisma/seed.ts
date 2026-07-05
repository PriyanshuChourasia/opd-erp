import { PrismaClient, type Permission } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const patients = [
  { name: 'Aarav Sharma', phone: '9810000001', gender: 'MALE', bloodGroup: 'B+' },
  { name: 'Priya Verma', phone: '9810000002', gender: 'FEMALE', bloodGroup: 'O+' },
  { name: 'Rohan Mehta', phone: '9810000003', gender: 'MALE', bloodGroup: 'A+' },
  { name: 'Ananya Iyer', phone: '9810000004', gender: 'FEMALE', bloodGroup: 'AB+' },
  { name: 'Vikram Singh', phone: '9810000005', gender: 'MALE', bloodGroup: 'O-' },
];

// Same resource matrix the Roles & Permissions screen seeds on first load,
// plus "developer" for the Development nav section (Super Admin is excluded from it).
const RESOURCES = [
  'patients', 'appointments', 'doctors', 'prescriptions',
  'medicine-catalog', 'queue', 'billing', 'dispensing',
  'users', 'roles', 'settings', 'developer',
];
const ACTIONS = ['read', 'create', 'update', 'delete', 'manage'];

function permissionName(action: string, resource: string) {
  const label = resource.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  return `${action.charAt(0).toUpperCase() + action.slice(1)} ${label}`;
}

async function seedPatients() {
  for (const patient of patients) {
    await prisma.patient.upsert({ where: { phone: patient.phone }, update: {}, create: patient });
  }
  console.log(`Seeded ${patients.length} patients.`);
}

async function seedPermissions(): Promise<Permission[]> {
  const permissions: Permission[] = [];
  for (const resource of RESOURCES) {
    for (const action of ACTIONS) {
      const perm = await prisma.permission.upsert({
        where: { resource_action: { resource, action } },
        update: {},
        create: { resource, action, name: permissionName(action, resource) },
      });
      permissions.push(perm);
    }
  }
  console.log(`Seeded ${permissions.length} permissions.`);
  return permissions;
}

async function seedRoles(permissions: Permission[]) {
  const superAdminPerms = permissions.filter((p) => p.resource !== 'developer');

  const receptionistResources = new Set(['patients', 'appointments', 'queue', 'billing']);
  const receptionistPerms = permissions.filter(
    (p) =>
      receptionistResources.has(p.resource) ||
      ((p.resource === 'doctors' || p.resource === 'medicine-catalog') && p.action === 'read'),
  );

  async function upsertRoleWithPermissions(
    name: string,
    description: string,
    perms: Permission[],
  ) {
    const role = await prisma.role.upsert({
      where: { name },
      update: { description, isSystem: true },
      create: { name, description, isSystem: true },
    });
    await prisma.rolePermission.deleteMany({ where: { roleId: role.id } });
    await prisma.rolePermission.createMany({
      data: perms.map((p) => ({ roleId: role.id, permissionId: p.id })),
      skipDuplicates: true,
    });
    return role;
  }

  const superAdmin = await upsertRoleWithPermissions(
    'Super Admin',
    'Full access to every module except Developer tools',
    superAdminPerms,
  );
  const receptionist = await upsertRoleWithPermissions(
    'Receptionist',
    'Front-desk access to patients, appointments, queue, and billing',
    receptionistPerms,
  );

  console.log(`Seeded roles: Super Admin (${superAdminPerms.length} perms), Receptionist (${receptionistPerms.length} perms).`);
  return { superAdmin, receptionist };
}

async function seedUsers(superAdminRoleId: string, receptionistRoleId: string) {
  const users = [
    { name: 'Super Admin', email: 'superadmin@clinic.com', password: 'SuperAdmin@123', roleId: superAdminRoleId },
    { name: 'Front Desk', email: 'receptionist@clinic.com', password: 'Receptionist@123', roleId: receptionistRoleId },
  ];

  for (const u of users) {
    const password = await bcrypt.hash(u.password, 10);
    await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: { name: u.name, email: u.email, password, roleId: u.roleId },
    });
  }

  console.log('Seeded users:');
  for (const u of users) console.log(`  ${u.email} / ${u.password}`);
}

async function main() {
  await seedPatients();
  const permissions = await seedPermissions();
  const { superAdmin, receptionist } = await seedRoles(permissions);
  await seedUsers(superAdmin.id, receptionist.id);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
