import { PrismaClient, type Permission, type Doctor } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const FRESH = process.argv.includes('--fresh');

const doctorData = [
  { firstName: 'Rajesh', lastName: 'Sharma', specialization: 'General Medicine', medicalRegistrationNo: 'MCI-10001', consultationFee: 500, qualification: 'MBBS, MD', yearsOfExperience: 15 },
  { firstName: 'Sunita', lastName: 'Verma', specialization: 'Pediatrics', medicalRegistrationNo: 'MCI-10002', consultationFee: 600, qualification: 'MBBS, DCH', yearsOfExperience: 10 },
  { firstName: 'Vivek', lastName: 'Mehta', specialization: 'Orthopedics', medicalRegistrationNo: 'MCI-10003', consultationFee: 800, qualification: 'MBBS, MS Ortho', yearsOfExperience: 12 },
  { firstName: 'Lakshmi', lastName: 'Iyer', specialization: 'Gynecology', medicalRegistrationNo: 'MCI-10004', consultationFee: 700, qualification: 'MBBS, MS OBG', yearsOfExperience: 8 },
  { firstName: 'Arun', lastName: 'Singh', specialization: 'Cardiology', medicalRegistrationNo: 'MCI-10005', consultationFee: 1000, qualification: 'MBBS, DM Cardiology', yearsOfExperience: 20 },
  { firstName: 'Priya', lastName: 'Kapoor', specialization: 'Dermatology', medicalRegistrationNo: 'MCI-10006', consultationFee: 600, qualification: 'MBBS, MD Dermatology', yearsOfExperience: 7 },
  { firstName: 'Mohammed', lastName: 'Farooq', specialization: 'ENT', medicalRegistrationNo: 'MCI-10007', consultationFee: 550, qualification: 'MBBS, MS ENT', yearsOfExperience: 14 },
  { firstName: 'Deepa', lastName: 'Nair', specialization: 'Ophthalmology', medicalRegistrationNo: 'MCI-10008', consultationFee: 650, qualification: 'MBBS, MS Ophthalmology', yearsOfExperience: 11 },
  { firstName: 'Sanjay', lastName: 'Gupta', specialization: 'Neurology', medicalRegistrationNo: 'MCI-10009', consultationFee: 1200, qualification: 'MBBS, DM Neurology', yearsOfExperience: 18 },
  { firstName: 'Anjali', lastName: 'Desai', specialization: 'Psychiatry', medicalRegistrationNo: 'MCI-10010', consultationFee: 800, qualification: 'MBBS, MD Psychiatry', yearsOfExperience: 9 },
];

