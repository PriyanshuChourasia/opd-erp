import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const KEEP_DOCTOR_ID = 'c95d58c6-c888-440e-8e4f-d84f4ea1487c'; // Vikram Mehta — General Medicine

async function main() {
  const allDoctors = await prisma.doctor.findMany({ select: { id: true } });
  const removeIds = allDoctors.map((d) => d.id).filter((id) => id !== KEEP_DOCTOR_ID);

  if (removeIds.length === 0) {
    console.log('Nothing to remove — only one doctor exists already.');
    return;
  }
  console.log(`Removing ${removeIds.length} doctors, keeping ${KEEP_DOCTOR_ID}.`);

  await prisma.$transaction(async (tx) => {
    const appointments = await tx.appointment.findMany({ where: { doctorId: { in: removeIds } }, select: { id: true } });
    const appointmentIds = appointments.map((a) => a.id);
    const prescriptions = await tx.prescription.findMany({ where: { doctorId: { in: removeIds } }, select: { id: true } });
    const prescriptionIds = prescriptions.map((p) => p.id);

    const prescItems = await tx.prescriptionItem.deleteMany({ where: { prescriptionId: { in: prescriptionIds } } });
    const dispensings = await tx.dispensing.deleteMany({ where: { prescriptionId: { in: prescriptionIds } } });
    const prescHistory = await tx.prescriptionHistory.deleteMany({ where: { prescriptionId: { in: prescriptionIds } } });
    const prescriptionsDeleted = await tx.prescription.deleteMany({ where: { id: { in: prescriptionIds } } });

    const bills = await tx.bill.deleteMany({ where: { appointmentId: { in: appointmentIds } } }); // BillItem cascades
    const queueEntries = await tx.queueEntry.deleteMany({ where: { doctorId: { in: removeIds } } });
    const vitals = await tx.patientVitals.deleteMany({ where: { appointmentId: { in: appointmentIds } } });
    const apptHistory = await tx.appointmentHistory.deleteMany({ where: { appointmentId: { in: appointmentIds } } });
    const appointmentsDeleted = await tx.appointment.deleteMany({ where: { id: { in: appointmentIds } } });

    const labOrders = await tx.labOrder.deleteMany({ where: { doctorId: { in: removeIds } } });
    const radOrders = await tx.radiologyOrder.deleteMany({ where: { doctorId: { in: removeIds } } });
    const procOrders = await tx.procedureOrder.deleteMany({ where: { doctorId: { in: removeIds } } });
    const templates = await tx.prescriptionTemplate.deleteMany({ where: { doctorId: { in: removeIds } } });
    const schedules = await tx.employeeSchedule.deleteMany({ where: { employeeSchedulableType: 'Doctor', employeeSchedulableId: { in: removeIds } } });

    const doctorsDeleted = await tx.doctor.deleteMany({ where: { id: { in: removeIds } } }); // DoctorDepartment/DoctorSpecialization cascade

    const usersDeactivated = await tx.user.updateMany({ where: { userableType: 'Doctor', userableId: { in: removeIds } }, data: { isActive: false } });

    console.log({
      prescItems: prescItems.count,
      dispensings: dispensings.count,
      prescHistory: prescHistory.count,
      prescriptionsDeleted: prescriptionsDeleted.count,
      bills: bills.count,
      queueEntries: queueEntries.count,
      vitals: vitals.count,
      apptHistory: apptHistory.count,
      appointmentsDeleted: appointmentsDeleted.count,
      labOrders: labOrders.count,
      radOrders: radOrders.count,
      procOrders: procOrders.count,
      templates: templates.count,
      schedules: schedules.count,
      doctorsDeleted: doctorsDeleted.count,
      usersDeactivated: usersDeactivated.count,
    });
  });

  console.log('Done.');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
