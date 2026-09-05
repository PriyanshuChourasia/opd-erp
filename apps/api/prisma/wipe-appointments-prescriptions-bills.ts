/**
 * Wipe all Appointments, Prescriptions, and Bills (and their required
 * dependents) — keeps Patients, Doctors, Users, Medicines, and the
 * accounting foundation (Ledgers/Vouchers/Journals/FinancialYear) intact.
 *
 * PatientVitals/QueueEntry rows that reference a deleted appointment are
 * kept, just detached (appointmentId set to null) — they aren't in scope
 * for deletion themselves.
 *
 * Run: npx ts-node --transpile-only --project prisma/tsconfig.seed.json prisma/wipe-appointments-prescriptions-bills.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🗑️  Wiping Appointments, Prescriptions, and Bills...\n');

  const nulledVitals = await prisma.patientVitals.updateMany({
    where: { appointmentId: { not: null } },
    data: { appointmentId: null },
  });
  const nulledQueue = await prisma.queueEntry.updateMany({
    where: { appointmentId: { not: null } },
    data: { appointmentId: null },
  });
  console.log(`Detached ${nulledVitals.count} vitals record(s) and ${nulledQueue.count} queue entr(y/ies) from their appointment.`);

  const deletedPayments = await prisma.payment.deleteMany();
  console.log(`Deleted ${deletedPayments.count} payment(s).`);

  const deletedBills = await prisma.bill.deleteMany(); // cascades BillItem
  console.log(`Deleted ${deletedBills.count} bill(s) (and their line items).`);

  const deletedDispensing = await prisma.dispensing.deleteMany();
  console.log(`Deleted ${deletedDispensing.count} dispensing record(s).`);

  const deletedPrescriptions = await prisma.prescription.deleteMany(); // cascades PrescriptionItem, PrescriptionHistory
  console.log(`Deleted ${deletedPrescriptions.count} prescription(s) (and their items/history).`);

  const deletedAppointments = await prisma.appointment.deleteMany(); // cascades AppointmentHistory
  console.log(`Deleted ${deletedAppointments.count} appointment(s) (and their history).`);

  console.log('\nSummary:');
  const counts = {
    appointments: await prisma.appointment.count(),
    prescriptions: await prisma.prescription.count(),
    bills: await prisma.bill.count(),
    payments: await prisma.payment.count(),
    dispensing: await prisma.dispensing.count(),
    patients: await prisma.patient.count(),
    doctors: await prisma.doctor.count(),
    medicines: await prisma.medicine.count(),
  };
  Object.entries(counts).forEach(([k, v]) => console.log(`   ${k}: ${v}`));

  console.log('\n✅ Done. Note: any Voucher/Journal/Ledger entries already posted for the');
  console.log('   now-deleted bills/payments still exist and were NOT touched — ledger');
  console.log('   balances still reflect them. Say the word if you want those cleared too.');
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