// Varied schedules: each doctor has different working days and hours
// dayOfWeek: 0=Monday … 6=Sunday
const doctorSchedules: { firstName: string; lastName: string; schedules: { dayOfWeek: number; startTime: string; endTime: string }[] }[] = [
  { // Dr. Rajesh Sharma — General Medicine: Mon–Fri 09:00–17:00
    firstName: 'Rajesh', lastName: 'Sharma',
    schedules: [
      { dayOfWeek: 0, startTime: '09:00', endTime: '17:00' },
      { dayOfWeek: 1, startTime: '09:00', endTime: '17:00' },
      { dayOfWeek: 2, startTime: '09:00', endTime: '17:00' },
      { dayOfWeek: 3, startTime: '09:00', endTime: '17:00' },
      { dayOfWeek: 4, startTime: '09:00', endTime: '17:00' },
    ],
  },
  { // Dr. Sunita Verma — Pediatrics: Mon, Wed, Fri 10:00–16:00 + Tue, Thu 14:00–20:00
    firstName: 'Sunita', lastName: 'Verma',
    schedules: [
      { dayOfWeek: 0, startTime: '10:00', endTime: '16:00' },
      { dayOfWeek: 1, startTime: '14:00', endTime: '20:00' },
      { dayOfWeek: 2, startTime: '10:00', endTime: '16:00' },
      { dayOfWeek: 3, startTime: '14:00', endTime: '20:00' },
      { dayOfWeek: 4, startTime: '10:00', endTime: '16:00' },
    ],
  },
  { // Dr. Vivek Mehta — Orthopedics: Mon–Sat 08:00–14:00
    firstName: 'Vivek', lastName: 'Mehta',
    schedules: [
      { dayOfWeek: 0, startTime: '08:00', endTime: '14:00' },
      { dayOfWeek: 1, startTime: '08:00', endTime: '14:00' },
      { dayOfWeek: 2, startTime: '08:00', endTime: '14:00' },
      { dayOfWeek: 3, startTime: '08:00', endTime: '14:00' },
      { dayOfWeek: 4, startTime: '08:00', endTime: '14:00' },
      { dayOfWeek: 5, startTime: '08:00', endTime: '12:00' },
    ],
  },
  { // Dr. Lakshmi Iyer — Gynecology: Mon–Fri 09:00–13:00
    firstName: 'Lakshmi', lastName: 'Iyer',
    schedules: [
      { dayOfWeek: 0, startTime: '09:00', endTime: '13:00' },
      { dayOfWeek: 1, startTime: '09:00', endTime: '13:00' },
      { dayOfWeek: 2, startTime: '09:00', endTime: '13:00' },
      { dayOfWeek: 3, startTime: '09:00', endTime: '13:00' },
      { dayOfWeek: 4, startTime: '09:00', endTime: '13:00' },
    ],
  },
  { // Dr. Arun Singh — Cardiology: Mon, Wed, Fri 08:00–12:00 + Tue, Thu 15:00–19:00
    firstName: 'Arun', lastName: 'Singh',
    schedules: [
      { dayOfWeek: 0, startTime: '08:00', endTime: '12:00' },
      { dayOfWeek: 1, startTime: '15:00', endTime: '19:00' },
      { dayOfWeek: 2, startTime: '08:00', endTime: '12:00' },
      { dayOfWeek: 3, startTime: '15:00', endTime: '19:00' },
      { dayOfWeek: 4, startTime: '08:00', endTime: '12:00' },
    ],
  },
  { // Dr. Priya Kapoor — Dermatology: Mon–Fri 11:00–19:00
    firstName: 'Priya', lastName: 'Kapoor',
    schedules: [
      { dayOfWeek: 0, startTime: '11:00', endTime: '19:00' },
      { dayOfWeek: 1, startTime: '11:00', endTime: '19:00' },
      { dayOfWeek: 2, startTime: '11:00', endTime: '19:00' },
      { dayOfWeek: 3, startTime: '11:00', endTime: '19:00' },
      { dayOfWeek: 4, startTime: '11:00', endTime: '19:00' },
    ],
  },
  { // Dr. Mohammed Farooq — ENT: Mon, Wed, Fri 09:00–14:00 + Tue, Thu 14:00–18:00
    firstName: 'Mohammed', lastName: 'Farooq',
    schedules: [
      { dayOfWeek: 0, startTime: '09:00', endTime: '14:00' },
      { dayOfWeek: 1, startTime: '14:00', endTime: '18:00' },
      { dayOfWeek: 2, startTime: '09:00', endTime: '14:00' },
      { dayOfWeek: 3, startTime: '14:00', endTime: '18:00' },
      { dayOfWeek: 4, startTime: '09:00', endTime: '14:00' },
    ],
  },
  { // Dr. Deepa Nair — Ophthalmology: Mon–Thu 10:00–16:00, Sat 10:00–13:00
    firstName: 'Deepa', lastName: 'Nair',
    schedules: [
      { dayOfWeek: 0, startTime: '10:00', endTime: '16:00' },
      { dayOfWeek: 1, startTime: '10:00', endTime: '16:00' },
      { dayOfWeek: 2, startTime: '10:00', endTime: '16:00' },
      { dayOfWeek: 3, startTime: '10:00', endTime: '16:00' },
      { dayOfWeek: 5, startTime: '10:00', endTime: '13:00' },
    ],
  },
  { // Dr. Sanjay Gupta — Neurology: Mon, Wed 08:00–13:00 + Tue, Thu 13:00–18:00, Fri 08:00–12:00
    firstName: 'Sanjay', lastName: 'Gupta',
    schedules: [
      { dayOfWeek: 0, startTime: '08:00', endTime: '13:00' },
      { dayOfWeek: 1, startTime: '13:00', endTime: '18:00' },
      { dayOfWeek: 2, startTime: '08:00', endTime: '13:00' },
      { dayOfWeek: 3, startTime: '13:00', endTime: '18:00' },
      { dayOfWeek: 4, startTime: '08:00', endTime: '12:00' },
    ],
  },
  { // Dr. Anjali Desai — Psychiatry: Tue–Sat 10:00–18:00
    firstName: 'Anjali', lastName: 'Desai',
    schedules: [
      { dayOfWeek: 1, startTime: '10:00', endTime: '18:00' },
      { dayOfWeek: 2, startTime: '10:00', endTime: '18:00' },
      { dayOfWeek: 3, startTime: '10:00', endTime: '18:00' },
      { dayOfWeek: 4, startTime: '10:00', endTime: '18:00' },
      { dayOfWeek: 5, startTime: '10:00', endTime: '18:00' },
    ],
  },
];

