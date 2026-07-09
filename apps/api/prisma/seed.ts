import { PrismaClient, type Permission, type Patient, type Doctor, type Medicine } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Deterministic PRNG (mulberry32) so every fresh seed produces the same demo dataset.
function createRng(seed: number) {
  let a = seed;
  return function rng() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rng = createRng(20260708);

function pick<T>(arr: T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}
function pickWeighted<T>(entries: [T, number][]): T {
  const total = entries.reduce((sum, [, w]) => sum + w, 0);
  let roll = rng() * total;
  for (const [value, weight] of entries) {
    if (roll < weight) return value;
    roll -= weight;
  }
  return entries[entries.length - 1][0];
}
function randomInt(min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}
function daysFromNow(days: number, hour = 9, minute = 0): Date {
  const d = new Date();
  d.setHours(hour, minute, 0, 0);
  d.setDate(d.getDate() + days);
  return d;
}

const patients = [
  { name: 'Aarav Sharma', phone: '9810000001', gender: 'MALE', bloodGroup: 'B+' },
  { name: 'Priya Verma', phone: '9810000002', gender: 'FEMALE', bloodGroup: 'O+' },
  { name: 'Rohan Mehta', phone: '9810000003', gender: 'MALE', bloodGroup: 'A+' },
  { name: 'Ananya Iyer', phone: '9810000004', gender: 'FEMALE', bloodGroup: 'AB+' },
  { name: 'Vikram Singh', phone: '9810000005', gender: 'MALE', bloodGroup: 'O-' },
  { name: 'Neha Gupta', phone: '9810000006', gender: 'FEMALE', bloodGroup: 'A-' },
  { name: 'Karan Malhotra', phone: '9810000007', gender: 'MALE', bloodGroup: 'B-' },
  { name: 'Sneha Reddy', phone: '9810000008', gender: 'FEMALE', bloodGroup: 'O+' },
  { name: 'Arjun Nair', phone: '9810000009', gender: 'MALE', bloodGroup: 'AB-' },
  { name: 'Divya Menon', phone: '9810000010', gender: 'FEMALE', bloodGroup: 'B+' },
  { name: 'Rahul Kapoor', phone: '9810000011', gender: 'MALE', bloodGroup: 'O+' },
  { name: 'Ishita Bose', phone: '9810000012', gender: 'FEMALE', bloodGroup: 'A+' },
  { name: 'Aditya Rao', phone: '9810000013', gender: 'MALE', bloodGroup: 'B+' },
  { name: 'Kavya Pillai', phone: '9810000014', gender: 'FEMALE', bloodGroup: 'O-' },
  { name: 'Siddharth Joshi', phone: '9810000015', gender: 'MALE', bloodGroup: 'A-' },
  { name: 'Meera Choudhary', phone: '9810000016', gender: 'FEMALE', bloodGroup: 'AB+' },
  { name: 'Yash Trivedi', phone: '9810000017', gender: 'MALE', bloodGroup: 'O+' },
  { name: 'Pooja Agarwal', phone: '9810000018', gender: 'FEMALE', bloodGroup: 'B-' },
];

const doctors = [
  { specialization: 'General Medicine', medicalRegistrationNo: 'MCI-10001', consultationFee: 500 },
  { specialization: 'Pediatrics', medicalRegistrationNo: 'MCI-10002', consultationFee: 600 },
  { specialization: 'Orthopedics', medicalRegistrationNo: 'MCI-10003', consultationFee: 800 },
  { specialization: 'Gynecology', medicalRegistrationNo: 'MCI-10004', consultationFee: 700 },
  { specialization: 'Cardiology', medicalRegistrationNo: 'MCI-10005', consultationFee: 1000 },
];

const medicines = [
  { name: 'Paracetamol', genericName: 'Acetaminophen', category: 'TABLET', strength: '500mg', unit: 'tablet', price: 20 },
  { name: 'Amoxicillin', genericName: 'Amoxicillin', category: 'CAPSULE', strength: '250mg', unit: 'capsule', price: 45 },
  { name: 'Azithromycin', genericName: 'Azithromycin', category: 'TABLET', strength: '500mg', unit: 'tablet', price: 85 },
  { name: 'Cetirizine', genericName: 'Cetirizine', category: 'TABLET', strength: '10mg', unit: 'tablet', price: 15 },
  { name: 'Metformin', genericName: 'Metformin', category: 'TABLET', strength: '500mg', unit: 'tablet', price: 30 },
  { name: 'Amlodipine', genericName: 'Amlodipine', category: 'TABLET', strength: '5mg', unit: 'tablet', price: 35 },
  { name: 'Omeprazole', genericName: 'Omeprazole', category: 'CAPSULE', strength: '20mg', unit: 'capsule', price: 40 },
  { name: 'Ibuprofen', genericName: 'Ibuprofen', category: 'TABLET', strength: '400mg', unit: 'tablet', price: 25 },
  { name: 'Cough Syrup', genericName: 'Dextromethorphan', category: 'SYRUP', strength: '100ml', unit: 'ml', price: 90 },
  { name: 'Vitamin D3', genericName: 'Cholecalciferol', category: 'TABLET', strength: '60000IU', unit: 'tablet', price: 28 },
  { name: 'Insulin Glargine', genericName: 'Insulin Glargine', category: 'INJECTION', strength: '100IU/ml', unit: 'ml', price: 420 },
  { name: 'Salbutamol Inhaler', genericName: 'Salbutamol', category: 'INHALER', strength: '100mcg', unit: 'puff', price: 210 },
  { name: 'Hydrocortisone Cream', genericName: 'Hydrocortisone', category: 'CREAM', strength: '1%', unit: 'gram', price: 65 },
  { name: 'Ofloxacin Eye Drops', genericName: 'Ofloxacin', category: 'DROPS', strength: '0.3%', unit: 'ml', price: 55 },
  { name: 'Losartan', genericName: 'Losartan Potassium', category: 'TABLET', strength: '50mg', unit: 'tablet', price: 32 },
  { name: 'Atorvastatin', genericName: 'Atorvastatin', category: 'TABLET', strength: '10mg', unit: 'tablet', price: 38 },
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

async function seedPatients(): Promise<Patient[]> {
  const rows: Patient[] = [];
  for (const patient of patients) {
    rows.push(await prisma.patient.upsert({ where: { phone: patient.phone }, update: {}, create: patient }));
  }
  console.log(`Seeded ${patients.length} patients.`);
  return rows;
}

async function seedDoctors(): Promise<Doctor[]> {
  const rows: Doctor[] = [];
  for (const doctor of doctors) {
    const existing = await prisma.doctor.findFirst({ where: { medicalRegistrationNo: doctor.medicalRegistrationNo } });
    if (existing) {
      rows.push(existing);
    } else {
      rows.push(
        await prisma.doctor.create({
          data: {
            specialization: doctor.specialization,
            medicalRegistrationNo: doctor.medicalRegistrationNo,
            consultationFee: doctor.consultationFee,
            qualification: 'MBBS',
            verificationStatus: 'VERIFIED',
          },
        }),
      );
    }
  }
  console.log(`Seeded ${doctors.length} doctors.`);
  return rows;
}

async function seedEmployeeSchedules(doctorRows: { id: string }[]) {
  const existing = await prisma.employeeSchedule.count();
  if (existing > 0) {
    console.log('Employee schedules already seeded, skipping.');
    return;
  }
  let count = 0;
  for (const doctor of doctorRows) {
    for (let dayOfWeek = 0; dayOfWeek <= 4; dayOfWeek++) {
      await prisma.employeeSchedule.create({
        data: {
          employeeSchedulableType: 'Doctor',
          employeeSchedulableId: doctor.id,
          dayOfWeek,
          startTime: '09:00',
          endTime: '17:00',
        },
      });
      count++;
    }
  }
  console.log(`Seeded ${count} employee schedules (replacing DoctorSchedule).`);
}

async function seedMedicines(): Promise<Medicine[]> {
  const rows: Medicine[] = [];
  for (const medicine of medicines) {
    const existing = await prisma.medicine.findFirst({ where: { name: medicine.name } });
    rows.push(existing ?? (await prisma.medicine.create({ data: medicine })));
  }
  console.log(`Seeded ${medicines.length} medicines.`);
  return rows;
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

  // Doctor — clinical staff: full write access to clinical modules, read-only on patient data
  const doctorReadResources = new Set(['patients', 'appointments', 'queue', 'medicine-catalog']);
  const doctorWriteResources = new Set(['prescriptions', 'lab-orders', 'radiology-orders', 'procedure-orders']);
  const doctorPerms = permissions.filter(
    (p) =>
      (doctorReadResources.has(p.resource) && p.action === 'read') ||
      (doctorWriteResources.has(p.resource) &&
        (p.action === 'create' || p.action === 'update' || p.action === 'read')),
  );

  // Assistant — support staff: read basic info, manage queue status
  const assistantReadResources = new Set(['patients', 'appointments', 'medicine-catalog']);
  const assistantWriteResources = new Set(['queue']);
  const assistantPerms = permissions.filter(
    (p) =>
      (assistantReadResources.has(p.resource) && p.action === 'read') ||
      (assistantWriteResources.has(p.resource) &&
        (p.action === 'read' || p.action === 'update')),
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

  const doctor = await upsertRoleWithPermissions(
    'Doctor',
    'Clinical staff: manage prescriptions, lab orders, and radiology orders',
    doctorPerms,
  );
  const assistant = await upsertRoleWithPermissions(
    'Assistant',
    'Support staff: manage queue and view basic patient info',
    assistantPerms,
  );

  console.log(
    `Seeded roles: Super Admin (${superAdminPerms.length} perms), Receptionist (${receptionistPerms.length} perms), Doctor (${doctorPerms.length} perms), Assistant (${assistantPerms.length} perms).`,
  );
  return { superAdmin, receptionist, doctor, assistant };
}

async function seedUsers(
  superAdminRoleId: string,
  receptionistRoleId: string,
  doctorRoleId: string,
  assistantRoleId: string,
) {
  const users = [
    {
      username: 'superadmin',
      firstName: 'Super',
      lastName: 'Admin',
      email: 'superadmin@clinic.com',
      password: 'SuperAdmin@123',
      roleId: superAdminRoleId,
    },
    {
      username: 'admin',
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@clinic.com',
      password: 'Admin@123',
      roleId: superAdminRoleId,
    },
    {
      username: 'frontdesk',
      firstName: 'Front',
      lastName: 'Desk',
      email: 'receptionist@clinic.com',
      password: 'Receptionist@123',
      roleId: receptionistRoleId,
    },
    {
      username: 'drsharma',
      firstName: 'Dr.',
      lastName: 'Sharma',
      email: 'doctor@clinic.com',
      password: 'Doctor@123',
      roleId: doctorRoleId,
    },
    {
      username: 'anitapatel',
      firstName: 'Anita',
      lastName: 'Patel',
      email: 'assistant@clinic.com',
      password: 'Assistant@123',
      roleId: assistantRoleId,
    },
  ];

  for (const u of users) {
    const password = await bcrypt.hash(u.password, 10);
    await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        username: u.username,
        firstName: u.firstName,
        lastName: u.lastName,
        email: u.email,
        password,
        roleId: u.roleId,
      },
    });
  }

  console.log('Seeded users:');
  for (const u of users) console.log(`  ${u.email} / ${u.password}`);
}

