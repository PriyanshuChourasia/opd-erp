/**
 * Wipe ALL data from the database, keeping ONLY the superadmin and admin users
 * (and their roles + permissions).
 *
 * Run: npx ts-node --transpile-only --project prisma/tsconfig.seed.json prisma/wipe-data.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const KEEP_EMAILS = ['superadmin@clinic.com', 'admin@clinic.com'];

async function main() {
  console.log('🗑️  Wiping ALL data (keeping superadmin & admin only)...\n');

  // Find users to keep
  const keepUsers = await prisma.user.findMany({
    where: { email: { in: KEEP_EMAILS } },
    select: { id: true, email: true, roleId: true },
  });
  const keepUserIds = keepUsers.map((u) => u.id);
  const keepRoleIds = keepUsers.map((u) => u.roleId);

  console.log('Keeping users:');
  keepUsers.forEach((u) => console.log(`  - ${u.email} (${u.id})`));
  console.log(`Keeping roles: ${keepRoleIds.join(', ')}\n`);

  // ── 1. Delete ALL transactional child records (breaks FK chains) ──
  console.log('1/6  Deleting transactional child records...');
  await prisma.patientVitals.deleteMany();
  await prisma.patientAllergyRecord.deleteMany();
  await prisma.patientAllergy.deleteMany();
  await prisma.dispensing.deleteMany();
  await prisma.prescriptionItem.deleteMany();
  await prisma.prescriptionHistory.deleteMany();
  await prisma.billItem.deleteMany();
  await prisma.queueEntry.deleteMany();
  await prisma.refreshToken.deleteMany();

  // ── 2. Delete ALL transactional parent records ──
  console.log('2/6  Deleting transactional parent records...');
  await prisma.prescription.deleteMany();
  await prisma.bill.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.labOrder.deleteMany();
  await prisma.radiologyOrder.deleteMany();
  await prisma.procedureOrder.deleteMany();

  // ── 3. Delete ALL reference/catalogue records ──
  console.log('3/6  Deleting reference records...');
  await prisma.employeeSchedule.deleteMany();
  await prisma.shift.deleteMany();
  await prisma.patient.deleteMany();
  await prisma.doctor.deleteMany();
  await prisma.medicine.deleteMany();
  await prisma.medicineGroup.deleteMany();
  await prisma.unit.deleteMany();
  await prisma.allergy.deleteMany();
  await prisma.diagnosis.deleteMany();
  await prisma.diagnosisSystem.deleteMany();
  await prisma.address.deleteMany();
  await prisma.document.deleteMany();
  await prisma.prescriptionTemplate.deleteMany();
  await prisma.organisation.deleteMany();

  // ── 4. Delete non-kept users ──
  console.log('4/6  Deleting non-admin users...');
  const deletedUsers = await prisma.user.deleteMany({
    where: { id: { notIn: keepUserIds } },
  });
  console.log(`     Deleted ${deletedUsers.count} users`);

  // ── 5. Delete non-kept roles ──
  console.log('5/6  Deleting non-admin roles...');
  const deletedRoles = await prisma.role.deleteMany({
    where: { id: { notIn: keepRoleIds } },
  });
  console.log(`     Deleted ${deletedRoles.count} roles`);

  // ── 6. Summary ──
  console.log('\n6/6  Summary:');
  const counts = {
    users: await prisma.user.count(),
    roles: await prisma.role.count(),
    permissions: await prisma.permission.count(),
    patients: await prisma.patient.count(),
    doctors: await prisma.doctor.count(),
    medicines: await prisma.medicine.count(),
    medicineGroups: await prisma.medicineGroup.count(),
    units: await prisma.unit.count(),
    appointments: await prisma.appointment.count(),
    prescriptions: await prisma.prescription.count(),
  };
  Object.entries(counts).forEach(([k, v]) => console.log(`   ${k}: ${v}`));

  console.log('\n✅ Done! Only superadmin & admin remain.');
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