const shiftData = [
  { name: 'Morning', code: 'MOR', startTime: '08:00', endTime: '14:00', breakStartTime: '11:00', breakEndTime: '11:30', description: 'Morning shift' },
  { name: 'Afternoon', code: 'AFT', startTime: '14:00', endTime: '20:00', breakStartTime: '17:00', breakEndTime: '17:30', description: 'Afternoon shift' },
  { name: 'Full Day', code: 'FUL', startTime: '08:00', endTime: '20:00', breakStartTime: '13:00', breakEndTime: '14:00', isOvernight: false, description: 'Full day shift with lunch break' },
  { name: 'Evening', code: 'EVE', startTime: '16:00', endTime: '22:00', breakStartTime: '19:00', breakEndTime: '19:30', description: 'Evening OPD shift' },
];

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

// ─── Fresh mode: wipe all tables in FK-safe order ──────────

async function wipeAll() {
  console.log('⚠️  --fresh mode: wiping all tables...');
  // Order matters: children first (FK-safe)
  await prisma.patientAllergy.deleteMany();
  await prisma.allergy.deleteMany();
  await prisma.diagnosis.deleteMany();
  await prisma.dispensing.deleteMany();
  await prisma.prescriptionItem.deleteMany();
  await prisma.prescription.deleteMany();
  await prisma.billItem.deleteMany();
  await prisma.bill.deleteMany();
  await prisma.queueEntry.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.labOrder.deleteMany();
  await prisma.radiologyOrder.deleteMany();
  await prisma.procedureOrder.deleteMany();
  await prisma.employeeSchedule.deleteMany();
  await prisma.shift.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.rolePermission.deleteMany();
  await prisma.user.deleteMany();
  await prisma.patient.deleteMany();
  await prisma.doctor.deleteMany();
  await prisma.medicine.deleteMany();
  await prisma.permission.deleteMany();
  await prisma.role.deleteMany();
  await prisma.address.deleteMany();
  await prisma.organisation.deleteMany();
  console.log('✅ All tables wiped.');
}

// ─── Seed functions ─────────────────────────────────────────

async function seedOrganisation() {
  const existing = await prisma.organisation.count();
  if (existing > 0 && !FRESH) {
    console.log('Organisation already seeded, skipping.');
    return;
  }
  await prisma.organisation.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'City Clinic — OPD',
      address: '123 Health Avenue, Medical District',
      phone: '022-25551234',
      email: 'info@cityclinic.com',
      website: 'https://cityclinic.com',
      registrationNumber: 'REG-MH-2024-0001',
      registrationFee: 100,
    },
  });
  console.log('Seeded organisation.');
}

async function seedShifts() {
  const existing = await prisma.shift.count();
  if (existing > 0 && !FRESH) {
    console.log('Shifts already seeded, skipping.');
    return;
  }
  for (const shift of shiftData) {
    await prisma.shift.create({ data: shift });
  }
  console.log(`Seeded ${shiftData.length} shifts.`);
}