// ─── Clinical / transactional demo data ──────────────────────
// These models have no natural unique key, so we only generate them once:
// if the table already has rows we leave them untouched (real usage or a prior seed run).

const APPOINTMENT_TYPES = ['WALK_IN', 'CONSULTATION', 'SPECIALIST', 'EMERGENCY', 'FOLLOW_UP', 'TELECONSULTATION'];
const PAST_APPOINTMENT_STATUSES: [string, number][] = [
  ['COMPLETED', 65],
  ['CANCELLED', 12],
  ['NO_SHOW', 8],
];
const FUTURE_APPOINTMENT_STATUSES: [string, number][] = [
  ['SCHEDULED', 55],
  ['CONFIRMED', 30],
  ['CHECKED_IN', 10],
  ['IN_PROGRESS', 5],
];

async function seedAppointments(patientRows: Patient[], doctorRows: Doctor[]) {
  const existing = await prisma.appointment.count();
  if (existing > 0) {
    console.log('Appointments already seeded, skipping.');
    return [];
  }

  const created: { id: string; patientId: string; doctorId: string; status: string; date: Date; fee: number }[] = [];

  // 60 appointments spread over the last 60 days (mostly resolved) …
  for (let i = 0; i < 60; i++) {
    const date = daysFromNow(-randomInt(1, 60), randomInt(9, 16), pick([0, 15, 30, 45]));
    const patient = pick(patientRows);
    const doctor = pick(doctorRows);
    const status = pickWeighted(PAST_APPOINTMENT_STATUSES);
    const fee = randomInt(3, 9) * 100;
    const appt = await prisma.appointment.create({
      data: {
        patientId: patient.id,
        doctorId: doctor.id,
        date,
        type: pick(APPOINTMENT_TYPES),
        status,
        tokenNumber: randomInt(1, 40),
        fee,
      },
    });
    created.push({ id: appt.id, patientId: patient.id, doctorId: doctor.id, status, date, fee });
  }

  // … and 15 upcoming appointments for the next 14 days.
  for (let i = 0; i < 15; i++) {
    const date = daysFromNow(randomInt(0, 14), randomInt(9, 16), pick([0, 15, 30, 45]));
    const patient = pick(patientRows);
    const doctor = pick(doctorRows);
    const status = pickWeighted(FUTURE_APPOINTMENT_STATUSES);
    const fee = randomInt(3, 9) * 100;
    const appt = await prisma.appointment.create({
      data: {
        patientId: patient.id,
        doctorId: doctor.id,
        date,
        type: pick(APPOINTMENT_TYPES),
        status,
        tokenNumber: randomInt(1, 40),
        fee,
      },
    });
    created.push({ id: appt.id, patientId: patient.id, doctorId: doctor.id, status, date, fee });
  }

  console.log(`Seeded ${created.length} appointments.`);
  return created;
}

