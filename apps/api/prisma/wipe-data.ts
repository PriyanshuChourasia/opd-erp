/**
 * Wipe all transactional/demo data from the database, keeping only:
 *   - ALL current User rows + their Roles/Permissions
 *   - ONE Doctor (the first one) + its linked User
 *   - ALL Patients
 *   - ALL Medicines (and their Groups/Units)
 *
 * Everything else is deleted: appointments, bills, prescriptions, accounting,
 * queues, orders, allergies, diagnoses, addresses, documents, etc.
 *
 * Run: npx ts-node --transpile-only --project prisma/tsconfig.seed.json prisma/wipe-data.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🗑️  Wiping all data except Users, one Doctor, Patients, Medicines...\n');

  // ── Identify what to keep ──
  const keepUsers = await prisma.user.findMany({ select: { id: true, email: true, roleId: true } });
  const keepRoleIds = [...new Set(keepUsers.map((u) => u.roleId))];
  const keepUserIds = keepUsers.map((u) => u.id);
  console.log(`Keeping ${keepUsers.length} user(s) across ${keepRoleIds.length} role(s).`);

  // Keep the first doctor (and its linked User)
  const keepDoctor = await prisma.doctor.findFirst();
  const keepDoctorIds = keepDoctor ? [keepDoctor.id] : [];
  console.log(`Keeping ${keepDoctorIds.length} doctor(s): ${keepDoctor ? keepDoctor.medicalRegistrationNo : 'none'}.`);

  // Count what we're keeping
  const patientCount = await prisma.patient.count();
  const medicineCount = await prisma.medicine.count();
  console.log(`Keeping ${patientCount} patient(s) and ${medicineCount} medicine(s).\n`);

  // ── 1. Accounting: children before parents ──
  console.log('1/8  Deleting accounting records...');
  await prisma.voucherReference.deleteMany();
  await prisma.journalLine.deleteMany();
  await prisma.journal.deleteMany();
  await prisma.voucher.deleteMany();
  await prisma.ledger.deleteMany();
  await prisma.accountGroup.deleteMany();
  await prisma.accountNature.deleteMany();
  await prisma.voucherType.deleteMany();
  await prisma.journalType.deleteMany();

  // ── 2. Billing/payment transactional child records ──
  console.log('2/8  Deleting billing/payment records...');
  await prisma.billItem.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.bill.deleteMany();

  // ── 3. Clinical transactional records ──
  console.log('3/8  Deleting clinical records...');
  await prisma.patientVitals.deleteMany();
  await prisma.patientAllergyRecord.deleteMany();
  await prisma.patientAllergy.deleteMany();
  await prisma.dispensing.deleteMany();
  await prisma.prescriptionItem.deleteMany();
  await prisma.prescriptionHistory.deleteMany();
  await prisma.prescription.deleteMany();
  await prisma.queueEntry.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.labOrder.deleteMany();
  await prisma.radiologyOrder.deleteMany();
  await prisma.procedureOrder.deleteMany();

  // ── 4. Reference/catalogue records (keeping Medicines + their Groups/Units) ──
  console.log('4/8  Deleting reference records (keeping medicines)...');
  await prisma.employeeSchedule.deleteMany();
  await prisma.shift.deleteMany();
  // NOT deleting: patient, doctor (kept), medicine, medicineGroup, unit
  await prisma.allergy.deleteMany();
  await prisma.diagnosis.deleteMany();
  await prisma.diagnosisSystem.deleteMany();
  await prisma.address.deleteMany();
  await prisma.document.deleteMany();
  await prisma.prescriptionTemplate.deleteMany();
  await prisma.financialYear.deleteMany();
  await prisma.company.deleteMany();
  await prisma.sidebarMenu.deleteMany();

  // ── 5. Delete non-kept doctors (keep only the first one) ──
  console.log('5/8  Deleting non-kept doctors...');
  const deletedDoctors = await prisma.doctor.deleteMany({
    where: { id: { notIn: keepDoctorIds } },
  });
  console.log(`     Deleted ${deletedDoctors.count} doctor(s).`);

  // ── 6. Delete non-kept users/roles ──
  console.log('6/8  Deleting non-kept users/roles...');
  const deletedUsers = await prisma.user.deleteMany({
    where: { id: { notIn: keepUserIds } },
  });
  const deletedRoles = await prisma.role.deleteMany({
    where: { id: { notIn: keepRoleIds } },
  });
  console.log(`     Deleted ${deletedUsers.count} user(s), ${deletedRoles.count} role(s).`);

  // ── 7. RefreshTokens for kept users stay valid ──
  console.log('7/8  Refresh tokens untouched (kept users stay logged in).');

  // ── 8. Summary ──
  console.log('\n8/8  Summary:');
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
    bills: await prisma.bill.count(),
    prescriptions: await prisma.prescription.count(),
    ledgers: await prisma.ledger.count(),
    vouchers: await prisma.voucher.count(),
    journals: await prisma.journal.count(),
  };
  Object.entries(counts).forEach(([k, v]) => console.log(`   ${k}: ${v}`));

  console.log('\n✅ Done! Kept: Users, one Doctor, Patients, Medicines.');
  console.log('   Run `npx ts-node --transpile-only --project prisma/tsconfig.seed.json prisma/seed.ts` to rebuild.');
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