const allergyData = [
  { name: 'Penicillin', category: 'DRUG', severity: 'SEVERE', description: 'Beta-lactam antibiotic allergy' },
  { name: 'Sulfa', category: 'DRUG', severity: 'MODERATE', description: 'Sulfonamide antibiotic allergy' },
  { name: 'Aspirin', category: 'DRUG', severity: 'MODERATE', description: 'NSAID allergy' },
  { name: 'Ibuprofen', category: 'DRUG', severity: 'MILD', description: 'NSAID allergy' },
  { name: 'Codeine', category: 'DRUG', severity: 'MODERATE', description: 'Opioid allergy' },
  { name: 'Latex', category: 'ENVIRONMENTAL', severity: 'MODERATE', description: 'Latex/rubber allergy' },
  { name: 'Pollen', category: 'ENVIRONMENTAL', severity: 'MILD', description: 'Seasonal pollen allergy' },
  { name: 'Dust', category: 'ENVIRONMENTAL', severity: 'MILD', description: 'House dust mite allergy' },
  { name: 'Peanuts', category: 'FOOD', severity: 'SEVERE', description: 'Peanut/legume allergy' },
  { name: 'Shellfish', category: 'FOOD', severity: 'SEVERE', description: 'Shellfish allergy' },
  { name: 'Eggs', category: 'FOOD', severity: 'MODERATE', description: 'Egg allergy' },
  { name: 'Milk', category: 'FOOD', severity: 'MILD', description: 'Dairy/lactose allergy' },
  { name: 'Soy', category: 'FOOD', severity: 'MILD', description: 'Soy allergy' },
  { name: 'Wheat', category: 'FOOD', severity: 'MODERATE', description: 'Wheat/gluten sensitivity' },
  { name: 'Iodine', category: 'DRUG', severity: 'MODERATE', description: 'Contrast dye/iodine allergy' },
  { name: 'Bee Sting', category: 'ENVIRONMENTAL', severity: 'SEVERE', description: 'Hymenoptera venom allergy' },
];

async function seedAllergies() {
  const existing = await prisma.allergy.count();
  if (existing > 0 && !FRESH) {
    console.log('Allergies already seeded, skipping.');
    return;
  }
  for (const a of allergyData) {
    await prisma.allergy.upsert({
      where: { name: a.name },
      update: {},
      create: {
        name: a.name,
        description: a.description,
        severity: a.severity as any,
        category: a.category as any,
      },
    });
  }
  console.log(`Seeded ${allergyData.length} allergies in the catalog.`);
}

async function seedDoctors(): Promise<Doctor[]> {
  const rows: Doctor[] = [];
  for (const doc of doctorData) {
    const existing = await prisma.doctor.findFirst({ where: { medicalRegistrationNo: doc.medicalRegistrationNo } });
    if (existing) {
      rows.push(existing);
    } else {
      rows.push(
        await prisma.doctor.create({
          data: {
            qualification: doc.qualification,
            specialization: doc.specialization,
            medicalRegistrationNo: doc.medicalRegistrationNo,
            consultationFee: doc.consultationFee,
            yearsOfExperience: doc.yearsOfExperience,
            consultationMode: 'OFFLINE',
            verificationStatus: 'VERIFIED',
            isActive: true,
          },
        }),
      );
    }
  }
  console.log(`Seeded ${doctorData.length} doctors.`);
  return rows;
}