async function seedQueueEntries(patientRows: Patient[], doctorRows: Doctor[]) {
  const existing = await prisma.queueEntry.count();
  if (existing > 0) {
    console.log('Queue entries already seeded, skipping.');
    return;
  }

  const statusesToday: [string, number][] = [
    ['WAITING', 40],
    ['IN_PROGRESS', 15],
    ['COMPLETED', 35],
    ['SKIPPED', 5],
    ['NO_SHOW', 5],
  ];

  let count = 0;
  for (const doctor of doctorRows) {
    const today = daysFromNow(0, 8, 0);
    const patientsForToday = [...patientRows].sort(() => rng() - 0.5).slice(0, randomInt(4, 8));
    let token = 1;
    for (const patient of patientsForToday) {
      await prisma.queueEntry.create({
        data: {
          tokenNumber: token,
          patientId: patient.id,
          doctorId: doctor.id,
          status: pickWeighted(statusesToday),
          queueDate: today,
          checkedInAt: daysFromNow(0, 8, token * 5),
        },
      });
      token++;
      count++;
    }
  }
  console.log(`Seeded ${count} queue entries.`);
}

const DIAGNOSES = [
  'Upper respiratory tract infection', 'Type 2 diabetes mellitus', 'Hypertension',
  'Acute gastroenteritis', 'Seasonal allergic rhinitis', 'Migraine',
  'Lower back pain', 'Viral fever', 'Bronchial asthma', 'Urinary tract infection',
];
const DOSAGES = ['1-0-1', '1-1-1', '0-0-1', '1-0-0', '2-0-2'];

