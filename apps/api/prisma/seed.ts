import { PrismaClient, type Permission, type Patient, type Doctor, type Medicine, type Allergy } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const FRESH = process.argv.includes('--fresh');

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
const rng = createRng(20260717);

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

/** Generates a composite token: YYYYMMDD-INITIALS-HHMM */
function generateTokenNumber(date: Date, patientName: string): string {
  const y = date.getFullYear().toString();
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  const d = date.getDate().toString().padStart(2, '0');
  const h = date.getHours().toString().padStart(2, '0');
  const min = date.getMinutes().toString().padStart(2, '0');
  const nameInitials = patientName
    .split(' ')
    .map((p) => p.charAt(0).toUpperCase())
    .join('')
    .slice(0, 4);
  return `${y}${m}${d}-${nameInitials}-${h}${min}`;
}

// ─── Master Data ────────────────────────────────────────────

const patientData = [
  { name: 'Aarav Sharma', phone: '9810000001', gender: 'MALE', bloodGroup: 'B+', email: 'aarav@example.com' },
  { name: 'Priya Verma', phone: '9810000002', gender: 'FEMALE', bloodGroup: 'O+', email: 'priya@example.com' },
  { name: 'Rohan Mehta', phone: '9810000003', gender: 'MALE', bloodGroup: 'A+', email: 'rohan@example.com' },
  { name: 'Ananya Iyer', phone: '9810000004', gender: 'FEMALE', bloodGroup: 'AB+', email: 'ananya@example.com' },
  { name: 'Vikram Singh', phone: '9810000005', gender: 'MALE', bloodGroup: 'O-', email: 'vikram@example.com' },
  { name: 'Neha Gupta', phone: '9810000006', gender: 'FEMALE', bloodGroup: 'A-', email: 'neha@example.com' },
  { name: 'Karan Malhotra', phone: '9810000007', gender: 'MALE', bloodGroup: 'B-', email: 'karan@example.com' },
  { name: 'Sneha Reddy', phone: '9810000008', gender: 'FEMALE', bloodGroup: 'O+', email: 'sneha@example.com' },
  { name: 'Arjun Nair', phone: '9810000009', gender: 'MALE', bloodGroup: 'AB-', email: 'arjun@example.com' },
  { name: 'Divya Menon', phone: '9810000010', gender: 'FEMALE', bloodGroup: 'B+', email: 'divya@example.com' },
  { name: 'Rahul Kapoor', phone: '9810000011', gender: 'MALE', bloodGroup: 'O+', email: 'rahul@example.com' },
  { name: 'Ishita Bose', phone: '9810000012', gender: 'FEMALE', bloodGroup: 'A+', email: 'ishita@example.com' },
  { name: 'Aditya Rao', phone: '9810000013', gender: 'MALE', bloodGroup: 'B+', email: 'aditya@example.com' },
  { name: 'Kavya Pillai', phone: '9810000014', gender: 'FEMALE', bloodGroup: 'O-', email: 'kavya@example.com' },
  { name: 'Siddharth Joshi', phone: '9810000015', gender: 'MALE', bloodGroup: 'A-', email: 'siddharth@example.com' },
  { name: 'Meera Choudhary', phone: '9810000016', gender: 'FEMALE', bloodGroup: 'AB+', email: 'meera@example.com' },
  { name: 'Yash Trivedi', phone: '9810000017', gender: 'MALE', bloodGroup: 'O+', email: 'yash@example.com' },
  { name: 'Pooja Agarwal', phone: '9810000018', gender: 'FEMALE', bloodGroup: 'B-', email: 'pooja@example.com' },
];