async function seedEmployeeSchedules(doctorRows: Doctor[]) {
  const existing = await prisma.employeeSchedule.count();
  if (existing > 0 && !FRESH) {
    console.log('Employee schedules already seeded, skipping.');
    return;
  }
  let count = 0;
  for (const doc of doctorRows) {
    const specSchedule = doctorSchedules.find((ds) => {
      const doctorInfo = doctorData.find((dd) => dd.medicalRegistrationNo === doc.medicalRegistrationNo);
      return doctorInfo && ds.firstName === doctorInfo.firstName;
    });
    if (specSchedule) {
      for (const sched of specSchedule.schedules) {
        await prisma.employeeSchedule.create({
          data: {
            employeeSchedulableType: 'Doctor',
            employeeSchedulableId: doc.id,
            dayOfWeek: sched.dayOfWeek,
            startTime: sched.startTime,
            endTime: sched.endTime,
          },
        });
        count++;
      }
    } else {
      // Fallback: Mon–Fri 09:00–17:00
      for (let dayOfWeek = 0; dayOfWeek <= 4; dayOfWeek++) {
        await prisma.employeeSchedule.create({
          data: {
            employeeSchedulableType: 'Doctor',
            employeeSchedulableId: doc.id,
            dayOfWeek,
            startTime: '09:00',
            endTime: '17:00',
          },
        });
        count++;
      }
    }
  }
  console.log(`Seeded ${count} employee schedules.`);
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

  const doctorReadResources = new Set(['patients', 'appointments', 'queue', 'medicine-catalog']);
  const doctorWriteResources = new Set(['prescriptions', 'lab-orders', 'radiology-orders', 'procedure-orders']);
  const doctorPerms = permissions.filter(
    (p) =>
      (doctorReadResources.has(p.resource) && p.action === 'read') ||
      (doctorWriteResources.has(p.resource) &&
        (p.action === 'create' || p.action === 'update' || p.action === 'read')),
  );

  const assistantReadResources = new Set(['patients', 'appointments', 'medicine-catalog']);
  const assistantWriteResources = new Set(['queue']);
  const assistantPerms = permissions.filter(
    (p) =>
      (assistantReadResources.has(p.resource) && p.action === 'read') ||
      (assistantWriteResources.has(p.resource) &&
        (p.action === 'read' || p.action === 'update')),
  );

  async function upsertRoleWithPermissions(name: string, description: string, perms: Permission[]) {
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

  const superAdmin = await upsertRoleWithPermissions('Super Admin', 'Full access to every module except Developer tools', superAdminPerms);
  const receptionist = await upsertRoleWithPermissions('Receptionist', 'Front-desk access to patients, appointments, queue, and billing', receptionistPerms);
  const doctor = await upsertRoleWithPermissions('Doctor', 'Clinical staff: manage prescriptions, lab orders, and radiology orders', doctorPerms);
  const assistant = await upsertRoleWithPermissions('Assistant', 'Support staff: manage queue and view basic patient info', assistantPerms);

  console.log(`Seeded roles: Super Admin (${superAdminPerms.length}), Receptionist (${receptionistPerms.length}), Doctor (${doctorPerms.length}), Assistant (${assistantPerms.length}).`);
  return { superAdmin, receptionist, doctor, assistant };
}

async function seedUsers(
  superAdminRoleId: string,
  receptionistRoleId: string,
  doctorRoleId: string,
  assistantRoleId: string,
  doctorRows: Doctor[],
) {
  const password = await bcrypt.hash('Password@123', 10);
  const doctorPassword = await bcrypt.hash('Doctor@123', 10);

  // System users (no doctor link)
  const systemUsers = [
    { username: 'superadmin', firstName: 'Super', lastName: 'Admin', email: 'superadmin@clinic.com', password, roleId: superAdminRoleId },
    { username: 'admin', firstName: 'Admin', lastName: 'User', email: 'admin@clinic.com', password, roleId: superAdminRoleId },
    { username: 'anitapatel', firstName: 'Anita', lastName: 'Patel', email: 'assistant@clinic.com', password, roleId: assistantRoleId },
  ];

  for (const u of systemUsers) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        username: u.username,
        firstName: u.firstName,
        lastName: u.lastName,
        email: u.email,
        password: u.password,
        roleId: u.roleId,
      },
    });
  }

  // Receptionist users — linked via userableType
  const receptionistUsers = [
    { username: 'frontdesk', firstName: 'Priya', lastName: 'Kapoor', email: 'receptionist@clinic.com', gender: 'FEMALE' },
    { username: 'meenakshi', firstName: 'Meenakshi', lastName: 'Reddy', email: 'meenakshi@clinic.com', gender: 'FEMALE' },
    { username: 'rajkumar', firstName: 'Raj', lastName: 'Kumar', email: 'raj@clinic.com', gender: 'MALE' },
  ];

  for (const u of receptionistUsers) {
    const existing = await prisma.user.findFirst({ where: { email: u.email } });
    if (!existing) {
      await prisma.user.create({
        data: {
          username: u.username,
          firstName: u.firstName,
          lastName: u.lastName,
          email: u.email,
          password: password,
          roleId: receptionistRoleId,
          userableType: 'Receptionist',
          gender: u.gender,
        },
      });
    }
  }

  // Doctor users — linked via userableType/userableId
  for (let i = 0; i < doctorRows.length; i++) {
    const doc = doctorRows[i];
    const info = doctorData[i];
    const email = `${info.firstName.toLowerCase()}.${info.lastName.toLowerCase()}@clinic.com`;
    const username = `${info.firstName.toLowerCase()}${info.lastName.toLowerCase()}`;

    const existing = await prisma.user.findFirst({ where: { userableType: 'Doctor', userableId: doc.id } });
    if (!existing) {
      await prisma.user.create({
        data: {
          username,
          firstName: info.firstName,
          lastName: info.lastName,
          email,
          password: doctorPassword,
          roleId: doctorRoleId,
          userableType: 'Doctor',
          userableId: doc.id,
          gender: i % 2 === 0 ? 'MALE' : 'FEMALE',
        },
      });
    }
  }

  console.log(`Seeded ${systemUsers.length} system users + ${receptionistUsers.length} receptionists + ${doctorRows.length} doctor users.`);
  console.log('Login credentials:');
  console.log('  superadmin@clinic.com / Password@123 (Super Admin)');
  console.log('  admin@clinic.com / Password@123 (Super Admin)');
  console.log('  receptionist@clinic.com / Password@123 (Receptionist — Priya Kapoor)');
  console.log('  meenakshi@clinic.com / Password@123 (Receptionist — Meenakshi Reddy)');
  console.log('  raj@clinic.com / Password@123 (Receptionist — Raj Kumar)');
  console.log('  rajesh.sharma@clinic.com / Doctor@123 (Doctor)');
  console.log('  assistant@clinic.com / Password@123 (Assistant)');
}