async function seedPrescriptions(
  completedAppointments: { patientId: string; doctorId: string; date: Date }[],
  medicineRows: Medicine[],
) {
  const existing = await prisma.prescription.count();
  if (existing > 0) {
    console.log('Prescriptions already seeded, skipping.');
    return;
  }

  let count = 0;
  let dispensingCount = 0;
  for (const appt of completedAppointments) {
    const status = pickWeighted<'DISPENSED' | 'ACTIVE' | 'CANCELLED'>([
      ['DISPENSED', 60],
      ['ACTIVE', 30],
      ['CANCELLED', 10],
    ]);
    const prescription = await prisma.prescription.create({
      data: {
        patientId: appt.patientId,
        doctorId: appt.doctorId,
        diagnosis: pick(DIAGNOSES),
        notes: 'Follow up if symptoms persist beyond a week.',
        status,
        createdAt: appt.date,
        updatedAt: appt.date,
      },
    });
    count++;

    const itemCount = randomInt(1, 3);
    const chosenMedicines = [...medicineRows].sort(() => rng() - 0.5).slice(0, itemCount);
    for (const medicine of chosenMedicines) {
      const quantity = randomInt(5, 30);
      await prisma.prescriptionItem.create({
        data: {
          prescriptionId: prescription.id,
          medicineId: medicine.id,
          medicineName: medicine.name,
          dosage: pick(DOSAGES),
          duration: `${randomInt(3, 14)} days`,
          instructions: pick(['After meals', 'Before meals', 'At bedtime', 'With water']),
          quantity,
        },
      });

      if (status === 'DISPENSED') {
        await prisma.dispensing.create({
          data: {
            prescriptionId: prescription.id,
            medicineId: medicine.id,
            medicineName: medicine.name,
            quantity,
            batchNo: `B${randomInt(1000, 9999)}`,
            expiryDate: daysFromNow(randomInt(180, 720)),
            dispensedAt: appt.date,
            dispensedBy: 'Front Desk',
          },
        });
        dispensingCount++;
      }
    }
  }
  console.log(`Seeded ${count} prescriptions with items, and ${dispensingCount} dispensing records.`);
}

