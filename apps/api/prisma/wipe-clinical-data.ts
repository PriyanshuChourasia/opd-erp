/**
 * One-off script: wipe all clinical/transactional demo data while keeping
 * logins, roles/permissions, sidebar config, company settings, master data
 * (departments/designations/discount rules/units/medicine groups), the
 * medicine catalog, the doctor(s), and the patient directory.
 *
 * Deleted: appointments (+history), queue entries, prescriptions (+items,
 * history), dispensing, bills (+items), payments, lab/radiology/procedure
 * orders, patient vitals.
 *
 * Run: npx ts-node --transpile-only --project prisma/tsconfig.seed.json prisma/wipe-clinical-data.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.$transaction(async (tx) => {
    const payments = await tx.payment.deleteMany();
    const dispensings = await tx.dispensing.deleteMany();
    const prescItems = await tx.prescriptionItem.deleteMany();
    const prescHistory = await tx.prescriptionHistory.deleteMany();
    const prescriptions = await tx.prescription.deleteMany();
    const bills = await tx.bill.deleteMany(); // BillItem cascades
    const patientVitals = await tx.patientVitals.deleteMany();
    const apptHistory = await tx.appointmentHistory.deleteMany();
    const queueEntries = await tx.queueEntry.deleteMany();
    const labOrders = await tx.labOrder.deleteMany();
    const radiologyOrders = await tx.radiologyOrder.deleteMany();
    const procedureOrders = await tx.procedureOrder.deleteMany();
    const appointments = await tx.appointment.deleteMany();

    console.log({
      payments: payments.count,
      dispensings: dispensings.count,
      prescItems: prescItems.count,
      prescHistory: prescHistory.count,
      prescriptions: prescriptions.count,
      bills: bills.count,
      patientVitals: patientVitals.count,
      apptHistory: apptHistory.count,
      queueEntries: queueEntries.count,
      labOrders: labOrders.count,
      radiologyOrders: radiologyOrders.count,
      procedureOrders: procedureOrders.count,
      appointments: appointments.count,
    });
  });

  console.log('Done. Kept: users, roles/permissions, sidebar config, company settings, departments/designations, discount rules, units/medicine groups, doctors, patients.');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