// ─── Patient with Appointment History ──────────────────────
// Creates demo patients with several completed visits across
// different doctors — useful for testing the "patient history"
// feature shown in the new-appointment flow.

const PATIENT_DEMOS = [
  {
    patient: {
      name: 'Ravi Kumar', phone: '9876543210', email: 'ravi.kumar@example.com',
      dateOfBirth: new Date('1992-06-15'), gender: 'Male', bloodGroup: 'O+',
      address: '42 Lake View Apartments, MG Road', emergencyContact: '9876543211',
      allergies: ['Pollen', 'Dust'], isFollowUp: true,
    },
    appointments: [
      { daysAgo: 21, doctorIndex: 0, type: 'WALK_IN', fee: 0, time: '09:30', status: 'COMPLETED', notes: 'General check-up — mild fever' },
      { daysAgo: 14, doctorIndex: 1, type: 'CONSULTATION', fee: 600, time: '10:15', status: 'COMPLETED', notes: 'Pediatric follow-up for child' },
      { daysAgo: 10, doctorIndex: 2, type: 'SPECIALIST', fee: 800, time: '14:00', status: 'COMPLETED', notes: 'Orthopedic consult for knee pain' },
      { daysAgo: 7, doctorIndex: 0, type: 'FOLLOW_UP', fee: 500, time: '11:00', status: 'COMPLETED', notes: 'Follow-up — fever resolved' },
      { daysAgo: 3, doctorIndex: 4, type: 'SPECIALIST', fee: 1000, time: '15:30', status: 'COMPLETED', notes: 'Cardiology check-up — chest discomfort' },
    ],
  },
  {
    patient: {
      name: 'Meena Sharma', phone: '9876543212', email: 'meena.sharma@example.com',
      dateOfBirth: new Date('1955-11-20'), gender: 'Female', bloodGroup: 'B+',
      address: '12A Sunrise Colony, Sector 7', emergencyContact: '9876543213',
      allergies: ['Aspirin', 'Penicillin'], isFollowUp: true,
    },
    appointments: [
      { daysAgo: 30, doctorIndex: 2, type: 'SPECIALIST', fee: 800, time: '09:00', status: 'COMPLETED', notes: 'Orthopedic consult — chronic knee pain' },
      { daysAgo: 18, doctorIndex: 4, type: 'SPECIALIST', fee: 1000, time: '14:00', status: 'COMPLETED', notes: 'Cardiology follow-up — hypertension' },
      { daysAgo: 5, doctorIndex: 4, type: 'FOLLOW_UP', fee: 500, time: '11:30', status: 'COMPLETED', notes: 'BP check — stable' },
    ],
  },
  {
    patient: {
      name: 'Baby Aarav', phone: '9876543214', email: null,
      dateOfBirth: new Date('2023-08-02'), gender: 'Male', bloodGroup: 'A+',
      address: '7/22 Green Park, East Wing', emergencyContact: '9876543215',
      allergies: ['Milk', 'Eggs'], isFollowUp: false,
    },
    appointments: [
      { daysAgo: 45, doctorIndex: 1, type: 'WALK_IN', fee: 0, time: '10:00', status: 'COMPLETED', notes: 'Newborn check-up — weight & vaccinations' },
      { daysAgo: 28, doctorIndex: 1, type: 'CONSULTATION', fee: 600, time: '10:30', status: 'COMPLETED', notes: 'Routine vaccination visit' },
      { daysAgo: 12, doctorIndex: 1, type: 'FOLLOW_UP', fee: 300, time: '09:00', status: 'COMPLETED', notes: 'Milk allergy assessment — improving' },
    ],
  },
  {
    patient: {
      name: 'Priya Patel', phone: '9876543216', email: 'priya.patel@example.com',
      dateOfBirth: new Date('1988-03-10'), gender: 'Female', bloodGroup: 'AB+',
      address: '55 Lake Gardens, B Block', emergencyContact: '9876543217',
      allergies: ['Sulfa', 'Dust'], isFollowUp: false,
    },
    appointments: [
      { daysAgo: 35, doctorIndex: 5, type: 'CONSULTATION', fee: 600, time: '11:00', status: 'COMPLETED', notes: 'Skin rash — diagnosed as eczema' },
      { daysAgo: 20, doctorIndex: 5, type: 'FOLLOW_UP', fee: 300, time: '14:30', status: 'COMPLETED', notes: 'Dermatology follow-up — improved' },
      { daysAgo: 8, doctorIndex: 3, type: 'SPECIALIST', fee: 700, time: '10:00', status: 'COMPLETED', notes: 'Gynecology consult — routine check-up' },
    ],
  },
  {
    patient: {
      name: 'Abdul Khan', phone: '9876543218', email: 'abdul.khan@example.com',
      dateOfBirth: new Date('1962-12-05'), gender: 'Male', bloodGroup: 'O-',
      address: '33 Hill Road, Near Mosque', emergencyContact: '9876543219',
      allergies: ['Codeine'], isFollowUp: true,
    },
    appointments: [
      { daysAgo: 40, doctorIndex: 8, type: 'SPECIALIST', fee: 1200, time: '09:00', status: 'COMPLETED', notes: 'Neurology consult — chronic headaches' },
      { daysAgo: 25, doctorIndex: 6, type: 'CONSULTATION', fee: 550, time: '15:00', status: 'COMPLETED', notes: 'ENT check — hearing difficulty' },
      { daysAgo: 10, doctorIndex: 8, type: 'FOLLOW_UP', fee: 600, time: '11:00', status: 'COMPLETED', notes: 'Headache follow-up — MRI reports normal' },
      { daysAgo: 2, doctorIndex: 6, type: 'FOLLOW_UP', fee: 300, time: '14:00', status: 'COMPLETED', notes: 'ENT follow-up — hearing aid trial' },
    ],
  },
];

// Appointment/queue history seeding was removed — it cluttered the live
// Appointments/Queue views with fake data indistinguishable from real
// bookings. Only the demo patients themselves are seeded now, so the
// "patient history" feature can still be tested by booking real
// appointments for them through the app.
async function seedPatientsWithHistory() {
  let totalPatients = 0;
  for (const demo of PATIENT_DEMOS) {
    await prisma.patient.upsert({
      where: { phone: demo.patient.phone },
      update: {},
      create: demo.patient,
    });
    totalPatients++;
  }
  console.log(`Seeded ${totalPatients} demo patients (no appointment/queue history).`);
}

// ─── Main ───────────────────────────────────────────────────

async function main() {
  if (FRESH) {
    await wipeAll();
  }

  console.log('🌱 Seeding login-essential data...');

  await seedOrganisation();
  await seedShifts();
  await seedAllergies();
  const doctors = await seedDoctors();
  await seedEmployeeSchedules(doctors);

  const permissions = await seedPermissions();
  const roles = await seedRoles(permissions);
  await seedUsers(roles.superAdmin.id, roles.receptionist.id, roles.doctor.id, roles.assistant.id, doctors);

  if (FRESH) {
    await seedPatientsWithHistory();
  }

  console.log('✅ Seed complete.');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