const doctorData = [
  { firstName: 'Rajesh', lastName: 'Sharma', specialization: 'General Medicine', medicalRegistrationNo: 'MCI-10001', consultationFee: 500, qualification: 'MBBS, MD', yearsOfExperience: 15 },
  { firstName: 'Sunita', lastName: 'Verma', specialization: 'Pediatrics', medicalRegistrationNo: 'MCI-10002', consultationFee: 600, qualification: 'MBBS, DCH', yearsOfExperience: 10 },
  { firstName: 'Vivek', lastName: 'Mehta', specialization: 'Orthopedics', medicalRegistrationNo: 'MCI-10003', consultationFee: 800, qualification: 'MBBS, MS Ortho', yearsOfExperience: 12 },
  { firstName: 'Lakshmi', lastName: 'Iyer', specialization: 'Gynecology', medicalRegistrationNo: 'MCI-10004', consultationFee: 700, qualification: 'MBBS, MS OBG', yearsOfExperience: 8 },
  { firstName: 'Arun', lastName: 'Singh', specialization: 'Cardiology', medicalRegistrationNo: 'MCI-10005', consultationFee: 1000, qualification: 'MBBS, DM Cardiology', yearsOfExperience: 20 },
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
  { // Dr. Lakshmi Iyer — Gynecology: Mon–Fri 09:00–13:00 + 16:00–19:00 (split shift)
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
];

const medicineData = [
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

const allergyData = [
  // Drug allergies
  { name: 'Penicillin', description: 'Allergic reaction to penicillin antibiotics — may cause rash, hives, or anaphylaxis', severity: 'SEVERE' as const, category: 'DRUG' as const },
  { name: 'Sulfa Drugs', description: 'Allergy to sulfonamide antibiotics — skin rash, fever, liver issues', severity: 'MODERATE' as const, category: 'DRUG' as const },
  { name: 'Aspirin', description: 'Aspirin sensitivity — may trigger asthma, hives, or GI bleeding', severity: 'MODERATE' as const, category: 'DRUG' as const },
  { name: 'Iodine Contrast', description: 'Reaction to iodine-based contrast dye used in imaging — hives, swelling, or anaphylaxis', severity: 'SEVERE' as const, category: 'DRUG' as const },
  { name: 'Codeine', description: 'Opioid sensitivity — nausea, vomiting, respiratory depression', severity: 'MODERATE' as const, category: 'DRUG' as const },
  { name: 'NSAIDs', description: 'Non-steroidal anti-inflammatory drug allergy — asthma exacerbation, GI bleeding', severity: 'MODERATE' as const, category: 'DRUG' as const },
  { name: 'Metformin', description: 'Metformin intolerance — lactic acidosis risk, GI distress', severity: 'MILD' as const, category: 'DRUG' as const },
  { name: 'Cephalosporins', description: 'Cross-reactivity with penicillin — rash, anaphylaxis in severe cases', severity: 'SEVERE' as const, category: 'DRUG' as const },
  { name: 'Local Anesthesia', description: 'Allergy to lidocaine or similar local anesthetics — swelling, hives', severity: 'MODERATE' as const, category: 'DRUG' as const },
  { name: 'Insulin', description: 'Allergic reaction to insulin injections — injection site reactions, systemic allergy', severity: 'LIFE_THREATENING' as const, category: 'DRUG' as const },
  // Food allergies
  { name: 'Peanuts', description: 'Peanut allergy — can cause anaphylaxis, hives, throat swelling', severity: 'LIFE_THREATENING' as const, category: 'FOOD' as const },
  { name: 'Shellfish', description: 'Shellfish allergy — hives, vomiting, anaphylaxis', severity: 'SEVERE' as const, category: 'FOOD' as const },
  { name: 'Milk', description: 'Dairy/lactose allergy — bloating, diarrhea, skin rash', severity: 'MODERATE' as const, category: 'FOOD' as const },
  { name: 'Eggs', description: 'Egg allergy — skin rash, digestive issues, respiratory symptoms', severity: 'MODERATE' as const, category: 'FOOD' as const },
  { name: 'Wheat', description: 'Wheat allergy — hives, nasal congestion, digestive distress', severity: 'MILD' as const, category: 'FOOD' as const },
  { name: 'Soy', description: 'Soy allergy — hives, itching, digestive symptoms', severity: 'MILD' as const, category: 'FOOD' as const },
  { name: 'Tree Nuts', description: 'Tree nut allergy — anaphylaxis risk, hives, swelling', severity: 'LIFE_THREATENING' as const, category: 'FOOD' as const },
  { name: 'Fish', description: 'Fish allergy — hives, vomiting, anaphylaxis', severity: 'SEVERE' as const, category: 'FOOD' as const },
  // Environmental allergies
  { name: 'Dust Mites', description: 'Dust mite allergy — sneezing, runny nose, itchy eyes, asthma', severity: 'MILD' as const, category: 'ENVIRONMENTAL' as const },
  { name: 'Pollen', description: 'Hay fever / seasonal allergic rhinitis — sneezing, congestion', severity: 'MILD' as const, category: 'ENVIRONMENTAL' as const },
  { name: 'Mold', description: 'Mold allergy — respiratory issues, skin irritation', severity: 'MODERATE' as const, category: 'ENVIRONMENTAL' as const },
  { name: 'Pet Dander', description: 'Allergy to animal dander — sneezing, itchy eyes, asthma', severity: 'MILD' as const, category: 'ENVIRONMENTAL' as const },
  { name: 'Cockroach', description: 'Cockroach allergen — asthma triggers, nasal symptoms', severity: 'MODERATE' as const, category: 'ENVIRONMENTAL' as const },
  { name: 'Latex', description: 'Latex allergy — contact dermatitis, anaphylaxis in severe cases', severity: 'SEVERE' as const, category: 'ENVIRONMENTAL' as const },
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
  // Order matters: children first
  await prisma.patientAllergy.deleteMany();
  await prisma.allergy.deleteMany();
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

async function seedPatients(): Promise<Patient[]> {
  const rows: Patient[] = [];
  for (const patient of patientData) {
    rows.push(await prisma.patient.upsert({ where: { phone: patient.phone }, update: {}, create: patient }));
  }
  console.log(`Seeded ${patientData.length} patients.`);
  return rows;
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
    const scheduleDef = doctorSchedules.find((d) => d.firstName === (doc as any).firstName || doc.medicalRegistrationNo.includes(String(doctorData.findIndex((dd) => dd.firstName === (doc as any).firstName) + 1)));
    // Find by matching specialization
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

async function seedMedicines(): Promise<Medicine[]> {
  const rows: Medicine[] = [];
  for (const medicine of medicineData) {
    const existing = await prisma.medicine.findFirst({ where: { name: medicine.name } });
    rows.push(existing ?? (await prisma.medicine.create({ data: medicine })));
  }
  console.log(`Seeded ${medicineData.length} medicines.`);
  return rows;
}

async function seedAllergies(): Promise<Allergy[]> {
  const rows: Allergy[] = [];
  for (const allergy of allergyData) {
    const existing = await prisma.allergy.findFirst({ where: { name: allergy.name } });
    rows.push(existing ?? (await prisma.allergy.create({ data: allergy })));
  }
  console.log(`Seeded ${allergyData.length} allergies.`);
  return rows;
}

async function seedPatientAllergies(patientRows: Patient[], allergyRows: Allergy[]) {
  if (!FRESH) {
    const existing = await prisma.patientAllergy.count();
    if (existing > 0) {
      console.log('Patient allergies already seeded, skipping.');
      return;
    }
  }

  // Each patient gets 0-4 random allergies
  let count = 0;
  for (const patient of patientRows) {
    const count_for_patient = randomInt(0, 4);
    const shuffled = [...allergyRows].sort(() => rng() - 0.5);
    const chosen = shuffled.slice(0, count_for_patient);
    for (const allergy of chosen) {
      await prisma.patientAllergy.create({
        data: {
          patientId: patient.id,
          allergyId: allergy.id,
          notes: pick([
            'Patient confirmed allergy',
            'Reported during registration',
            'Noted in previous records',
            'Mild reaction observed',
            'Severe — carry EpiPen',
            'Childhood allergy, still active',
            'Intolerance, not true allergy',
            '',
          ]) || undefined,
          severityOverride: rng() > 0.7 ? pick(['MILD', 'MODERATE', 'SEVERE'] as const) : undefined,
        },
      });
      count++;
    }
  }
  console.log(`Seeded ${count} patient-allergy associations.`);
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

async function seedAddresses(doctorRows: Doctor[]) {
  if (!FRESH) {
    const existing = await prisma.address.count({ where: { addressableType: 'Doctor' } });
    if (existing > 0) {
      console.log('Doctor addresses already seeded, skipping.');
      return;
    }
  }

  const addresses = [
    { firstName: 'Rajesh', addressLine1: '123 Health Avenue', addressLine2: 'Near City Hospital', city: 'Mumbai', state: 'Maharashtra', postalCode: '400001', landmark: 'Opp. Municipal Park' },
    { firstName: 'Sunita', addressLine1: '456 Pediatric Wing, Childrens Care Center', city: 'Mumbai', state: 'Maharashtra', postalCode: '400002', landmark: 'Near Shivaji Park' },
    { firstName: 'Vivek', addressLine1: '789 Ortho Tower, Sports Medicine Complex', addressLine2: '1st Floor', city: 'Pune', state: 'Maharashtra', postalCode: '411001', landmark: 'Opp. Railway Station' },
    { firstName: 'Lakshmi', addressLine1: '321 Women & Child Clinic, Maternity Lane', city: 'Chennai', state: 'Tamil Nadu', postalCode: '600001', landmark: 'Near Kapaleeshwarar Temple' },
    { firstName: 'Arun', addressLine1: '555 Heart Care Center, Cardiac Avenue', addressLine2: 'Suite 200', city: 'Delhi', state: 'Delhi', postalCode: '110001', landmark: 'Near AIIMS Metro Station' },
  ];

  let count = 0;
  for (const doc of doctorRows) {
    const info = addresses.find((a) => {
      const doctorInfo = doctorData.find((dd) => dd.medicalRegistrationNo === doc.medicalRegistrationNo);
      return doctorInfo && a.firstName === doctorInfo.firstName;
    });
    if (!info) continue;
    await prisma.address.create({
      data: {
        addressType: 'CLINIC',
        addressLine1: info.addressLine1,
        addressLine2: info.addressLine2,
        landmark: info.landmark,
        city: info.city,
        state: info.state,
        country: 'India',
        postalCode: info.postalCode,
        isPrimary: true,
        isActive: true,
        addressableType: 'Doctor',
        addressableId: doc.id,
      },
    });
    count++;
  }
  console.log('Seeded ' + count + ' doctor addresses.');
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
    { username: 'frontdesk', firstName: 'Front', lastName: 'Desk', email: 'receptionist@clinic.com', password, roleId: receptionistRoleId },
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

  console.log(`Seeded ${systemUsers.length} system users + ${doctorRows.length} doctor users.`);
  console.log('Login credentials:');
  console.log('  superadmin@clinic.com / Password@123 (Super Admin)');
  console.log('  admin@clinic.com / Password@123 (Super Admin)');
  console.log('  receptionist@clinic.com / Password@123 (Receptionist)');
  console.log('  rajesh.sharma@clinic.com / Doctor@123 (Doctor)');
  console.log('  assistant@clinic.com / Password@123 (Assistant)');
}

// ─── Clinical / transactional demo data ──────────────────────

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
  if (FRESH) {
    // In fresh mode, we already wiped everything — always seed
  } else {
    const existing = await prisma.appointment.count();
    if (existing > 0) {
      console.log('Appointments already seeded, skipping.');
      return [];
    }
  }

  const created: { id: string; patientId: string; doctorId: string; status: string; date: Date; fee: number }[] = [];

  // ── Today's appointments (15 spread across all doctors, various statuses) ──
  const todayStatuses: [string, number][] = [
    ['SCHEDULED', 25],
    ['CONFIRMED', 25],
    ['CHECKED_IN', 15],
    ['IN_PROGRESS', 10],
    ['COMPLETED', 20],
    ['CANCELLED', 5],
  ];
  for (let i = 0; i < 15; i++) {
    const date = daysFromNow(0, randomInt(8, 17), pick([0, 15, 30, 45]));
    const patient = pick(patientRows);
    const doctor = pick(doctorRows);
    const status = pickWeighted(todayStatuses);
    const fee = randomInt(3, 9) * 100;
    const appt = await prisma.appointment.create({
      data: {
        patientId: patient.id,
        doctorId: doctor.id,
        date,
        type: pick(APPOINTMENT_TYPES),
        status,
        tokenNumber: generateTokenNumber(date, patient.name),
        fee,
      },
    });
    created.push({ id: appt.id, patientId: patient.id, doctorId: doctor.id, status, date, fee });
  }

  // ── Tomorrow's appointments (8) ──
  const tomorrowStatuses: [string, number][] = [
    ['SCHEDULED', 60],
    ['CONFIRMED', 30],
    ['CHECKED_IN', 10],
  ];
  for (let i = 0; i < 8; i++) {
    const date = daysFromNow(1, randomInt(9, 16), pick([0, 15, 30, 45]));
    const patient = pick(patientRows);
    const doctor = pick(doctorRows);
    const status = pickWeighted(tomorrowStatuses);
    const fee = randomInt(3, 9) * 100;
    const appt = await prisma.appointment.create({
      data: {
        patientId: patient.id,
        doctorId: doctor.id,
        date,
        type: pick(APPOINTMENT_TYPES),
        status,
        tokenNumber: generateTokenNumber(date, patient.name),
        fee,
      },
    });
    created.push({ id: appt.id, patientId: patient.id, doctorId: doctor.id, status, date, fee });
  }

  // ── Past 30 days (50 appointments, mostly resolved) ──
  for (let i = 0; i < 50; i++) {
    const date = daysFromNow(-randomInt(1, 30), randomInt(9, 16), pick([0, 15, 30, 45]));
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
        tokenNumber: generateTokenNumber(date, patient.name),
        fee,
      },
    });
    created.push({ id: appt.id, patientId: patient.id, doctorId: doctor.id, status, date, fee });
  }

  // ── Next 14 days (25 future appointments) ──
  for (let i = 0; i < 25; i++) {
    const date = daysFromNow(randomInt(2, 14), randomInt(9, 16), pick([0, 15, 30, 45]));
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
        tokenNumber: generateTokenNumber(date, patient.name),
        fee,
      },
    });
    created.push({ id: appt.id, patientId: patient.id, doctorId: doctor.id, status, date, fee });
  }

  console.log(`Seeded ${created.length} appointments (15 today + 8 tomorrow + 50 past + 25 future).`);
  return created;
}

