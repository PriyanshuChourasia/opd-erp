/**
 * Wipe ALL data from the database except:
 *   - ALL current User rows + their Roles/Permissions
 *   - ALL Doctor rows (and their Department/Specialization links, since
 *     doctors keep their own profile data intact)
 *
 * Everything else is deleted: patients, appointments, queue, bills,
 * payments, prescriptions, medicines/stock, accounting, addresses,
 * documents, company, financial years, etc.
 *
 * Run: npx ts-node --transpile-only --project prisma/tsconfig.seed.json prisma/wipe-all-except-users-doctors.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🗑️  Wiping all data except Users and Doctors...\n');

  const keepUsers = await prisma.user.findMany({ select: { id: true, roleId: true } });
  const keepRoleIds = [...new Set(keepUsers.map((u) => u.roleId))];
  const keepUserIds = keepUsers.map((u) => u.id);
  const doctorCount = await prisma.doctor.count();
  console.log(`Keeping ${keepUsers.length} user(s) across ${keepRoleIds.length} role(s) and ${doctorCount} doctor(s).\n`);

  // ── 1. Accounting: children before parents ──
  console.log('1/6  Deleting accounting records...');
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
  console.log('2/6  Deleting billing/payment records...');
  await prisma.billItem.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.bill.deleteMany();

  // ── 3. Clinical transactional records, then Patient itself ──
  console.log('3/6  Deleting clinical records and patients...');
  await prisma.patientVitals.deleteMany();
  await prisma.patientAllergyRecord.deleteMany();
  await prisma.patientAllergy.deleteMany();
  await prisma.dispensing.deleteMany();
  await prisma.prescriptionItem.deleteMany();
  await prisma.prescriptionHistory.deleteMany();
  await prisma.prescription.deleteMany();
  await prisma.queueEntry.deleteMany();
  await prisma.appointment.deleteMany(); // cascades AppointmentHistory
  await prisma.labOrder.deleteMany();
  await prisma.radiologyOrder.deleteMany();
  await prisma.procedureOrder.deleteMany();
  const deletedPatients = await prisma.patient.deleteMany();
  console.log(`     Deleted ${deletedPatients.count} patient(s).`);

  // ── 4. Medicines and stock (children before parents) ──
  console.log('4/6  Deleting medicines and stock records...');
  await prisma.stockLedgerEntry.deleteMany();
  await prisma.stockBatch.deleteMany();
  await prisma.stockItem.deleteMany();
  const deletedMedicines = await prisma.medicine.deleteMany();
  await prisma.medicineGroup.deleteMany();
  await prisma.unit.deleteMany();
  console.log(`     Deleted ${deletedMedicines.count} medicine(s).`);

  // ── 5. Reference/catalogue records — NOT deleting Department/Designation/
  //     Specialization/DoctorDepartment/DoctorSpecialization, since doctors
  //     are kept and those are the doctor's own profile data. ──
  console.log('5/6  Deleting reference records...');
  await prisma.employeeSchedule.deleteMany();
  await prisma.shift.deleteMany();
  await prisma.allergy.deleteMany();
  await prisma.diagnosis.deleteMany();
  await prisma.diagnosisSystem.deleteMany();
  await prisma.address.deleteMany();
  await prisma.document.deleteMany();
  await prisma.prescriptionTemplate.deleteMany();
  await prisma.financialYear.deleteMany();
  await prisma.company.deleteMany();
  await prisma.sidebarMenu.deleteMany();

  // ── 6. Non-kept users/roles (no-op today: keepUserIds is every current user) ──
  console.log('6/6  Pruning unused roles...');
  const deletedUsers = await prisma.user.deleteMany({ where: { id: { notIn: keepUserIds } } });
  const deletedRoles = await prisma.role.deleteMany({ where: { id: { notIn: keepRoleIds } } });
  console.log(`     Deleted ${deletedUsers.count} user(s), ${deletedRoles.count} role(s).`);

  console.log('\nSummary:');
  const counts = {
    users: await prisma.user.count(),
    doctors: await prisma.doctor.count(),
    patients: await prisma.patient.count(),
    medicines: await prisma.medicine.count(),
    appointments: await prisma.appointment.count(),
    bills: await prisma.bill.count(),
    prescriptions: await prisma.prescription.count(),
    ledgers: await prisma.ledger.count(),
    vouchers: await prisma.voucher.count(),
  };
  Object.entries(counts).forEach(([k, v]) => console.log(`   ${k}: ${v}`));

  console.log('\n✅ Done! Kept: Users, Doctors (and their department/specialization links). Everything else wiped.');
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