const LAB_TESTS: [string, string][] = [
  ['Complete Blood Count', 'HEMATOLOGY'],
  ['Lipid Profile', 'BIOCHEMISTRY'],
  ['Liver Function Test', 'BIOCHEMISTRY'],
  ['Kidney Function Test', 'BIOCHEMISTRY'],
  ['Urine Routine', 'PATHOLOGY'],
  ['Blood Glucose Fasting', 'BIOCHEMISTRY'],
  ['Thyroid Profile', 'BIOCHEMISTRY'],
  ['Stool Culture', 'MICROBIOLOGY'],
];
const RADIOLOGY_STUDIES: [string, string][] = [
  ['Chest X-Ray PA View', 'XRAY'],
  ['Abdomen Ultrasound', 'ULTRASOUND'],
  ['CT Brain Plain', 'CT'],
  ['MRI Lumbar Spine', 'MRI'],
  ['Knee X-Ray', 'XRAY'],
];
const PROCEDURES: [string, string][] = [
  ['ECG', 'DIAGNOSTIC'],
  ['Nebulization', 'THERAPEUTIC'],
  ['Wound Dressing', 'THERAPEUTIC'],
  ['Pulmonary Function Test', 'DIAGNOSTIC'],
  ['Minor Suturing', 'SURGICAL'],
];
const ORDER_STATUSES: [string, number][] = [
  ['COMPLETED', 60],
  ['PROCESSING', 15],
  ['ORDERED', 15],
  ['CANCELLED', 10],
];

async function seedLabOrders(patientRows: Patient[], doctorRows: Doctor[]) {
  const existing = await prisma.labOrder.count();
  if (existing > 0) {
    console.log('Lab orders already seeded, skipping.');
    return;
  }
  let count = 0;
  for (let i = 0; i < 22; i++) {
    const [testName, category] = pick(LAB_TESTS);
    const status = pickWeighted(ORDER_STATUSES);
    const createdAt = daysFromNow(-randomInt(0, 45));
    await prisma.labOrder.create({
      data: {
        patientId: pick(patientRows).id,
        doctorId: pick(doctorRows).id,
        testName,
        category,
        status: status === 'PROCESSING' ? 'PROCESSING' : status,
        result: status === 'COMPLETED' ? 'Within normal limits' : null,
        resultDate: status === 'COMPLETED' ? daysFromNow(-randomInt(0, 44)) : null,
        createdAt,
        updatedAt: createdAt,
      },
    });
    count++;
  }
  console.log(`Seeded ${count} lab orders.`);
}

async function seedRadiologyOrders(patientRows: Patient[], doctorRows: Doctor[]) {
  const existing = await prisma.radiologyOrder.count();
  if (existing > 0) {
    console.log('Radiology orders already seeded, skipping.');
    return;
  }
  let count = 0;
  for (let i = 0; i < 16; i++) {
    const [studyName, category] = pick(RADIOLOGY_STUDIES);
    const status = pickWeighted(ORDER_STATUSES);
    const createdAt = daysFromNow(-randomInt(0, 45));
    await prisma.radiologyOrder.create({
      data: {
        patientId: pick(patientRows).id,
        doctorId: pick(doctorRows).id,
        studyName,
        category,
        status,
        result: status === 'COMPLETED' ? 'No acute abnormality detected.' : null,
        resultDate: status === 'COMPLETED' ? daysFromNow(-randomInt(0, 44)) : null,
        createdAt,
        updatedAt: createdAt,
      },
    });
    count++;
  }
  console.log(`Seeded ${count} radiology orders.`);
}