async function seedQueueEntries(patientRows: Patient[], doctorRows: Doctor[], todayAppointments: { id: string; patientId: string; doctorId: string }[]) {
  if (!FRESH) {
    const existing = await prisma.queueEntry.count();
    if (existing > 0) {
      console.log('Queue entries already seeded, skipping.');
      return;
    }
  }

  const statusesToday: [string, number][] = [
    ['WAITING', 35],
    ['IN_PROGRESS', 15],
    ['COMPLETED', 35],
    ['SKIPPED', 5],
    ['NO_SHOW', 10],
  ];

  let count = 0;
  let token = 1;

  // Link some queue entries to today's appointments
  const todayAppts = todayAppointments.slice(0, Math.min(10, todayAppointments.length));
  for (const appt of todayAppts) {
    const checkedInAt = daysFromNow(0, randomInt(8, 16), pick([0, 15, 30, 45]));
    await prisma.queueEntry.create({
      data: {
        tokenNumber: `T${String(token).padStart(3, '0')}`,
        patientId: appt.patientId,
        doctorId: appt.doctorId,
        status: pickWeighted(statusesToday),
        queueDate: daysFromNow(0, 0, 0),
        checkedInAt,
        appointmentId: appt.id,
      },
    });
    token++;
    count++;
  }

  // Additional walk-in queue entries (no linked appointment)
  for (const doctor of doctorRows) {
    const patientsForDoctor = [...patientRows].sort(() => rng() - 0.5).slice(0, randomInt(2, 5));
    for (const patient of patientsForDoctor) {
      const checkedInAt = daysFromNow(0, randomInt(8, 16), pick([0, 15, 30, 45]));
      await prisma.queueEntry.create({
        data: {
          tokenNumber: `T${String(token).padStart(3, '0')}`,
          patientId: patient.id,
          doctorId: doctor.id,
          status: pickWeighted(statusesToday),
          queueDate: daysFromNow(0, 0, 0),
          checkedInAt,
        },
      });
      token++;
      count++;
    }
  }
  console.log(`Seeded ${count} queue entries (${todayAppts.length} linked to appointments + ${count - todayAppts.length} walk-ins).`);
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
  if (!FRESH) {
    const existing = await prisma.prescription.count();
    if (existing > 0) {
      console.log('Prescriptions already seeded, skipping.');
      return;
    }
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
  if (!FRESH) {
    const existing = await prisma.labOrder.count();
    if (existing > 0) { console.log('Lab orders already seeded, skipping.'); return; }
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
  if (!FRESH) {
    const existing = await prisma.radiologyOrder.count();
    if (existing > 0) { console.log('Radiology orders already seeded, skipping.'); return; }
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
  if (!FRESH) {
    const existing = await prisma.procedureOrder.count();
    if (existing > 0) { console.log('Procedure orders already seeded, skipping.'); return; }
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
  if (!FRESH) {
    const existing = await prisma.bill.count();
    if (existing > 0) { console.log('Bills already seeded, skipping.'); return; }
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

// ─── Main ───────────────────────────────────────────────────

async function main() {
  if (FRESH) await wipeAll();

  await seedOrganisation();
  await seedShifts();
  const patientRows = await seedPatients();
  const doctorRows = await seedDoctors();
  await seedEmployeeSchedules(doctorRows);
  await seedAddresses(doctorRows);
  const medicineRows = await seedMedicines();
  const allergyRows = await seedAllergies();

  const permissions = await seedPermissions();
  const { superAdmin, receptionist, doctor, assistant } = await seedRoles(permissions);
  await seedUsers(superAdmin.id, receptionist.id, doctor.id, assistant.id, doctorRows);
  await seedPatientAllergies(patientRows, allergyRows);

  const appointments = await seedAppointments(patientRows, doctorRows);
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(); todayEnd.setDate(todayEnd.getDate() + 1); todayEnd.setHours(0, 0, 0, 0);
  const todayAppts = appointments.filter((a) => a.date >= todayStart && a.date < todayEnd);
  await seedQueueEntries(patientRows, doctorRows, todayAppts);

  const completed = appointments.filter((a) => a.status === 'COMPLETED');
  await seedPrescriptions(completed, medicineRows);
  await seedLabOrders(patientRows, doctorRows);
  await seedRadiologyOrders(patientRows, doctorRows);
  await seedProcedureOrders(patientRows, doctorRows);
  await seedBills(completed);

  console.log('\n✅ Seed complete. All tables populated.');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