async function seedProcedureOrders(patientRows: Patient[], doctorRows: Doctor[]) {
  const existing = await prisma.procedureOrder.count();
  if (existing > 0) {
    console.log('Procedure orders already seeded, skipping.');
    return;
  }
  let count = 0;
  for (let i = 0; i < 12; i++) {
    const [procedureName, category] = pick(PROCEDURES);
    const status = pickWeighted(ORDER_STATUSES);
    const createdAt = daysFromNow(-randomInt(0, 45));
    await prisma.procedureOrder.create({
      data: {
        patientId: pick(patientRows).id,
        doctorId: pick(doctorRows).id,
        procedureName,
        category,
        status,
        result: status === 'COMPLETED' ? 'Procedure completed without complications.' : null,
        resultDate: status === 'COMPLETED' ? daysFromNow(-randomInt(0, 44)) : null,
        createdAt,
        updatedAt: createdAt,
      },
    });
    count++;
  }
  console.log(`Seeded ${count} procedure orders.`);
}

const PAYMENT_METHODS: [string, number][] = [
  ['CASH', 45],
  ['CARD', 30],
  ['UPI', 25],
];
const BILL_STATUSES: [string, number][] = [
  ['PAID', 70],
  ['PENDING', 15],
  ['PARTIAL', 10],
  ['REFUNDED', 5],
];

async function seedBills(completedAppointments: { patientId: string; date: Date; fee: number }[]) {
  const existing = await prisma.bill.count();
  if (existing > 0) {
    console.log('Bills already seeded, skipping.');
    return;
  }

  let count = 0;
  let invoiceSeq = 1001;
  for (const appt of completedAppointments) {
    const consultFee = appt.fee || randomInt(3, 9) * 100;
    const medicineAmount = randomInt(0, 3) === 0 ? 0 : randomInt(50, 400);
    const subtotal = consultFee + medicineAmount;
    const discount = randomInt(0, 10) === 0 ? Math.round(subtotal * 0.1) : 0;
    const tax = Math.round((subtotal - discount) * 0.05);
    const total = subtotal - discount + tax;
    const status = pickWeighted(BILL_STATUSES);

    const bill = await prisma.bill.create({
      data: {
        patientId: appt.patientId,
        invoiceNo: `INV-${invoiceSeq++}`,
        subtotal,
        discount,
        tax,
        total,
        paymentMethod: pickWeighted(PAYMENT_METHODS),
        status,
        createdAt: appt.date,
        updatedAt: appt.date,
      },
    });

    await prisma.billItem.create({
      data: {
        billId: bill.id,
        itemType: 'CONSULTATION',
        itemName: 'Doctor Consultation Fee',
        quantity: 1,
        unitPrice: consultFee,
        amount: consultFee,
      },
    });
    if (medicineAmount > 0) {
      await prisma.billItem.create({
        data: {
          billId: bill.id,
          itemType: 'MEDICINE',
          itemName: 'Prescribed medicines',
          quantity: 1,
          unitPrice: medicineAmount,
          amount: medicineAmount,
        },
      });
    }
    count++;
  }
  console.log(`Seeded ${count} bills with line items.`);
}

async function main() {
  const patientRows = await seedPatients();
  const doctorRows = await seedDoctors();
  await seedEmployeeSchedules(doctorRows);
  const medicineRows = await seedMedicines();

  const permissions = await seedPermissions();
  const { superAdmin, receptionist, doctor, assistant } = await seedRoles(permissions);
  await seedUsers(superAdmin.id, receptionist.id, doctor.id, assistant.id);

  const appointments = await seedAppointments(patientRows, doctorRows);
  await seedQueueEntries(patientRows, doctorRows);

  const completed = appointments.filter((a) => a.status === 'COMPLETED');
  await seedPrescriptions(completed, medicineRows);
  await seedLabOrders(patientRows, doctorRows);
  await seedRadiologyOrders(patientRows, doctorRows);
  await seedProcedureOrders(patientRows, doctorRows);
  await seedBills(completed);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
