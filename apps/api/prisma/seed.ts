import { PrismaClient, type Permission, type Doctor } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const FRESH = process.argv.includes('--fresh');
const DAY = 24 * 60 * 60 * 1000; // ms in a day

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
  // Core clinical
  'patients', 'appointments', 'doctors', 'prescriptions',
  'medicine-catalog', 'queue', 'billing', 'dispensing',
  // Diagnostics & orders
  'lab-orders', 'radiology-orders', 'procedure-orders', 'diagnoses', 'diagnosis-systems',
  // Patient data
  'allergies', 'patient-allergy-records', 'patient-vitals', 'addresses',
  // Organisation & HR
  'organisation', 'financial-years', 'prescription-templates',
  'users', 'roles', 'permissions', 'shifts', 'employee-schedules',
  // System
  'documents', 'settings', 'dashboard', 'reports', 'developer', 'health',
];
const ACTIONS = ['read', 'create', 'update', 'delete', 'manage'];

function permissionName(action: string, resource: string) {
  const label = resource.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  return `${action.charAt(0).toUpperCase() + action.slice(1)} ${label}`;
}

// ─── Fresh mode: wipe all tables in FK-safe order ──────────

async function wipeAll() {
  console.log('⚠️  --fresh mode: wiping all tables...');
  // Delete in FK-safe order: children before parents, no duplicates.
  // 1. Transactional child records
  await prisma.patientVitals.deleteMany();
  await prisma.patientAllergyRecord.deleteMany();
  await prisma.patientAllergy.deleteMany();
  await prisma.dispensing.deleteMany();
  await prisma.prescriptionItem.deleteMany();
  await prisma.billItem.deleteMany();
  await prisma.queueEntry.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.rolePermission.deleteMany();
  // 2. Transactional parent records
  await prisma.prescription.deleteMany();
  await prisma.bill.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.labOrder.deleteMany();
  await prisma.radiologyOrder.deleteMany();
  await prisma.procedureOrder.deleteMany();
  // 3. Reference / catalogue records
  await prisma.employeeSchedule.deleteMany();
  await prisma.shift.deleteMany();
  await prisma.user.deleteMany();
  await prisma.patient.deleteMany();
  await prisma.doctor.deleteMany();
  await prisma.medicine.deleteMany();
  await prisma.allergy.deleteMany();
  await prisma.diagnosis.deleteMany();
  await prisma.diagnosisSystem.deleteMany();
  await prisma.permission.deleteMany();
  await prisma.role.deleteMany();
  await prisma.address.deleteMany();
  await prisma.prescriptionTemplate.deleteMany();
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

// ─── Diagnosis Catalog ──────────────────────────────────────

const diagnosisData = [
  // ── General Medicine ──
  { name: 'Essential Hypertension', icdCode: 'I10', description: 'Primary (essential) hypertension without a known secondary cause' },
  { name: 'Type 2 Diabetes Mellitus', icdCode: 'E11', description: 'Non-insulin-dependent diabetes mellitus' },
  { name: 'Upper Respiratory Tract Infection', icdCode: 'J06.9', description: 'Acute upper respiratory infection of unspecified site — common cold' },
  { name: 'Acute Bronchitis', icdCode: 'J20.9', description: 'Acute bronchitis of unspecified cause' },
  { name: 'Bronchial Asthma', icdCode: 'J45.9', description: 'Asthma of unspecified type' },
  { name: 'Acute Gastroenteritis', icdCode: 'A09', description: 'Infectious gastroenteritis and colitis of unspecified origin' },
  { name: 'Iron Deficiency Anemia', icdCode: 'D50.9', description: 'Anemia due to insufficient iron stores' },
  { name: 'Vitamin D Deficiency', icdCode: 'E55.9', description: 'Vitamin D deficiency of unspecified severity' },
  { name: 'Hypothyroidism', icdCode: 'E03.9', description: 'Underactive thyroid gland' },
  { name: 'Dengue Fever', icdCode: 'A90', description: 'Dengue virus infection transmitted by mosquitoes' },
  { name: 'Typhoid Fever', icdCode: 'A01.0', description: 'Salmonella typhi infection' },
  { name: 'Urinary Tract Infection', icdCode: 'N39.0', description: 'Bacterial infection of the urinary tract' },
  { name: 'Chronic Obstructive Pulmonary Disease', icdCode: 'J44.9', description: 'Chronic airflow limitation due to emphysema or chronic bronchitis' },
  { name: 'Tuberculosis', icdCode: 'A15.9', description: 'Respiratory tuberculosis — confirmed or unspecified' },
  { name: 'Dyslipidemia', icdCode: 'E78.5', description: 'Abnormal lipid levels in the blood' },
  { name: 'GERD', icdCode: 'K21.9', description: 'Gastro-esophageal reflux disease without esophagitis' },
  { name: 'Peptic Ulcer Disease', icdCode: 'K27.9', description: 'Peptic ulcer of unspecified site' },
  { name: 'Obesity', icdCode: 'E66.9', description: 'Generalized obesity of unspecified cause' },
  { name: 'Headache - Tension Type', icdCode: 'G44.2', description: 'Tension-type headache without specific diagnosis' },
  { name: 'Migraine', icdCode: 'G43.9', description: 'Migraine of unspecified type' },
  { name: 'Acute Pharyngitis', icdCode: 'J02.9', description: 'Acute inflammation of the pharynx — most common cause viral' },
  { name: 'Influenza', icdCode: 'J11.1', description: 'Influenza with other respiratory manifestations, virus not identified' },
  { name: 'Fever of Unknown Origin', icdCode: 'R50.9', description: 'Elevated body temperature with cause not yet determined' },
  { name: 'Dehydration', icdCode: 'E86', description: 'Volume depletion — fluid loss exceeding intake' },
  { name: 'Insomnia', icdCode: 'G47.0', description: 'Difficulty in initiating or maintaining sleep' },
  { name: 'Fatigue Syndrome', icdCode: 'R53.83', description: 'Persistent and unexplained fatigue' },
  { name: 'Scabies', icdCode: 'B86', description: 'Sarcoptes scabiei mite infestation' },

  // ── Cardiology ──
  { name: 'Coronary Artery Disease', icdCode: 'I25.1', description: 'Atherosclerotic heart disease with angina' },
  { name: 'Acute Myocardial Infarction', icdCode: 'I21.9', description: 'Heart attack — acute transmural or subendocardial' },
  { name: 'Congestive Heart Failure', icdCode: 'I50.9', description: 'Heart failure of unspecified type' },
  { name: 'Atrial Fibrillation', icdCode: 'I48', description: 'Irregular, often rapid heart rhythm originating in the atria' },
  { name: 'Stable Angina', icdCode: 'I20.8', description: 'Predictable chest pain on exertion due to myocardial ischemia' },
  { name: 'Deep Vein Thrombosis', icdCode: 'I80.2', description: 'Blood clot in deep veins of the lower extremity' },
  { name: 'Varicose Veins', icdCode: 'I83.9', description: 'Dilated, tortuous superficial veins — lower limb' },

  // ── Pediatrics ──
  { name: 'Childhood Immunization Routine', icdCode: 'Z23', description: 'Routine childhood vaccination encounter' },
  { name: 'Acute Otitis Media', icdCode: 'H66.9', description: 'Middle ear infection of unspecified type' },
  { name: 'Measles', icdCode: 'B05.9', description: 'Measles (rubeola) infection without complication' },
  { name: 'Chickenpox', icdCode: 'B01.9', description: 'Varicella infection — primary infection' },
  { name: 'Mumps', icdCode: 'B26.9', description: 'Paramyxovirus infection typically affecting salivary glands' },
  { name: 'Hand Foot Mouth Disease', icdCode: 'B08.4', description: 'Coxsackie virus infection — vesicular rash on hands, feet, and mouth' },
  { name: 'Pediatric Asthma', icdCode: 'J45.2', description: 'Mild intermittent asthma in children' },
  { name: 'Diarrheal Disease in Children', icdCode: 'K52.9', description: 'Non-infectious/unspecified gastroenteritis in pediatric patient' },
  { name: 'Malnutrition in Children', icdCode: 'E46', description: 'Unspecified protein-calorie malnutrition' },

  // ── Orthopedics ──
  { name: 'Osteoarthritis - Knee', icdCode: 'M17.9', description: 'Degenerative joint disease of the knee' },
  { name: 'Low Back Pain', icdCode: 'M54.5', description: 'Non-specific mechanical low back pain' },
  { name: 'Cervical Spondylosis', icdCode: 'M47.2', description: 'Degenerative changes of the cervical spine' },
  { name: 'Fracture of Forearm', icdCode: 'S52.9', description: 'Fracture of the radius or ulna — unspecified part' },
  { name: 'Rheumatoid Arthritis', icdCode: 'M06.9', description: 'Autoimmune inflammatory arthritis' },
  { name: 'Tennis Elbow', icdCode: 'M77.1', description: 'Lateral epicondylitis due to repetitive motion' },
  { name: 'Plantar Fasciitis', icdCode: 'M72.2', description: 'Inflammation of the plantar fascia at the heel insertion' },
  { name: 'Carpal Tunnel Syndrome', icdCode: 'G56.0', description: 'Median nerve compression at the wrist' },
  { name: 'Rotator Cuff Tear', icdCode: 'S46.0', description: 'Injury to one or more rotator cuff tendons of the shoulder' },
  { name: 'Ankle Sprain', icdCode: 'S93.4', description: 'Ligament injury of the ankle' },

  // ── Gynecology ──
  { name: 'Pregnancy - Routine Antenatal Care', icdCode: 'Z34.9', description: 'Supervision of normal pregnancy, unspecified trimester' },
  { name: 'Menorrhagia', icdCode: 'N92.0', description: 'Excessive or prolonged menstrual bleeding' },
  { name: 'Dysmenorrhea', icdCode: 'N94.6', description: 'Painful menstruation' },
  { name: 'Polycystic Ovarian Syndrome', icdCode: 'E28.2', description: 'Hyperandrogenism, anovulation, and polycystic ovaries' },
  { name: 'Uterine Fibroids', icdCode: 'D25.9', description: 'Benign leiomyomas of the uterus' },
  { name: 'Cervicitis', icdCode: 'N72', description: 'Inflammation of the cervix uteri' },
  { name: 'Vaginitis', icdCode: 'N76.0', description: 'Inflammation of the vagina — infectious or non-infectious' },
  { name: 'Endometriosis', icdCode: 'N80.9', description: 'Presence of endometrial tissue outside the uterine cavity' },
  { name: 'Cervical Dysplasia', icdCode: 'N87.9', description: 'Abnormal cervical epithelial cells on Pap smear' },
  { name: 'Breast Lump - Benign', icdCode: 'N63', description: 'Palpable breast lump of undetermined nature' },

  // ── Dermatology ──
  { name: 'Acne Vulgaris', icdCode: 'L70.0', description: 'Common acne involving face, chest, or back' },
  { name: 'Eczema / Atopic Dermatitis', icdCode: 'L20.9', description: 'Chronic inflammatory skin condition with pruritus' },
  { name: 'Psoriasis', icdCode: 'L40.9', description: 'Chronic autoimmune skin condition with scaly plaques' },
  { name: 'Fungal Skin Infection', icdCode: 'B98.4', description: 'Superficial mycosis of the skin' },
  { name: 'Urticaria', icdCode: 'L50.9', description: 'Hives — allergic wheal-and-flare reaction' },
  { name: 'Alopecia Areata', icdCode: 'L63.9', description: 'Patchy hair loss of autoimmune origin' },
  { name: 'Vitiligo', icdCode: 'L80', description: 'Depigmented macules due to melanocyte destruction' },
  { name: 'Impetigo', icdCode: 'L01.0', description: 'Contagious superficial bacterial skin infection' },
  { name: 'Tinea Corporis (Ringworm)', icdCode: 'B35.4', description: 'Dermatophyte infection of the body' },

  // ── ENT ──
  { name: 'Allergic Rhinitis', icdCode: 'J30.4', description: 'Seasonal or perennial allergic nasal congestion' },
  { name: 'Chronic Sinusitis', icdCode: 'J32.9', description: 'Prolonged inflammation of the paranasal sinuses' },
  { name: 'Tonsillitis', icdCode: 'J03.9', description: 'Acute inflammation of the palatine tonsils' },
  { name: 'Hearing Loss - Sensorineural', icdCode: 'H91.9', description: 'Hearing loss due to inner ear or auditory nerve dysfunction' },
  { name: 'Vertigo / Labyrinthitis', icdCode: 'H81.9', description: 'Disorder of vestibular function with sensation of rotation' },
  { name: 'Nasal Polyp', icdCode: 'J33.9', description: 'Benign mucosal growth in the nasal cavity' },
  { name: 'Deviated Nasal Septum', icdCode: 'J34.2', description: 'Displacement of the nasal septum causing obstruction' },
  { name: 'Otosclerosis', icdCode: 'H80.9', description: 'Abnormal bone growth in the middle ear causing conductive hearing loss' },

  // ── Ophthalmology ──
  { name: 'Cataract', icdCode: 'H26.9', description: 'Lens opacity impairing vision' },
  { name: 'Conjunctivitis', icdCode: 'H10.9', description: 'Inflammation of the conjunctiva — infectious or allergic' },
  { name: 'Glaucoma', icdCode: 'H40.9', description: 'Optic neuropathy with characteristic visual field loss' },
  { name: 'Refractive Error', icdCode: 'H52.7', description: 'Unspecified refractive error — myopia, hyperopia, or astigmatism' },
  { name: 'Dry Eye Syndrome', icdCode: 'H04.12', description: 'Keratoconjunctivitis sicca — deficient tear production or quality' },
  { name: 'Diabetic Retinopathy', icdCode: 'E11.3', description: 'Retinal microvascular complication of diabetes' },
  { name: 'Stye / Hordeolum', icdCode: 'H00.0', description: 'Acute infection of the eyelid gland' },

  // ── Neurology ──
  { name: 'Cerebrovascular Accident (Stroke)', icdCode: 'I64', description: 'Acute neurological deficit due to vascular cause' },
  { name: 'Epilepsy', icdCode: 'G40.9', description: 'Recurrent unprovoked seizures of unspecified type' },
  { name: 'Parkinson Disease', icdCode: 'G20', description: 'Progressive neurodegenerative disorder with tremor, rigidity, bradykinesia' },
  { name: 'Peripheral Neuropathy', icdCode: 'G62.9', description: 'Damage to peripheral nerves of unspecified cause' },
  { name: 'Bell Palsy', icdCode: 'G51.0', description: 'Acute unilateral facial nerve paralysis of unknown cause' },
  { name: 'Sciatica', icdCode: 'M54.3', description: 'Pain radiating along the sciatic nerve from lumbar spine to leg' },
  { name: 'Multiple Sclerosis', icdCode: 'G35', description: 'Chronic demyelinating disease of the central nervous system' },
  { name: 'Trigeminal Neuralgia', icdCode: 'G50.0', description: 'Paroxysmal severe facial pain along trigeminal nerve distribution' },

  // ── Psychiatry ──
  { name: 'Generalized Anxiety Disorder', icdCode: 'F41.1', description: 'Persistent excessive worry and anxiety about multiple domains' },
  { name: 'Major Depressive Disorder', icdCode: 'F32.9', description: 'Single or recurrent major depressive episode of unspecified severity' },
  { name: 'Panic Disorder', icdCode: 'F41.0', description: 'Recurrent unexpected panic attacks with fear of future attacks' },
  { name: 'Bipolar Affective Disorder', icdCode: 'F31.9', description: 'Manic-depressive illness of unspecified polarity or pattern' },
  { name: 'Schizophrenia', icdCode: 'F20.9', description: 'Chronic psychotic disorder with hallucinations, delusions, cognitive impairment' },
  { name: 'Obsessive Compulsive Disorder', icdCode: 'F42', description: 'Recurrent obsessions and/or compulsions causing distress' },
  { name: 'ADHD - Attention Deficit', icdCode: 'F90.0', description: 'Inattentive and/or hyperactive-impulsive behavioral pattern' },
  { name: 'Post Traumatic Stress Disorder', icdCode: 'F43.1', description: 'Prolonged distress after exposure to traumatic event' },
  { name: 'Alcohol Dependence Syndrome', icdCode: 'F10.2', description: 'Alcohol use disorder with dependence (chronic alcoholism)' },
  { name: 'Somatic Symptom Disorder', icdCode: 'F45.0', description: 'Physical symptoms with disproportionate thoughts and distress' },
];

async function seedDiagnosisSystems() {
  const existing = await prisma.diagnosisSystem.count();
  if (existing > 0 && !FRESH) {
    console.log('Diagnosis systems already seeded, skipping.');
    return;
  }
  const systems = [
    { code: 'ICD10', name: 'International Classification of Diseases', version: '10th Revision', status: 'ACTIVE' },
    { code: 'ICD11', name: 'International Classification of Diseases', version: '11th Revision', status: 'ACTIVE' },
    { code: 'SNOMED', name: 'SNOMED CT', version: '2024-09', status: 'ACTIVE' },
    { code: 'ICPC2', name: 'International Classification of Primary Care', version: '2', status: 'ACTIVE' },
  ];
  for (const s of systems) {
    await prisma.diagnosisSystem.upsert({
      where: { code: s.code },
      update: {},
      create: s,
    });
  }
  console.log(`Seeded ${systems.length} diagnosis systems.`);
}

async function seedDiagnoses() {
  const existing = await prisma.diagnosis.count();
  if (existing > 0 && !FRESH) {
    console.log('Diagnoses already seeded, skipping.');
    return;
  }
  for (const d of diagnosisData) {
    const existingDx = await prisma.diagnosis.findFirst({ where: { name: d.name } });
    if (!existingDx) {
      await prisma.diagnosis.create({
        data: {
          name: d.name,
          code: d.icdCode,
          description: d.description,
          status: 'ACTIVE',
        },
      });
    }
  }
  console.log(`Seeded ${diagnosisData.length} diagnoses in the catalog.`);
}

async function seedDoctors(): Promise<Doctor[]> {
  // Doctor seeding disabled — doctors are onboarded manually through the app now.
  // Every doctor-dependent seed function below (appointments, queue, prescriptions,
  // lab/radiology/procedure orders, employee schedules, doctor logins) already
  // guards on an empty doctorRows array, so returning [] here is sufficient.
  console.log('Skipped doctor seeding (disabled).');
  return [];
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
}async function seedRoles(permissions: Permission[]) {
  // ── Developer (was Super Admin + Developer merged): everything ──
  const superAdminPerms = [...permissions];

  // ── Admin: full operational access, minus Organisation profile and Developer tools ──
  // Explicit resource:action list (not a Set-of-resources pattern like the other roles)
  // because this mirrors an exact hand-configured permission grant — some resources are
  // full CRUD+manage, others are read/update-only. Keep this list in sync if the Admin
  // role's permissions are adjusted through the Roles & Permissions UI.
  const adminPermKeys = new Set([
    'addresses:create', 'addresses:delete', 'addresses:manage', 'addresses:read', 'addresses:update',
    'allergies:create', 'allergies:delete', 'allergies:manage', 'allergies:read', 'allergies:update',
    'appointments:create', 'appointments:manage', 'appointments:read', 'appointments:update',
    'billing:create', 'billing:delete', 'billing:manage', 'billing:read', 'billing:update',
    'dashboard:read', 'dashboard:update',
    'diagnoses:read', 'diagnoses:update',
    'diagnosis-systems:read', 'diagnosis-systems:update',
    'dispensing:create', 'dispensing:delete', 'dispensing:manage', 'dispensing:read', 'dispensing:update',
    'doctors:create', 'doctors:delete', 'doctors:manage', 'doctors:read', 'doctors:update',
    'documents:create', 'documents:read', 'documents:update',
    'financial-years:create', 'financial-years:delete', 'financial-years:manage', 'financial-years:read', 'financial-years:update',
    'health:read',
    'lab-orders:read', 'lab-orders:update',
    'medicine-catalog:create', 'medicine-catalog:delete', 'medicine-catalog:manage', 'medicine-catalog:read', 'medicine-catalog:update',
    'patient-allergy-records:create', 'patient-allergy-records:delete', 'patient-allergy-records:manage', 'patient-allergy-records:read', 'patient-allergy-records:update',
    'patient-vitals:create', 'patient-vitals:delete', 'patient-vitals:manage', 'patient-vitals:read', 'patient-vitals:update',
    'patients:create', 'patients:delete', 'patients:manage', 'patients:read', 'patients:update',
    'permissions:create', 'permissions:delete', 'permissions:manage', 'permissions:read', 'permissions:update',
    'prescription-templates:create', 'prescription-templates:delete', 'prescription-templates:manage', 'prescription-templates:read', 'prescription-templates:update',
    'prescriptions:create', 'prescriptions:delete', 'prescriptions:manage', 'prescriptions:read', 'prescriptions:update',
    'procedure-orders:create', 'procedure-orders:delete', 'procedure-orders:manage', 'procedure-orders:read', 'procedure-orders:update',
    'queue:create', 'queue:delete', 'queue:manage', 'queue:read', 'queue:update',
    'radiology-orders:create', 'radiology-orders:delete', 'radiology-orders:manage', 'radiology-orders:read', 'radiology-orders:update',
    'reports:create', 'reports:delete', 'reports:manage', 'reports:read', 'reports:update',
    'roles:create', 'roles:delete', 'roles:manage', 'roles:read', 'roles:update',
    'settings:create', 'settings:delete', 'settings:manage', 'settings:read', 'settings:update',
    'shifts:create', 'shifts:delete', 'shifts:manage', 'shifts:read', 'shifts:update',
    'users:create', 'users:delete', 'users:manage', 'users:read', 'users:update',
  ]);
  const adminPerms = permissions.filter((p) => adminPermKeys.has(`${p.resource}:${p.action}`));

  // ── Receptionist: front-desk operations + inline doctor/patient creation ──
  const receptionistResources = new Set([
    'patients', 'appointments', 'queue', 'billing',
    'prescriptions', 'dispensing', 'documents',
  ]);
  const receptionistReadResources = new Set([
    'medicine-catalog', 'lab-orders', 'radiology-orders', 'procedure-orders',
    // Needed to render available booking slots when scheduling/rescheduling appointments.
    'employee-schedules',
    // Needed to reprint a prescription on its doctor's assigned template.
    'prescription-templates',
  ]);
  const receptionistWriteResources = new Set(['doctors', 'users']);
  const receptionistPerms = permissions.filter(
    (p) =>
      receptionistResources.has(p.resource) ||
      receptionistReadResources.has(p.resource) && p.action === 'read' ||
      (receptionistWriteResources.has(p.resource) && (p.action === 'create' || p.action === 'read')) ||
      (p.resource === 'doctors' && p.action === 'delete'),
  );

  // ── Doctor: clinical operations ──
  const doctorReadResources = new Set([
    'patients', 'appointments', 'queue', 'medicine-catalog',
    'allergies', 'patient-allergy-records', 'patient-vitals',
    'diagnoses', 'diagnosis-systems', 'addresses', 'doctors',
    // Needed to render available slots when rescheduling from the consultation page.
    'employee-schedules',
    // Needed to print a prescription on the doctor's own assigned template.
    'prescription-templates',
  ]);
  const doctorWriteResources = new Set([
    'prescriptions', 'lab-orders', 'radiology-orders', 'procedure-orders',
    'patient-vitals', 'patient-allergy-records',
  ]);
  // Doctor's own consultation workflow (doctor-pos-page.tsx) advances queue
  // status and appointment status/reschedule — needs update on these two,
  // but not create (booking stays a Receptionist action).
  const doctorUpdateOnlyResources = new Set(['queue', 'appointments']);
  const doctorPerms = permissions.filter(
    (p) =>
      (doctorReadResources.has(p.resource) && p.action === 'read') ||
      (doctorWriteResources.has(p.resource) &&
        (p.action === 'create' || p.action === 'update' || p.action === 'read')) ||
      (doctorUpdateOnlyResources.has(p.resource) && p.action === 'update'),
  );

  // ── Nurse: patient vitals, allergies, queue ──
  const nurseReadResources = new Set([
    'patients', 'appointments', 'queue', 'medicine-catalog',
    'allergies', 'patient-allergy-records', 'patient-vitals',
    'diagnoses', 'addresses', 'doctors',
  ]);
  const nurseWriteResources = new Set(['patient-vitals', 'patient-allergy-records', 'queue']);
  const nursePerms = permissions.filter(
    (p) =>
      (nurseReadResources.has(p.resource) && p.action === 'read') ||
      (nurseWriteResources.has(p.resource) &&
        (p.action === 'create' || p.action === 'update' || p.action === 'read')),
  );

  // ── Assistant: basic support ──
  const assistantReadResources = new Set(['patients', 'appointments', 'medicine-catalog', 'doctors']);
  const assistantWriteResources = new Set(['queue']);
  const assistantPerms = permissions.filter(
    (p) =>
      (assistantReadResources.has(p.resource) && p.action === 'read') ||
      (assistantWriteResources.has(p.resource) &&
        (p.action === 'read' || p.action === 'update')),
  );

  // ── Pharmacist: dispensing, prescriptions, medicine catalog ──
  const pharmacistReadResources = new Set([
    'patients', 'prescriptions', 'medicine-catalog', 'dispensing', 'billing', 'doctors',
  ]);
  const pharmacistWriteResources = new Set(['dispensing', 'billing']);
  const pharmacistPerms = permissions.filter(
    (p) =>
      (pharmacistReadResources.has(p.resource) && p.action === 'read') ||
      (pharmacistWriteResources.has(p.resource) &&
        (p.action === 'create' || p.action === 'update' || p.action === 'read')),
  );

  // ── Lab Technician: lab orders, radiology ──
  const labTechReadResources = new Set([
    'patients', 'lab-orders', 'radiology-orders', 'procedure-orders',
    'appointments', 'diagnoses', 'doctors',
  ]);
  const labTechWriteResources = new Set(['lab-orders', 'radiology-orders', 'procedure-orders']);
  const labTechPerms = permissions.filter(
    (p) =>
      (labTechReadResources.has(p.resource) && p.action === 'read') ||
      (labTechWriteResources.has(p.resource) &&
        (p.action === 'create' || p.action === 'update' || p.action === 'read')),
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


  const superAdmin = await upsertRoleWithPermissions('Developer', 'Full access to every module including Developer tools', superAdminPerms);
  const admin = await upsertRoleWithPermissions('Admin', 'Full operational access — clinical, billing, staff, and system config — excluding Organisation profile and Developer tools', adminPerms);
  const receptionist = await upsertRoleWithPermissions('Receptionist', 'Front-desk: patients, appointments, queue, billing, prescriptions, dispensing', receptionistPerms);
  const doctor = await upsertRoleWithPermissions('Doctor', 'Clinical: prescriptions, vitals, allergies, lab/radiology/procedure orders', doctorPerms);
  const nurse = await upsertRoleWithPermissions('Nurse', 'Patient vitals, allergies, queue management', nursePerms);
  const assistant = await upsertRoleWithPermissions('Assistant', 'Support: view patients, manage queue', assistantPerms);
  const pharmacist = await upsertRoleWithPermissions('Pharmacist', 'Dispensing, prescriptions, medicine catalog, billing', pharmacistPerms);
  const labTech = await upsertRoleWithPermissions('Lab Technician', 'Lab orders, radiology orders, procedure orders', labTechPerms);

  console.log(`Seeded roles: Developer (${superAdminPerms.length}), Admin (${adminPerms.length}), Receptionist (${receptionistPerms.length}), Doctor (${doctorPerms.length}), Nurse (${nursePerms.length}), Assistant (${assistantPerms.length}), Pharmacist (${pharmacistPerms.length}), Lab Technician (${labTechPerms.length}).`);
  return { superAdmin, admin, receptionist, doctor, nurse, assistant, pharmacist, labTech };
}

async function seedUsers(
  superAdminRoleId: string,
  receptionistRoleId: string,
  doctorRoleId: string,
  assistantRoleId: string,
  doctorRows: Doctor[],
  nurseRoleId?: string,
  pharmacistRoleId?: string,
  labTechRoleId?: string,
  adminRoleId?: string,
) {
  const password = await bcrypt.hash('Password@123', 10);
  const doctorPassword = await bcrypt.hash('Doctor@123', 10);

  // System users (no doctor link)
  const systemUsers = [
    { username: 'superadmin', firstName: 'Super', lastName: 'Admin', email: 'superadmin@clinic.com', password, roleId: superAdminRoleId },
    { username: 'admin', firstName: 'Admin', lastName: 'User', email: 'admin@clinic.com', password, roleId: adminRoleId ?? superAdminRoleId },
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

    // Check by linked doctor ID OR by email (handles orphaned users from deleted doctors)
    const existing = await prisma.user.findFirst({
      where: { OR: [
        { userableType: 'Doctor', userableId: doc.id },
        { email },
      ]},
    });
    if (existing) {
      // If user exists but linked to a different doctor, re-link it
      if (existing.userableId !== doc.id) {
        await prisma.user.update({ where: { id: existing.id }, data: { userableId: doc.id } });
      }
    } else {
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

  // Nurse users
  if (nurseRoleId) {
    const nurseUsers = [
      { username: 'nursemeera', firstName: 'Meera', lastName: 'Nair', email: 'meera@clinic.com', gender: 'FEMALE' },
      { username: 'nursedeepak', firstName: 'Deepak', lastName: 'Yadav', email: 'deepak@clinic.com', gender: 'MALE' },
    ];
    for (const u of nurseUsers) {
      const existing = await prisma.user.findFirst({ where: { email: u.email } });
      if (!existing) {
        await prisma.user.create({
          data: {
            username: u.username,
            firstName: u.firstName,
            lastName: u.lastName,
            email: u.email,
            password,
            roleId: nurseRoleId,
            userableType: 'Nurse',
            gender: u.gender,
          },
        });
      }
    }
  }

  // Pharmacist users
  if (pharmacistRoleId) {
    const pharmacistUsers = [
      { username: 'pharmrakesh', firstName: 'Rakesh', lastName: 'Joshi', email: 'rakesh@clinic.com', gender: 'MALE' },
      { username: 'pharmneha', firstName: 'Neha', lastName: 'Gupta', email: 'neha@clinic.com', gender: 'FEMALE' },
    ];
    for (const u of pharmacistUsers) {
      const existing = await prisma.user.findFirst({ where: { email: u.email } });
      if (!existing) {
        await prisma.user.create({
          data: {
            username: u.username,
            firstName: u.firstName,
            lastName: u.lastName,
            email: u.email,
            password,
            roleId: pharmacistRoleId,
            userableType: 'Pharmacist',
            gender: u.gender,
          },
        });
      }
    }
  }

  // Lab Technician users
  if (labTechRoleId) {
    const labTechUsers = [
      { username: 'labkiran', firstName: 'Kiran', lastName: 'Patil', email: 'kiran@clinic.com', gender: 'MALE' },
      { username: 'labsunita', firstName: 'Sunita', lastName: 'Rao', email: 'sunita.l@clinic.com', gender: 'FEMALE' },
    ];
    for (const u of labTechUsers) {
      const existing = await prisma.user.findFirst({ where: { email: u.email } });
      if (!existing) {
        await prisma.user.create({
          data: {
            username: u.username,
            firstName: u.firstName,
            lastName: u.lastName,
            email: u.email,
            password,
            roleId: labTechRoleId,
            userableType: 'LabStaff',
            gender: u.gender,
          },
        });
      }
    }
  }

  const extraCount = (nurseRoleId ? 2 : 0) + (pharmacistRoleId ? 2 : 0) + (labTechRoleId ? 2 : 0);
  console.log(`Seeded ${systemUsers.length} system users + ${receptionistUsers.length} receptionists + ${doctorRows.length} doctor users + ${extraCount} staff users.`);
  console.log('Login credentials:');
  console.log('  superadmin@clinic.com / Password@123 (Developer)');
  console.log('  admin@clinic.com / Password@123 (Admin)');
  console.log('  receptionist@clinic.com / Password@123 (Receptionist — Priya Kapoor)');
  console.log('  meenakshi@clinic.com / Password@123 (Receptionist — Meenakshi Reddy)');
  console.log('  raj@clinic.com / Password@123 (Receptionist — Raj Kumar)');
  console.log('  rajesh.sharma@clinic.com / Doctor@123 (Doctor)');
  console.log('  assistant@clinic.com / Password@123 (Assistant)');
  console.log('  meera@clinic.com / Password@123 (Nurse — Meera Nair)');
  console.log('  deepak@clinic.com / Password@123 (Nurse — Deepak Yadav)');
  console.log('  rakesh@clinic.com / Password@123 (Pharmacist — Rakesh Joshi)');
  console.log('  neha@clinic.com / Password@123 (Pharmacist — Neha Gupta)');
  console.log('  kiran@clinic.com / Password@123 (Lab Tech — Kiran Patil)');
  console.log('  sunita.l@clinic.com / Password@123 (Lab Tech — Sunita Rao)');
}

// ─── Medicine Catalog ──────────────────────────────────────

const medicineData = [
  // ── General / Common ──
  { name: 'Paracetamol', genericName: 'Paracetamol', brandName: 'Calpol', category: 'TABLET', strength: '500mg', unit: 'tablet', price: 2 },
  { name: 'Ibuprofen', genericName: 'Ibuprofen', brandName: 'Brufen', category: 'TABLET', strength: '400mg', unit: 'tablet', price: 3 },
  { name: 'Paracetamol Syrup', genericName: 'Paracetamol', brandName: 'Calpol', category: 'SYRUP', strength: '250mg/5ml', unit: 'ml', price: 60 },
  { name: 'Amoxicillin', genericName: 'Amoxicillin', brandName: 'Novamox', category: 'CAPSULE', strength: '500mg', unit: 'capsule', price: 8 },
  { name: 'Azithromycin', genericName: 'Azithromycin', brandName: 'Azithral', category: 'TABLET', strength: '500mg', unit: 'tablet', price: 15 },
  { name: 'Cefixime', genericName: 'Cefixime', brandName: 'Cefaxime', category: 'TABLET', strength: '200mg', unit: 'tablet', price: 12 },
  { name: 'Levofloxacin', genericName: 'Levofloxacin', brandName: 'Levoflox', category: 'TABLET', strength: '500mg', unit: 'tablet', price: 15 },
  { name: 'Metronidazole', genericName: 'Metronidazole', brandName: 'Flagyl', category: 'TABLET', strength: '400mg', unit: 'tablet', price: 4 },
  { name: 'Doxycycline', genericName: 'Doxycycline', brandName: 'Doxylin', category: 'CAPSULE', strength: '100mg', unit: 'capsule', price: 8 },
  { name: 'Metformin', genericName: 'Metformin', brandName: 'Glyciphage', category: 'TABLET', strength: '500mg', unit: 'tablet', price: 3 },
  { name: 'Omeprazole', genericName: 'Omeprazole', brandName: 'Omez', category: 'CAPSULE', strength: '20mg', unit: 'capsule', price: 5 },
  { name: 'Pantoprazole', genericName: 'Pantoprazole', brandName: 'Pantop', category: 'TABLET', strength: '40mg', unit: 'tablet', price: 5 },
  { name: 'Cetirizine', genericName: 'Cetirizine', brandName: 'Alerid', category: 'TABLET', strength: '10mg', unit: 'tablet', price: 2 },
  { name: 'Levocetirizine', genericName: 'Levocetirizine', brandName: 'Levocet', category: 'TABLET', strength: '5mg', unit: 'tablet', price: 5 },
  { name: 'Montelukast', genericName: 'Montelukast', brandName: 'Montair', category: 'TABLET', strength: '10mg', unit: 'tablet', price: 10 },
  { name: 'Vitamin B Complex', genericName: 'Vitamin B Complex', brandName: 'Becosules', category: 'CAPSULE', strength: '', unit: 'capsule', price: 8 },
  { name: 'Multivitamin', genericName: 'Multivitamin', brandName: 'Zincovit', category: 'TABLET', strength: '', unit: 'tablet', price: 6 },
  { name: 'Folic Acid', genericName: 'Folic Acid', brandName: 'Folic Acid', category: 'TABLET', strength: '5mg', unit: 'tablet', price: 2 },
  { name: 'Calcium + Vitamin D3', genericName: 'Calcium + Vitamin D3', brandName: 'Shelcal', category: 'TABLET', strength: '500mg+400IU', unit: 'tablet', price: 6 },
  { name: 'Vitamin B12', genericName: 'Methylcobalamin', brandName: 'Neurobion Forte', category: 'TABLET', strength: '1500mcg', unit: 'tablet', price: 7 },
  { name: 'Vitamin D3', genericName: 'Cholecalciferol', brandName: 'D3-60K', category: 'CAPSULE', strength: '60K IU', unit: 'capsule', price: 15 },
  { name: 'Iron + Folic Acid', genericName: 'Ferrous Sulphate + Folic Acid', brandName: 'Ferium XT', category: 'TABLET', strength: '', unit: 'tablet', price: 4 },

  // ── Cardiology ──
  { name: 'Amlodipine', genericName: 'Amlodipine', brandName: 'Amlodac', category: 'TABLET', strength: '5mg', unit: 'tablet', price: 4 },
  { name: 'Telmisartan', genericName: 'Telmisartan', brandName: 'Telma', category: 'TABLET', strength: '40mg', unit: 'tablet', price: 8 },
  { name: 'Atorvastatin', genericName: 'Atorvastatin', brandName: 'Atorva', category: 'TABLET', strength: '10mg', unit: 'tablet', price: 7 },
  { name: 'Metoprolol', genericName: 'Metoprolol', brandName: 'Metolar', category: 'TABLET', strength: '25mg', unit: 'tablet', price: 5 },
  { name: 'Losartan', genericName: 'Losartan', brandName: 'Losar', category: 'TABLET', strength: '50mg', unit: 'tablet', price: 6 },
  { name: 'Ramipril', genericName: 'Ramipril', brandName: 'Rami ACE', category: 'TABLET', strength: '2.5mg', unit: 'tablet', price: 5 },
  { name: 'Enalapril', genericName: 'Enalapril', brandName: 'Enacard', category: 'TABLET', strength: '5mg', unit: 'tablet', price: 4 },
  { name: 'Aspirin Low Dose', genericName: 'Aspirin', brandName: 'Ecotrin', category: 'TABLET', strength: '75mg', unit: 'tablet', price: 1 },
  { name: 'Clopidogrel', genericName: 'Clopidogrel', brandName: 'Clopivas', category: 'TABLET', strength: '75mg', unit: 'tablet', price: 10 },
  { name: 'Nitroglycerin', genericName: 'Nitroglycerin', brandName: 'Angispan', category: 'TABLET', strength: '0.5mg', unit: 'tablet', price: 3 },
  { name: 'Furosemide', genericName: 'Furosemide', brandName: 'Lasix', category: 'TABLET', strength: '40mg', unit: 'tablet', price: 3 },
  { name: 'Spironolactone', genericName: 'Spironolactone', brandName: 'Spironex', category: 'TABLET', strength: '25mg', unit: 'tablet', price: 6 },
  { name: 'Digoxin', genericName: 'Digoxin', brandName: 'Lanoxin', category: 'TABLET', strength: '0.25mg', unit: 'tablet', price: 4 },

  // ── Respiratory ──
  { name: 'Salbutamol', genericName: 'Salbutamol', brandName: 'Asthalin', category: 'TABLET', strength: '2mg', unit: 'tablet', price: 3 },
  { name: 'Salbutamol Inhaler', genericName: 'Salbutamol', brandName: 'Asthalin HFA', category: 'INHALER', strength: '100mcg', unit: 'puff', price: 200 },
  { name: 'Budesonide Inhaler', genericName: 'Budesonide', brandName: 'Budesonide HFA', category: 'INHALER', strength: '200mcg', unit: 'puff', price: 350 },
  { name: 'Salmeterol + Fluticasone', genericName: 'Salmeterol + Fluticasone', brandName: 'Seretide Accuhaler', category: 'INHALER', strength: '50/250mcg', unit: 'puff', price: 450 },
  { name: 'Montelukast + Levocetirizine', genericName: 'Montelukast + Levocetirizine', brandName: 'Montair LC', category: 'TABLET', strength: '10mg+5mg', unit: 'tablet', price: 12 },
  { name: 'Ipratropium Inhaler', genericName: 'Ipratropium Bromide', brandName: 'Respontin', category: 'INHALER', strength: '20mcg', unit: 'puff', price: 300 },
  { name: 'Theophylline', genericName: 'Theophylline', brandName: 'Theo-Dur', category: 'TABLET', strength: '200mg', unit: 'tablet', price: 5 },

  // ── Dermatology / Topical ──
  { name: 'Clotrimazole 1% Cream', genericName: 'Clotrimazole', brandName: 'Clotrimazole Cream', category: 'CREAM', strength: '1%', unit: 'gm', price: 50 },
  { name: 'Mometasone 0.1% Cream', genericName: 'Mometasone', brandName: 'Momecort', category: 'CREAM', strength: '0.1%', unit: 'gm', price: 80 },
  { name: 'Fusidic Acid 2% Cream', genericName: 'Fusidic Acid', brandName: 'Fucyn', category: 'CREAM', strength: '2%', unit: 'gm', price: 100 },
  { name: 'Mupirocin 2% Ointment', genericName: 'Mupirocin', brandName: 'Mupikem', category: 'CREAM', strength: '2%', unit: 'gm', price: 90 },
  { name: 'Betamethasone Cream', genericName: 'Betamethasone', brandName: 'Betnovate', category: 'CREAM', strength: '0.1%', unit: 'gm', price: 60 },
  { name: 'Calamine Lotion', genericName: 'Calamine', brandName: 'Calamine Lotion', category: 'OTHER', strength: '8%', unit: 'ml', price: 50 },
  { name: 'Isotretinoin', genericName: 'Isotretinoin', brandName: 'Isotroin', category: 'CAPSULE', strength: '10mg', unit: 'capsule', price: 25 },

  // ── Eye / Ear Drops ──
  { name: 'Moxifloxacin Eye Drops', genericName: 'Moxifloxacin', brandName: 'Moxiflox', category: 'DROPS', strength: '0.5%', unit: 'ml', price: 80 },
  { name: 'Timolol Eye Drops', genericName: 'Timolol', brandName: 'Timolet', category: 'DROPS', strength: '0.5%', unit: 'ml', price: 90 },
  { name: 'Ofloxacin Ear Drops', genericName: 'Ofloxacin', brandName: 'Oflox', category: 'DROPS', strength: '0.3%', unit: 'ml', price: 70 },
  { name: 'Artificial Tears', genericName: 'Carboxymethylcellulose', brandName: 'Refresh Tears', category: 'DROPS', strength: '', unit: 'ml', price: 120 },

  // ── Pain Management ──
  { name: 'Diclofenac', genericName: 'Diclofenac Sodium', brandName: 'Voveran', category: 'TABLET', strength: '50mg', unit: 'tablet', price: 3 },
  { name: 'Naproxen', genericName: 'Naproxen', brandName: 'Naprosyn', category: 'TABLET', strength: '250mg', unit: 'tablet', price: 6 },
  { name: 'Tramadol', genericName: 'Tramadol', brandName: 'Ultracet', category: 'CAPSULE', strength: '50mg', unit: 'capsule', price: 10 },
  { name: 'Pregabalin', genericName: 'Pregabalin', brandName: 'Pregalin', category: 'CAPSULE', strength: '75mg', unit: 'capsule', price: 15 },
  { name: 'Gabapentin', genericName: 'Gabapentin', brandName: 'Gabantin', category: 'CAPSULE', strength: '300mg', unit: 'capsule', price: 12 },

  // ── Gastroenterology ──
  { name: 'Domperidone', genericName: 'Domperidone', brandName: 'Domstal', category: 'TABLET', strength: '10mg', unit: 'tablet', price: 5 },
  { name: 'Ondansetron', genericName: 'Ondansetron', brandName: 'Emeset', category: 'TABLET', strength: '4mg', unit: 'tablet', price: 6 },
  { name: 'Ranitidine', genericName: 'Ranitidine', brandName: 'Rantac', category: 'TABLET', strength: '150mg', unit: 'tablet', price: 3 },
  { name: 'Loperamide', genericName: 'Loperamide', brandName: 'Imodium', category: 'CAPSULE', strength: '2mg', unit: 'capsule', price: 5 },
  { name: 'Mesalamine', genericName: 'Mesalamine', brandName: 'Mesacol', category: 'TABLET', strength: '400mg', unit: 'tablet', price: 18 },

  // ── Psychiatry / Neurology ──
  { name: 'Escitalopram', genericName: 'Escitalopram', brandName: 'Nexito', category: 'TABLET', strength: '10mg', unit: 'tablet', price: 10 },
  { name: 'Sertraline', genericName: 'Sertraline', brandName: 'Serlift', category: 'TABLET', strength: '50mg', unit: 'tablet', price: 12 },
  { name: 'Clonazepam', genericName: 'Clonazepam', brandName: 'Clonapax', category: 'TABLET', strength: '0.5mg', unit: 'tablet', price: 6 },
  { name: 'Diazepam', genericName: 'Diazepam', brandName: 'Valium', category: 'TABLET', strength: '5mg', unit: 'tablet', price: 4 },
  { name: 'Levetiracetam', genericName: 'Levetiracetam', brandName: 'Levepsy', category: 'TABLET', strength: '500mg', unit: 'tablet', price: 16 },
  { name: 'Carbamazepine', genericName: 'Carbamazepine', brandName: 'Tegrital', category: 'TABLET', strength: '200mg', unit: 'tablet', price: 8 },

  // ── Endocrinology ──
  { name: 'Levothyroxine', genericName: 'Levothyroxine', brandName: 'Thyronorm', category: 'TABLET', strength: '50mcg', unit: 'tablet', price: 3 },
  { name: 'Glimepiride', genericName: 'Glimepiride', brandName: 'Amaryl', category: 'TABLET', strength: '1mg', unit: 'tablet', price: 5 },
  { name: 'Metformin + Glimepiride', genericName: 'Metformin + Glimepiride', brandName: 'Glyciphage G1', category: 'TABLET', strength: '500mg+1mg', unit: 'tablet', price: 7 },
  { name: 'Insulin Regular', genericName: 'Insulin Regular', brandName: 'Actrapid', category: 'INJECTION', strength: '40IU/ml', unit: 'ml', price: 300 },

  // ── Gynecology ──
  { name: 'Mefenamic Acid', genericName: 'Mefenamic Acid', brandName: 'Meftal', category: 'TABLET', strength: '500mg', unit: 'tablet', price: 5 },
  { name: 'Tranexamic Acid', genericName: 'Tranexamic Acid', brandName: 'Traxanet', category: 'TABLET', strength: '500mg', unit: 'tablet', price: 12 },
  { name: 'Clomiphene', genericName: 'Clomiphene Citrate', brandName: 'Fertomid', category: 'TABLET', strength: '50mg', unit: 'tablet', price: 25 },
  { name: 'Progesterone', genericName: 'Progesterone', brandName: 'Susten', category: 'CAPSULE', strength: '200mg', unit: 'capsule', price: 30 },
  { name: 'Dydrogesterone', genericName: 'Dydrogesterone', brandName: 'Duphaston', category: 'TABLET', strength: '10mg', unit: 'tablet', price: 22 },

  // ── Pediatrics ──
  { name: 'Albendazole', genericName: 'Albendazole', brandName: 'Zentel', category: 'TABLET', strength: '400mg', unit: 'tablet', price: 10 },
  { name: 'ORS Powder', genericName: 'Oral Rehydration Salts', brandName: 'Electral', category: 'OTHER', strength: '', unit: 'packet', price: 15 },
  { name: 'Vitamin D3 Drops', genericName: 'Cholecalciferol', brandName: 'D3 Drops', category: 'DROPS', strength: '400IU/drop', unit: 'ml', price: 80 },
  { name: 'Multivitamin Drops', genericName: 'Multivitamin', brandName: 'Syrup', category: 'SYRUP', strength: '', unit: 'ml', price: 90 },
  { name: 'Zinc Syrup', genericName: 'Zinc Sulphate', brandName: 'Zinc Syrup', category: 'SYRUP', strength: '20mg/5ml', unit: 'ml', price: 70 },

  // ── Infectious Diseases ──
  { name: 'Artesunate Injection', genericName: 'Artesunate', brandName: 'Artesunate', category: 'INJECTION', strength: '60mg', unit: 'vial', price: 60 },
  { name: 'Chloroquine', genericName: 'Chloroquine', brandName: 'Lariago', category: 'TABLET', strength: '250mg', unit: 'tablet', price: 5 },
  { name: 'Oseltamivir', genericName: 'Oseltamivir', brandName: 'Tamiflu', category: 'CAPSULE', strength: '75mg', unit: 'capsule', price: 250 },
  { name: 'Hydroxychloroquine', genericName: 'Hydroxychloroquine', brandName: 'HCQS', category: 'TABLET', strength: '200mg', unit: 'tablet', price: 8 },
  { name: 'Acyclovir', genericName: 'Acyclovir', brandName: 'Acyclovir', category: 'TABLET', strength: '200mg', unit: 'tablet', price: 10 },
];

async function seedMedicines() {
  const existing = await prisma.medicine.count();
  if (existing > 0 && !FRESH) {
    console.log('Medicines already seeded, skipping.');
    return;
  }
  for (const m of medicineData) {
    // Use a composite unique check: find by name since there's no @unique on the Medicine model
    const existingMed = await prisma.medicine.findFirst({ where: { name: m.name } });
    if (!existingMed) {
      await prisma.medicine.create({
        data: {
          name: m.name,
          genericName: m.genericName,
          brandName: m.brandName,
          category: m.category,
          strength: m.strength || undefined,
          unit: m.unit,
          price: m.price,
        },
      });
    }
  }
  console.log(`Seeded ${medicineData.length} medicines in the catalog.`);
}

// ─── Patient with Appointment History ──────────────────────
// Creates demo patients with several completed visits across
// different doctors — useful for testing the "patient history"
// feature shown in the new-appointment flow.

const PATIENT_DEMOS = [
  {
    patient: {
      firstName: 'Ravi', middleName: 'Kumar', lastName: 'Sharma',
      patientCode: 'RAVIKSHARMA-19920615',
      contactNo: '9876543210', email: 'ravi.sharma@example.com',
      dateOfBirth: new Date('1992-06-15'), gender: 'Male', bloodGroup: 'O+',
      address: '42 Lake View Apartments, MG Road, Delhi', emergencyContact: '9876543211',
      allergies: ['Pollen', 'Dust'], isFollowUp: true,
    },
    vitals: {
      heightCm: 172, weightKg: 75, temperatureC: 98.4, pulseBpm: 74,
      systolicBp: 130, diastolicBp: 85, spo2Percent: 97, respiratoryRate: 16,
    },
    vitalsHistory: [
      { heightCm: 172, weightKg: 73, temperatureC: 99.1, pulseBpm: 80, systolicBp: 135, diastolicBp: 88, spo2Percent: 96, respiratoryRate: 17, daysAgo: 30 },
      { heightCm: 172, weightKg: 74, temperatureC: 98.6, pulseBpm: 76, systolicBp: 132, diastolicBp: 86, spo2Percent: 97, respiratoryRate: 16, daysAgo: 14 },
    ],
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
      firstName: 'Sunita', middleName: 'Devi', lastName: 'Sharma',
      patientCode: 'SUNITADEVI-19551120',
      contactNo: '9876543212', email: 'sunita.sharma@example.com',
      dateOfBirth: new Date('1955-11-20'), gender: 'Female', bloodGroup: 'B+',
      address: '12A Sunrise Colony, Sector 7, Noida', emergencyContact: '9876543213',
      allergies: ['Aspirin', 'Penicillin'], isFollowUp: true,
    },
    vitals: {
      heightCm: 155, weightKg: 68, temperatureC: 98.6, pulseBpm: 78,
      systolicBp: 145, diastolicBp: 92, spo2Percent: 96, respiratoryRate: 18,
    },
    vitalsHistory: [
      { heightCm: 155, weightKg: 70, temperatureC: 99.1, pulseBpm: 82, systolicBp: 152, diastolicBp: 96, spo2Percent: 95, respiratoryRate: 19, daysAgo: 45 },
      { heightCm: 155, weightKg: 69, temperatureC: 98.8, pulseBpm: 80, systolicBp: 148, diastolicBp: 94, spo2Percent: 96, respiratoryRate: 18, daysAgo: 18 },
    ],
    appointments: [
      { daysAgo: 30, doctorIndex: 2, type: 'SPECIALIST', fee: 800, time: '09:00', status: 'COMPLETED', notes: 'Orthopedic consult — chronic knee pain' },
      { daysAgo: 18, doctorIndex: 4, type: 'SPECIALIST', fee: 1000, time: '14:00', status: 'COMPLETED', notes: 'Cardiology follow-up — hypertension' },
      { daysAgo: 5, doctorIndex: 4, type: 'FOLLOW_UP', fee: 500, time: '11:30', status: 'COMPLETED', notes: 'BP check — stable' },
    ],
  },
  {
    patient: {
      firstName: 'Aarav', middleName: null, lastName: 'Mehta',
      patientCode: 'AARAVMEHTA-20230802',
      contactNo: '9876543214', email: null,
      dateOfBirth: new Date('2023-08-02'), gender: 'Male', bloodGroup: 'A+',
      address: '7/22 Green Park, East Wing, Mumbai', emergencyContact: '9876543215',
      allergies: ['Milk', 'Eggs'], isFollowUp: false,
    },
    vitals: {
      heightCm: 85, weightKg: 12, temperatureC: 98.8, pulseBpm: 100,
      systolicBp: 85, diastolicBp: 55, spo2Percent: 98, respiratoryRate: 24,
    },
    vitalsHistory: [
      { heightCm: 80, weightKg: 10.5, temperatureC: 99.0, pulseBpm: 105, systolicBp: 82, diastolicBp: 52, spo2Percent: 98, respiratoryRate: 26, daysAgo: 60 },
    ],
    appointments: [
      { daysAgo: 45, doctorIndex: 1, type: 'WALK_IN', fee: 0, time: '10:00', status: 'COMPLETED', notes: 'Newborn check-up — weight & vaccinations' },
      { daysAgo: 28, doctorIndex: 1, type: 'CONSULTATION', fee: 600, time: '10:30', status: 'COMPLETED', notes: 'Routine vaccination visit' },
      { daysAgo: 12, doctorIndex: 1, type: 'FOLLOW_UP', fee: 300, time: '09:00', status: 'COMPLETED', notes: 'Milk allergy assessment — improving' },
    ],
  },
  {
    patient: {
      firstName: 'Priya', middleName: 'Anand', lastName: 'Patel',
      patientCode: 'PRIYAANAND-19880310',
      contactNo: '9876543216', email: 'priya.patel@example.com',
      dateOfBirth: new Date('1988-03-10'), gender: 'Female', bloodGroup: 'AB+',
      address: '55 Lake Gardens, B Block, Bangalore', emergencyContact: '9876543217',
      allergies: ['Sulfa', 'Dust'], isFollowUp: false,
    },
    vitals: {
      heightCm: 163, weightKg: 58, temperatureC: 98.2, pulseBpm: 70,
      systolicBp: 118, diastolicBp: 76, spo2Percent: 99, respiratoryRate: 15,
    },
    vitalsHistory: [
      { heightCm: 163, weightKg: 60, temperatureC: 98.4, pulseBpm: 72, systolicBp: 120, diastolicBp: 78, spo2Percent: 99, respiratoryRate: 16, daysAgo: 35 },
    ],
    appointments: [
      { daysAgo: 35, doctorIndex: 5, type: 'CONSULTATION', fee: 600, time: '11:00', status: 'COMPLETED', notes: 'Skin rash — diagnosed as eczema' },
      { daysAgo: 20, doctorIndex: 5, type: 'FOLLOW_UP', fee: 300, time: '14:30', status: 'COMPLETED', notes: 'Dermatology follow-up — improved' },
      { daysAgo: 8, doctorIndex: 3, type: 'SPECIALIST', fee: 700, time: '10:00', status: 'COMPLETED', notes: 'Gynecology consult — routine check-up' },
    ],
  },
  {
    patient: {
      firstName: 'Abdul', middleName: 'Rahman', lastName: 'Khan',
      patientCode: 'ABDULRAHMAN-19621205',
      contactNo: '9876543218', email: 'abdul.khan@example.com',
      dateOfBirth: new Date('1962-12-05'), gender: 'Male', bloodGroup: 'O-',
      address: '33 Hill Road, Near Mosque, Hyderabad', emergencyContact: '9876543219',
      allergies: ['Codeine'], isFollowUp: true,
    },
    vitals: {
      heightCm: 178, weightKg: 88, temperatureC: 98.6, pulseBpm: 82,
      systolicBp: 150, diastolicBp: 95, spo2Percent: 95, respiratoryRate: 19,
    },
    vitalsHistory: [
      { heightCm: 178, weightKg: 90, temperatureC: 98.8, pulseBpm: 85, systolicBp: 155, diastolicBp: 98, spo2Percent: 94, respiratoryRate: 20, daysAgo: 40 },
      { heightCm: 178, weightKg: 89, temperatureC: 98.4, pulseBpm: 83, systolicBp: 152, diastolicBp: 96, spo2Percent: 95, respiratoryRate: 19, daysAgo: 10 },
    ],
    appointments: [
      { daysAgo: 40, doctorIndex: 8, type: 'SPECIALIST', fee: 1200, time: '09:00', status: 'COMPLETED', notes: 'Neurology consult — chronic headaches' },
      { daysAgo: 25, doctorIndex: 6, type: 'CONSULTATION', fee: 550, time: '15:00', status: 'COMPLETED', notes: 'ENT check — hearing difficulty' },
      { daysAgo: 10, doctorIndex: 8, type: 'FOLLOW_UP', fee: 600, time: '11:00', status: 'COMPLETED', notes: 'Headache follow-up — MRI reports normal' },
      { daysAgo: 2, doctorIndex: 6, type: 'FOLLOW_UP', fee: 300, time: '14:00', status: 'COMPLETED', notes: 'ENT follow-up — hearing aid trial' },
    ],
  },
  {
    patient: {
      firstName: 'Ananya', middleName: 'Lakshmi', lastName: 'Iyer',
      patientCode: 'ANANYALAKSHMI-19950722',
      contactNo: '9876543220', email: 'ananya.iyer@example.com',
      dateOfBirth: new Date('1995-07-22'), gender: 'Female', bloodGroup: 'A-',
      address: '8 Park Street, Adyar, Chennai', emergencyContact: '9876543221',
      allergies: ['Peanuts', 'Shellfish'], isFollowUp: false,
    },
    vitals: {
      heightCm: 160, weightKg: 52, temperatureC: 98.0, pulseBpm: 68,
      systolicBp: 110, diastolicBp: 70, spo2Percent: 99, respiratoryRate: 14,
    },
    vitalsHistory: [
      { heightCm: 160, weightKg: 54, temperatureC: 98.2, pulseBpm: 70, systolicBp: 112, diastolicBp: 72, spo2Percent: 99, respiratoryRate: 15, daysAgo: 15 },
    ],
    appointments: [
      { daysAgo: 15, doctorIndex: 3, type: 'CONSULTATION', fee: 600, time: '10:00', status: 'COMPLETED', notes: 'Regular gynecology check-up' },
      { daysAgo: 5, doctorIndex: 5, type: 'SPECIALIST', fee: 600, time: '14:00', status: 'COMPLETED', notes: 'Acne treatment follow-up' },
    ],
  },
  {
    patient: {
      firstName: 'Vikram', middleName: null, lastName: 'Singh',
      patientCode: 'VIKRAMSINGH-19800315',
      contactNo: '9876543222', email: 'vikram.singh@example.com',
      dateOfBirth: new Date('1980-03-15'), gender: 'Male', bloodGroup: 'B-',
      address: '15 Rajouri Garden, Block C, New Delhi', emergencyContact: '9876543223',
      allergies: ['Bee Sting', 'Latex'], isFollowUp: true,
    },
    vitals: {
      heightCm: 180, weightKg: 82, temperatureC: 98.2, pulseBpm: 72,
      systolicBp: 125, diastolicBp: 80, spo2Percent: 98, respiratoryRate: 15,
    },
    vitalsHistory: [
      { heightCm: 180, weightKg: 84, temperatureC: 98.4, pulseBpm: 74, systolicBp: 128, diastolicBp: 82, spo2Percent: 98, respiratoryRate: 16, daysAgo: 20 },
    ],
    appointments: [
      { daysAgo: 20, doctorIndex: 2, type: 'SPECIALIST', fee: 800, time: '09:00', status: 'COMPLETED', notes: 'Sports injury — ankle sprain' },
      { daysAgo: 8, doctorIndex: 2, type: 'FOLLOW_UP', fee: 400, time: '11:00', status: 'COMPLETED', notes: 'Ankle healing well, physiotherapy advised' },
    ],
  },
  {
    patient: {
      firstName: 'Lakshmi', middleName: 'Priya', lastName: 'Nair',
      patientCode: 'LAKSHMIPRIYA-19750912',
      contactNo: '9876543224', email: 'lakshmi.nair@example.com',
      dateOfBirth: new Date('1975-09-12'), gender: 'Female', bloodGroup: 'O+',
      address: '23 MG Road, Ernakulam, Kochi', emergencyContact: '9876543225',
      allergies: ['Soy', 'Wheat'], isFollowUp: true,
    },
    vitals: {
      heightCm: 158, weightKg: 64, temperatureC: 98.4, pulseBpm: 76,
      systolicBp: 138, diastolicBp: 88, spo2Percent: 97, respiratoryRate: 17,
    },
    vitalsHistory: [
      { heightCm: 158, weightKg: 66, temperatureC: 98.6, pulseBpm: 78, systolicBp: 142, diastolicBp: 90, spo2Percent: 97, respiratoryRate: 18, daysAgo: 60 },
      { heightCm: 158, weightKg: 65, temperatureC: 98.2, pulseBpm: 77, systolicBp: 140, diastolicBp: 89, spo2Percent: 97, respiratoryRate: 17, daysAgo: 30 },
    ],
    appointments: [
      { daysAgo: 60, doctorIndex: 0, type: 'CONSULTATION', fee: 500, time: '09:30', status: 'COMPLETED', notes: 'Diabetes screening — borderline' },
      { daysAgo: 30, doctorIndex: 0, type: 'FOLLOW_UP', fee: 300, time: '10:00', status: 'COMPLETED', notes: 'HbA1c results reviewed — lifestyle changes advised' },
    ],
  },
  {
    patient: {
      firstName: 'Arjun', middleName: 'Reddy', lastName: 'Kapoor',
      patientCode: 'ARJUNREDDY-20010518',
      contactNo: '9876543226', email: 'arjun.kapoor@example.com',
      dateOfBirth: new Date('2001-05-18'), gender: 'Male', bloodGroup: 'AB-',
      address: '9 Jubilee Hills, Hyderabad', emergencyContact: '9876543227',
      allergies: [], isFollowUp: false,
    },
    vitals: {
      heightCm: 175, weightKg: 68, temperatureC: 98.0, pulseBpm: 70,
      systolicBp: 115, diastolicBp: 72, spo2Percent: 99, respiratoryRate: 14,
    },
    vitalsHistory: [],
    appointments: [
      { daysAgo: 10, doctorIndex: 7, type: 'CONSULTATION', fee: 600, time: '11:00', status: 'COMPLETED', notes: 'Vision check — mild myopia detected' },
    ],
  },
  {
    patient: {
      firstName: 'Fatima', middleName: 'Begum', lastName: 'Sheikh',
      patientCode: 'FATIMABEGUM-19680228',
      contactNo: '9876543228', email: 'fatima.sheikh@example.com',
      dateOfBirth: new Date('1968-02-28'), gender: 'Female', bloodGroup: 'B+',
      address: '31 Chowringhee Lane, Kolkata', emergencyContact: '9876543229',
      allergies: ['Iodine'], isFollowUp: true,
    },
    vitals: {
      heightCm: 152, weightKg: 72, temperatureC: 98.8, pulseBpm: 80,
      systolicBp: 155, diastolicBp: 100, spo2Percent: 95, respiratoryRate: 20,
    },
    vitalsHistory: [
      { heightCm: 152, weightKg: 74, temperatureC: 99.0, pulseBpm: 82, systolicBp: 160, diastolicBp: 102, spo2Percent: 94, respiratoryRate: 21, daysAgo: 45 },
      { heightCm: 152, weightKg: 73, temperatureC: 98.6, pulseBpm: 81, systolicBp: 158, diastolicBp: 100, spo2Percent: 95, respiratoryRate: 20, daysAgo: 15 },
    ],
    appointments: [
      { daysAgo: 45, doctorIndex: 4, type: 'SPECIALIST', fee: 1000, time: '09:00', status: 'COMPLETED', notes: 'Cardiology consult — uncontrolled hypertension' },
      { daysAgo: 15, doctorIndex: 4, type: 'FOLLOW_UP', fee: 500, time: '11:00', status: 'COMPLETED', notes: 'BP medication adjusted — monitor weekly' },
    ],
  },
  // ── Additional demo patients (batch 2) ──
  {
    patient: {
      firstName: 'Meena', middleName: 'Kumari', lastName: 'Agarwal',
      patientCode: 'MEENAKUMARI-19780412',
      contactNo: '9876543230', email: 'meena.agarwal@example.com',
      dateOfBirth: new Date('1978-04-12'), gender: 'Female', bloodGroup: 'A+',
      address: '45 Residency Road, Jaipur, Rajasthan', emergencyContact: '9876543231',
      allergies: ['Penicillin', 'Sulfa'], isFollowUp: true,
    },
    vitals: {
      heightCm: 158, weightKg: 72, temperatureC: 98.6, pulseBpm: 82,
      systolicBp: 148, diastolicBp: 92, spo2Percent: 96, respiratoryRate: 18,
    },
    vitalsHistory: [
      { heightCm: 158, weightKg: 75, temperatureC: 99.0, pulseBpm: 86, systolicBp: 155, diastolicBp: 96, spo2Percent: 95, respiratoryRate: 19, daysAgo: 40 },
      { heightCm: 158, weightKg: 73, temperatureC: 98.4, pulseBpm: 84, systolicBp: 150, diastolicBp: 94, spo2Percent: 96, respiratoryRate: 18, daysAgo: 15 },
    ],
    appointments: [
      { daysAgo: 40, doctorIndex: 4, type: 'SPECIALIST', fee: 1000, time: '10:00', status: 'COMPLETED', notes: 'Cardiology consult — chest pain on exertion' },
      { daysAgo: 15, doctorIndex: 4, type: 'FOLLOW_UP', fee: 500, time: '11:30', status: 'COMPLETED', notes: 'ECG normal — stress test recommended' },
      { daysAgo: 3, doctorIndex: 0, type: 'CONSULTATION', fee: 500, time: '09:00', status: 'COMPLETED', notes: 'General check-up — fatigue and dizziness' },
    ],
  },
  {
    patient: {
      firstName: 'Suresh', middleName: null, lastName: 'Babu',
      patientCode: 'SURESHBABU-19650819',
      contactNo: '9876543232', email: 'suresh.babu@example.com',
      dateOfBirth: new Date('1965-08-19'), gender: 'Male', bloodGroup: 'B+',
      address: '78 T Nagar, Chennai, Tamil Nadu', emergencyContact: '9876543233',
      allergies: ['Aspirin'], isFollowUp: true,
    },
    vitals: {
      heightCm: 170, weightKg: 85, temperatureC: 98.4, pulseBpm: 78,
      systolicBp: 142, diastolicBp: 88, spo2Percent: 96, respiratoryRate: 17,
    },
    vitalsHistory: [
      { heightCm: 170, weightKg: 88, temperatureC: 98.8, pulseBpm: 80, systolicBp: 148, diastolicBp: 92, spo2Percent: 95, respiratoryRate: 18, daysAgo: 60 },
      { heightCm: 170, weightKg: 86, temperatureC: 98.6, pulseBpm: 79, systolicBp: 145, diastolicBp: 90, spo2Percent: 96, respiratoryRate: 17, daysAgo: 30 },
    ],
    appointments: [
      { daysAgo: 60, doctorIndex: 2, type: 'SPECIALIST', fee: 800, time: '09:00', status: 'COMPLETED', notes: 'Back pain — lumbar spondylosis' },
      { daysAgo: 30, doctorIndex: 2, type: 'FOLLOW_UP', fee: 400, time: '10:00', status: 'COMPLETED', notes: 'Physiotherapy started — some improvement' },
      { daysAgo: 5, doctorIndex: 0, type: 'CONSULTATION', fee: 500, time: '14:00', status: 'COMPLETED', notes: 'Routine diabetes check' },
    ],
  },
  {
    patient: {
      firstName: 'Kavya', middleName: null, lastName: 'Reddy',
      patientCode: 'KAVYAREDDY-19980305',
      contactNo: '9876543234', email: 'kavya.reddy@example.com',
      dateOfBirth: new Date('1998-03-05'), gender: 'Female', bloodGroup: 'O+',
      address: '22 Banjara Hills, Hyderabad', emergencyContact: '9876543235',
      allergies: ['Ibuprofen'], isFollowUp: false,
    },
    vitals: {
      heightCm: 165, weightKg: 55, temperatureC: 98.2, pulseBpm: 72,
      systolicBp: 112, diastolicBp: 72, spo2Percent: 99, respiratoryRate: 14,
    },
    vitalsHistory: [
      { heightCm: 165, weightKg: 56, temperatureC: 98.4, pulseBpm: 74, systolicBp: 114, diastolicBp: 73, spo2Percent: 99, respiratoryRate: 15, daysAgo: 12 },
    ],
    appointments: [
      { daysAgo: 12, doctorIndex: 5, type: 'CONSULTATION', fee: 600, time: '14:00', status: 'COMPLETED', notes: 'Acne treatment — isotretinoin started' },
      { daysAgo: 3, doctorIndex: 5, type: 'FOLLOW_UP', fee: 300, time: '15:00', status: 'COMPLETED', notes: 'Skin improving — continue treatment' },
    ],
  },
  {
    patient: {
      firstName: 'Rakesh', middleName: null, lastName: 'Tiwari',
      patientCode: 'RAKESHTIWARI-19710630',
      contactNo: '9876543236', email: 'rakesh.tiwari@example.com',
      dateOfBirth: new Date('1971-06-30'), gender: 'Male', bloodGroup: 'AB+',
      address: '112 Civil Lines, Lucknow, UP', emergencyContact: '9876543237',
      allergies: ['Latex'], isFollowUp: true,
    },
    vitals: {
      heightCm: 175, weightKg: 90, temperatureC: 98.6, pulseBpm: 84,
      systolicBp: 152, diastolicBp: 96, spo2Percent: 95, respiratoryRate: 20,
    },
    vitalsHistory: [
      { heightCm: 175, weightKg: 92, temperatureC: 98.8, pulseBpm: 86, systolicBp: 158, diastolicBp: 98, spo2Percent: 94, respiratoryRate: 21, daysAgo: 50 },
    ],
    appointments: [
      { daysAgo: 50, doctorIndex: 4, type: 'SPECIALIST', fee: 1000, time: '09:00', status: 'COMPLETED', notes: 'Cardiology — uncontrolled HTN and diabetes' },
      { daysAgo: 20, doctorIndex: 4, type: 'FOLLOW_UP', fee: 500, time: '10:30', status: 'COMPLETED', notes: 'BP improved with new medication' },
      { daysAgo: 2, doctorIndex: 0, type: 'CONSULTATION', fee: 500, time: '11:00', status: 'COMPLETED', notes: 'Blood sugar review — HbA1c 8.1%' },
    ],
  },
  {
    patient: {
      firstName: 'Pooja', middleName: 'Lata', lastName: 'Singh',
      patientCode: 'POOJALATA-19940918',
      contactNo: '9876543238', email: 'pooja.singh@example.com',
      dateOfBirth: new Date('1994-09-18'), gender: 'Female', bloodGroup: 'O-',
      address: '33 Gomti Nagar, Lucknow, UP', emergencyContact: '9876543239',
      allergies: [], isFollowUp: true,
    },
    vitals: {
      heightCm: 160, weightKg: 62, temperatureC: 98.4, pulseBpm: 76,
      systolicBp: 118, diastolicBp: 74, spo2Percent: 98, respiratoryRate: 16,
    },
    vitalsHistory: [
      { heightCm: 160, weightKg: 58, temperatureC: 98.2, pulseBpm: 74, systolicBp: 115, diastolicBp: 72, spo2Percent: 99, respiratoryRate: 15, daysAgo: 30 },
    ],
    appointments: [
      { daysAgo: 30, doctorIndex: 3, type: 'SPECIALIST', fee: 700, time: '10:00', status: 'COMPLETED', notes: 'Prenatal check-up — 16 weeks' },
      { daysAgo: 7, doctorIndex: 3, type: 'FOLLOW_UP', fee: 500, time: '10:30', status: 'COMPLETED', notes: 'Routine antenatal — growth normal' },
    ],
  },
  {
    patient: {
      firstName: 'Arvind', middleName: null, lastName: 'Patel',
      patientCode: 'ARVINDPATEL-19860214',
      contactNo: '9876543240', email: 'arvind.patel@example.com',
      dateOfBirth: new Date('1986-02-14'), gender: 'Male', bloodGroup: 'A-',
      address: '99 SG Highway, Ahmedabad, Gujarat', emergencyContact: '9876543241',
      allergies: ['Pollen'], isFollowUp: false,
    },
    vitals: {
      heightCm: 176, weightKg: 78, temperatureC: 98.0, pulseBpm: 72,
      systolicBp: 120, diastolicBp: 78, spo2Percent: 98, respiratoryRate: 15,
    },
    vitalsHistory: [],
    appointments: [
      { daysAgo: 8, doctorIndex: 6, type: 'CONSULTATION', fee: 550, time: '11:00', status: 'COMPLETED', notes: 'Chronic sinusitis — CT scan advised' },
      { daysAgo: 1, doctorIndex: 6, type: 'FOLLOW_UP', fee: 300, time: '14:00', status: 'COMPLETED', notes: 'CT results — mild pansinusitis' },
    ],
  },
  {
    patient: {
      firstName: 'Shanti', middleName: null, lastName: 'Devi',
      patientCode: 'SHANTIDEVI-19560325',
      contactNo: '9876543242', email: null,
      dateOfBirth: new Date('1956-03-25'), gender: 'Female', bloodGroup: 'B-',
      address: '8 Lake Market, Kolkata, WB', emergencyContact: '9876543243',
      allergies: ['Iodine'], isFollowUp: true,
    },
    vitals: {
      heightCm: 148, weightKg: 60, temperatureC: 98.4, pulseBpm: 76,
      systolicBp: 135, diastolicBp: 82, spo2Percent: 97, respiratoryRate: 17,
    },
    vitalsHistory: [
      { heightCm: 148, weightKg: 62, temperatureC: 98.6, pulseBpm: 78, systolicBp: 140, diastolicBp: 85, spo2Percent: 96, respiratoryRate: 18, daysAgo: 45 },
    ],
    appointments: [
      { daysAgo: 45, doctorIndex: 7, type: 'SPECIALIST', fee: 650, time: '10:00', status: 'COMPLETED', notes: 'Cataract evaluation — Grade 2 NS OU' },
      { daysAgo: 10, doctorIndex: 7, type: 'FOLLOW_UP', fee: 300, time: '11:00', status: 'COMPLETED', notes: 'Pre-op assessment — surgery scheduled' },
    ],
  },
  {
    patient: {
      firstName: 'Mohammed', middleName: null, lastName: 'Irfan',
      patientCode: 'MOHAMMEDIRFAN-20010711',
      contactNo: '9876543244', email: 'irfan.m@example.com',
      dateOfBirth: new Date('2001-07-11'), gender: 'Male', bloodGroup: 'O+',
      address: '67 Dharavi Main Road, Mumbai', emergencyContact: '9876543245',
      allergies: [], isFollowUp: false,
    },
    vitals: {
      heightCm: 172, weightKg: 65, temperatureC: 98.0, pulseBpm: 74,
      systolicBp: 118, diastolicBp: 74, spo2Percent: 99, respiratoryRate: 14,
    },
    vitalsHistory: [
      { heightCm: 172, weightKg: 64, temperatureC: 98.2, pulseBpm: 76, systolicBp: 120, diastolicBp: 76, spo2Percent: 99, respiratoryRate: 15, daysAgo: 20 },
    ],
    appointments: [
      { daysAgo: 20, doctorIndex: 9, type: 'CONSULTATION', fee: 800, time: '14:00', status: 'COMPLETED', notes: 'Anxiety and insomnia — started on Escitalopram' },
      { daysAgo: 5, doctorIndex: 9, type: 'FOLLOW_UP', fee: 400, time: '15:00', status: 'COMPLETED', notes: 'Mild improvement — dosage adjusted' },
    ],
  },
  {
    patient: {
      firstName: 'Lakshmi', middleName: null, lastName: 'Devi',
      patientCode: 'LAKSHMIDEVI-19720520',
      contactNo: '9876543246', email: 'lakshmi.d@example.com',
      dateOfBirth: new Date('1972-05-20'), gender: 'Female', bloodGroup: 'A+',
      address: '15 Ameerpet, Hyderabad', emergencyContact: '9876543247',
      allergies: ['Shellfish'], isFollowUp: true,
    },
    vitals: {
      heightCm: 155, weightKg: 68, temperatureC: 98.6, pulseBpm: 80,
      systolicBp: 160, diastolicBp: 100, spo2Percent: 95, respiratoryRate: 19,
    },
    vitalsHistory: [
      { heightCm: 155, weightKg: 70, temperatureC: 98.8, pulseBpm: 82, systolicBp: 165, diastolicBp: 102, spo2Percent: 94, respiratoryRate: 20, daysAgo: 35 },
      { heightCm: 155, weightKg: 69, temperatureC: 98.4, pulseBpm: 81, systolicBp: 162, diastolicBp: 100, spo2Percent: 95, respiratoryRate: 19, daysAgo: 10 },
    ],
    appointments: [
      { daysAgo: 35, doctorIndex: 4, type: 'SPECIALIST', fee: 1000, time: '09:00', status: 'COMPLETED', notes: 'Stage 2 hypertension — triple therapy started' },
      { daysAgo: 10, doctorIndex: 4, type: 'FOLLOW_UP', fee: 500, time: '11:00', status: 'COMPLETED', notes: 'BP still elevated — added Spironolactone' },
    ],
  },
  {
    patient: {
      firstName: 'Rajiv', middleName: null, lastName: 'Menon',
      patientCode: 'RAJIVMENON-19910127',
      contactNo: '9876543248', email: 'rajiv.menon@example.com',
      dateOfBirth: new Date('1991-01-27'), gender: 'Male', bloodGroup: 'AB-',
      address: '42 Vyttila, Ernakulam, Kochi', emergencyContact: '9876543249',
      allergies: ['Codeine'], isFollowUp: false,
    },
    vitals: {
      heightCm: 178, weightKg: 80, temperatureC: 98.2, pulseBpm: 70,
      systolicBp: 122, diastolicBp: 78, spo2Percent: 99, respiratoryRate: 14,
    },
    vitalsHistory: [],
    appointments: [
      { daysAgo: 15, doctorIndex: 8, type: 'SPECIALIST', fee: 1200, time: '10:00', status: 'COMPLETED', notes: 'Tension headaches — MRI normal' },
      { daysAgo: 2, doctorIndex: 0, type: 'CONSULTATION', fee: 500, time: '09:30', status: 'COMPLETED', notes: 'Fever and body ache — viral illness' },
    ],
  },
  {
    patient: {
      firstName: 'Anjum', middleName: null, lastName: 'Begum',
      patientCode: 'ANJUMBEGUM-19670903',
      contactNo: '9876543250', email: 'anjum.b@example.com',
      dateOfBirth: new Date('1967-09-03'), gender: 'Female', bloodGroup: 'B+',
      address: '28 Moghbazar, Dhaka (residing in Delhi)', emergencyContact: '9876543251',
      allergies: ['Milk', 'Soy'], isFollowUp: true,
    },
    vitals: {
      heightCm: 150, weightKg: 65, temperatureC: 98.8, pulseBpm: 82,
      systolicBp: 140, diastolicBp: 88, spo2Percent: 96, respiratoryRate: 18,
    },
    vitalsHistory: [
      { heightCm: 150, weightKg: 67, temperatureC: 99.0, pulseBpm: 84, systolicBp: 145, diastolicBp: 90, spo2Percent: 95, respiratoryRate: 19, daysAgo: 30 },
    ],
    appointments: [
      { daysAgo: 30, doctorIndex: 0, type: 'CONSULTATION', fee: 500, time: '10:00', status: 'COMPLETED', notes: 'Diabetes screening — FBS 142' },
      { daysAgo: 7, doctorIndex: 0, type: 'FOLLOW_UP', fee: 300, time: '11:00', status: 'COMPLETED', notes: 'HbA1c 7.8% — Metformin started' },
    ],
  },
  {
    patient: {
      firstName: 'Deepak', middleName: null, lastName: 'Verma',
      patientCode: 'DEEPAKVERMA-19830415',
      contactNo: '9876543252', email: 'deepak.verma@example.com',
      dateOfBirth: new Date('1983-04-15'), gender: 'Male', bloodGroup: 'O-',
      address: '56 Sector 15, Gurgaon, Haryana', emergencyContact: '9876543253',
      allergies: ['Dust', 'Pollen'], isFollowUp: true,
    },
    vitals: {
      heightCm: 174, weightKg: 82, temperatureC: 98.4, pulseBpm: 78,
      systolicBp: 128, diastolicBp: 82, spo2Percent: 97, respiratoryRate: 16,
    },
    vitalsHistory: [
      { heightCm: 174, weightKg: 84, temperatureC: 99.2, pulseBpm: 88, systolicBp: 130, diastolicBp: 84, spo2Percent: 96, respiratoryRate: 20, daysAgo: 20 },
    ],
    appointments: [
      { daysAgo: 20, doctorIndex: 0, type: 'CONSULTATION', fee: 500, time: '09:00', status: 'COMPLETED', notes: 'Acute bronchitis — cough for 5 days' },
      { daysAgo: 5, doctorIndex: 0, type: 'FOLLOW_UP', fee: 300, time: '10:00', status: 'COMPLETED', notes: 'Bronchitis resolving — inhaler continued' },
    ],
  },
  {
    patient: {
      firstName: 'Sunita', middleName: null, lastName: 'Joshi',
      patientCode: 'SUNITAJOSHI-20000612',
      contactNo: '9876543254', email: 'sunita.joshi@example.com',
      dateOfBirth: new Date('2000-06-12'), gender: 'Female', bloodGroup: 'A+',
      address: '18 Dehradun Road, Rishikesh, Uttarakhand', emergencyContact: '9876543255',
      allergies: [], isFollowUp: false,
    },
    vitals: {
      heightCm: 162, weightKg: 54, temperatureC: 98.0, pulseBpm: 72,
      systolicBp: 110, diastolicBp: 68, spo2Percent: 99, respiratoryRate: 14,
    },
    vitalsHistory: [],
    appointments: [
      { daysAgo: 10, doctorIndex: 3, type: 'CONSULTATION', fee: 600, time: '09:00', status: 'COMPLETED', notes: 'PCOD evaluation — USG ordered' },
      { daysAgo: 3, doctorIndex: 3, type: 'FOLLOW_UP', fee: 300, time: '10:00', status: 'COMPLETED', notes: 'USG confirmed PCOD — Metformin + OCP started' },
    ],
  },
  {
    patient: {
      firstName: 'Prakash', middleName: null, lastName: 'Rao',
      patientCode: 'PRAKASHRAO-19690228',
      contactNo: '9876543256', email: 'prakash.rao@example.com',
      dateOfBirth: new Date('1969-02-28'), gender: 'Male', bloodGroup: 'B+',
      address: '88 JP Nagar, Bangalore, Karnataka', emergencyContact: '9876543257',
      allergies: ['Peanuts'], isFollowUp: true,
    },
    vitals: {
      heightCm: 168, weightKg: 78, temperatureC: 98.6, pulseBpm: 80,
      systolicBp: 138, diastolicBp: 86, spo2Percent: 97, respiratoryRate: 17,
    },
    vitalsHistory: [
      { heightCm: 168, weightKg: 80, temperatureC: 98.4, pulseBpm: 82, systolicBp: 142, diastolicBp: 88, spo2Percent: 96, respiratoryRate: 18, daysAgo: 25 },
    ],
    appointments: [
      { daysAgo: 25, doctorIndex: 2, type: 'SPECIALIST', fee: 800, time: '08:00', status: 'COMPLETED', notes: 'Knee osteoarthritis — Grade 3' },
      { daysAgo: 5, doctorIndex: 2, type: 'FOLLOW_UP', fee: 400, time: '09:00', status: 'COMPLETED', notes: 'Viscosupplementation done' },
    ],
  },
  {
    patient: {
      firstName: 'Nisha', middleName: null, lastName: 'Agarwal',
      patientCode: 'NISHAAGARWAL-19960818',
      contactNo: '9876543258', email: 'nisha.agarwal@example.com',
      dateOfBirth: new Date('1996-08-18'), gender: 'Female', bloodGroup: 'O+',
      address: '7 Lajpat Nagar, New Delhi', emergencyContact: '9876543259',
      allergies: ['Eggs', 'Wheat'], isFollowUp: false,
    },
    vitals: {
      heightCm: 164, weightKg: 58, temperatureC: 98.2, pulseBpm: 70,
      systolicBp: 114, diastolicBp: 72, spo2Percent: 99, respiratoryRate: 14,
    },
    vitalsHistory: [],
    appointments: [
      { daysAgo: 14, doctorIndex: 5, type: 'CONSULTATION', fee: 600, time: '12:00', status: 'COMPLETED', notes: 'Eczema flare-up — prescribed topical steroids' },
      { daysAgo: 4, doctorIndex: 5, type: 'FOLLOW_UP', fee: 300, time: '13:00', status: 'COMPLETED', notes: 'Eczema improving — moisturizer emphasized' },
    ],
  },
  {
    patient: {
      firstName: 'Vijay', middleName: 'Kumar', lastName: 'Malhotra',
      patientCode: 'VIJAYKUMAR-19771009',
      contactNo: '9876543260', email: 'vijay.malhotra@example.com',
      dateOfBirth: new Date('1977-10-09'), gender: 'Male', bloodGroup: 'A-',
      address: '102 Model Town, Amritsar, Punjab', emergencyContact: '9876543261',
      allergies: ['Bee Sting'], isFollowUp: true,
    },
    vitals: {
      heightCm: 180, weightKg: 92, temperatureC: 98.4, pulseBpm: 80,
      systolicBp: 145, diastolicBp: 92, spo2Percent: 96, respiratoryRate: 18,
    },
    vitalsHistory: [
      { heightCm: 180, weightKg: 95, temperatureC: 98.6, pulseBpm: 82, systolicBp: 150, diastolicBp: 95, spo2Percent: 95, respiratoryRate: 19, daysAgo: 42 },
      { heightCm: 180, weightKg: 93, temperatureC: 98.4, pulseBpm: 81, systolicBp: 148, diastolicBp: 93, spo2Percent: 96, respiratoryRate: 18, daysAgo: 14 },
    ],
    appointments: [
      { daysAgo: 42, doctorIndex: 0, type: 'CONSULTATION', fee: 500, time: '09:30', status: 'COMPLETED', notes: 'Obesity and metabolic syndrome' },
      { daysAgo: 14, doctorIndex: 0, type: 'FOLLOW_UP', fee: 300, time: '10:00', status: 'COMPLETED', notes: 'Weight loss program — 2kg lost' },
    ],
  },
  // ── Additional demo patients (batch 3) ──
  {
    patient: {
      firstName: 'Chandrika', middleName: null, lastName: 'Menon',
      patientCode: 'CHANDRIKAMENON-19820917',
      contactNo: '9876543262', email: 'chandrika.m@example.com',
      dateOfBirth: new Date('1982-09-17'), gender: 'Female', bloodGroup: 'B+',
      address: '61 Panampilly Nagar, Kochi, Kerala', emergencyContact: '9876543263',
      allergies: ['Codeine', 'Ibuprofen'], isFollowUp: true,
    },
    vitals: {
      heightCm: 162, weightKg: 70, temperatureC: 98.6, pulseBpm: 78,
      systolicBp: 140, diastolicBp: 90, spo2Percent: 97, respiratoryRate: 17,
    },
    vitalsHistory: [
      { heightCm: 162, weightKg: 73, temperatureC: 98.8, pulseBpm: 80, systolicBp: 148, diastolicBp: 94, spo2Percent: 96, respiratoryRate: 18, daysAgo: 50 },
      { heightCm: 162, weightKg: 71, temperatureC: 98.4, pulseBpm: 79, systolicBp: 142, diastolicBp: 92, spo2Percent: 97, respiratoryRate: 17, daysAgo: 20 },
    ],
    appointments: [
      { daysAgo: 50, doctorIndex: 0, type: 'CONSULTATION', fee: 500, time: '10:00', status: 'COMPLETED', notes: 'Migraine + tension headache' },
      { daysAgo: 20, doctorIndex: 0, type: 'FOLLOW_UP', fee: 300, time: '11:00', status: 'COMPLETED', notes: 'Headache frequency reduced' },
      { daysAgo: 3, doctorIndex: 5, type: 'CONSULTATION', fee: 600, time: '14:00', status: 'COMPLETED', notes: 'Psoriasis flare-up on elbows' },
    ],
  },
  {
    patient: {
      firstName: 'Sanjay', middleName: null, lastName: 'Patil',
      patientCode: 'SANJAYPATIL-19740510',
      contactNo: '9876543264', email: 'sanjay.patil@example.com',
      dateOfBirth: new Date('1974-05-10'), gender: 'Male', bloodGroup: 'O+',
      address: '44 FC Road, Pune, Maharashtra', emergencyContact: '9876543265',
      allergies: ['Aspirin', 'Latex'], isFollowUp: true,
    },
    vitals: {
      heightCm: 172, weightKg: 86, temperatureC: 98.4, pulseBpm: 82,
      systolicBp: 148, diastolicBp: 92, spo2Percent: 96, respiratoryRate: 18,
    },
    vitalsHistory: [
      { heightCm: 172, weightKg: 89, temperatureC: 98.6, pulseBpm: 84, systolicBp: 155, diastolicBp: 96, spo2Percent: 95, respiratoryRate: 19, daysAgo: 60 },
      { heightCm: 172, weightKg: 87, temperatureC: 98.4, pulseBpm: 83, systolicBp: 150, diastolicBp: 94, spo2Percent: 96, respiratoryRate: 18, daysAgo: 25 },
    ],
    appointments: [
      { daysAgo: 60, doctorIndex: 4, type: 'SPECIALIST', fee: 1000, time: '09:00', status: 'COMPLETED', notes: 'Cardiology — angina on exertion' },
      { daysAgo: 25, doctorIndex: 4, type: 'FOLLOW_UP', fee: 500, time: '10:00', status: 'COMPLETED', notes: 'TMT positive — cath planned' },
      { daysAgo: 5, doctorIndex: 4, type: 'SPECIALIST', fee: 1000, time: '09:00', status: 'COMPLETED', notes: 'Post-angiography — 60% LAD' },
    ],
  },
  {
    patient: {
      firstName: 'Divya', middleName: 'Prabha', lastName: 'Rao',
      patientCode: 'DIVYAPRABHA-19990228',
      contactNo: '9876543266', email: 'divya.rao@example.com',
      dateOfBirth: new Date('1999-02-28'), gender: 'Female', bloodGroup: 'A-',
      address: '12 Koramangala, Bangalore, Karnataka', emergencyContact: '9876543267',
      allergies: ['Shellfish'], isFollowUp: false,
    },
    vitals: {
      heightCm: 168, weightKg: 60, temperatureC: 98.0, pulseBpm: 70,
      systolicBp: 108, diastolicBp: 68, spo2Percent: 99, respiratoryRate: 14,
    },
    vitalsHistory: [],
    appointments: [
      { daysAgo: 18, doctorIndex: 3, type: 'CONSULTATION', fee: 600, time: '10:00', status: 'COMPLETED', notes: 'Dysmenorrhea — USG normal' },
      { daysAgo: 6, doctorIndex: 3, type: 'FOLLOW_UP', fee: 300, time: '11:00', status: 'COMPLETED', notes: 'Pain improved with NSAIDs' },
    ],
  },
  {
    patient: {
      firstName: 'Rajesh', middleName: null, lastName: 'Yadav',
      patientCode: 'RAJESHYADAV-19690715',
      contactNo: '9876543268', email: 'rajesh.yadav@example.com',
      dateOfBirth: new Date('1969-07-15'), gender: 'Male', bloodGroup: 'B-',
      address: '78 Hazratganj, Lucknow, UP', emergencyContact: '9876543269',
      allergies: ['Peanuts'], isFollowUp: true,
    },
    vitals: {
      heightCm: 166, weightKg: 82, temperatureC: 98.8, pulseBpm: 84,
      systolicBp: 155, diastolicBp: 98, spo2Percent: 95, respiratoryRate: 20,
    },
    vitalsHistory: [
      { heightCm: 166, weightKg: 85, temperatureC: 99.0, pulseBpm: 86, systolicBp: 160, diastolicBp: 100, spo2Percent: 94, respiratoryRate: 21, daysAgo: 45 },
      { heightCm: 166, weightKg: 83, temperatureC: 98.6, pulseBpm: 85, systolicBp: 158, diastolicBp: 99, spo2Percent: 95, respiratoryRate: 20, daysAgo: 12 },
    ],
    appointments: [
      { daysAgo: 45, doctorIndex: 8, type: 'SPECIALIST', fee: 1200, time: '10:00', status: 'COMPLETED', notes: 'Stroke evaluation — TIA history' },
      { daysAgo: 12, doctorIndex: 8, type: 'FOLLOW_UP', fee: 600, time: '11:00', status: 'COMPLETED', notes: 'MRI brain — lacunar infarcts' },
    ],
  },
  {
    patient: {
      firstName: 'Aisha', middleName: null, lastName: 'Khan',
      patientCode: 'AISHAKHAN-20031201',
      contactNo: '9876543270', email: 'aisha.khan@example.com',
      dateOfBirth: new Date('2003-12-01'), gender: 'Female', bloodGroup: 'O-',
      address: '23 MG Road, Indore, MP', emergencyContact: '9876543271',
      allergies: ['Sulfa', 'Pollen'], isFollowUp: false,
    },
    vitals: {
      heightCm: 160, weightKg: 52, temperatureC: 98.2, pulseBpm: 72,
      systolicBp: 108, diastolicBp: 70, spo2Percent: 99, respiratoryRate: 14,
    },
    vitalsHistory: [],
    appointments: [
      { daysAgo: 22, doctorIndex: 9, type: 'CONSULTATION', fee: 800, time: '14:00', status: 'COMPLETED', notes: 'Depression screening — PHQ-9 14' },
      { daysAgo: 8, doctorIndex: 9, type: 'FOLLOW_UP', fee: 400, time: '15:00', status: 'COMPLETED', notes: 'Starting Sertraline 50mg' },
    ],
  },
  {
    patient: {
      firstName: 'Gopal', middleName: 'Krishna', lastName: 'Iyer',
      patientCode: 'GOPALKRISHNA-19620419',
      contactNo: '9876543272', email: 'gopal.iyer@example.com',
      dateOfBirth: new Date('1962-04-19'), gender: 'Male', bloodGroup: 'AB+',
      address: '9 T Nagar, Chennai, Tamil Nadu', emergencyContact: '9876543273',
      allergies: [], isFollowUp: true,
    },
    vitals: {
      heightCm: 165, weightKg: 72, temperatureC: 98.6, pulseBpm: 76,
      systolicBp: 132, diastolicBp: 84, spo2Percent: 97, respiratoryRate: 16,
    },
    vitalsHistory: [
      { heightCm: 165, weightKg: 74, temperatureC: 98.4, pulseBpm: 78, systolicBp: 138, diastolicBp: 86, spo2Percent: 96, respiratoryRate: 17, daysAgo: 40 },
    ],
    appointments: [
      { daysAgo: 40, doctorIndex: 7, type: 'SPECIALIST', fee: 650, time: '10:00', status: 'COMPLETED', notes: 'Glaucoma screening — elevated IOP' },
      { daysAgo: 10, doctorIndex: 7, type: 'FOLLOW_UP', fee: 300, time: '11:00', status: 'COMPLETED', notes: 'Timolol started — IOP 18mmHg' },
    ],
  },
  {
    patient: {
      firstName: 'Harpreet', middleName: null, lastName: 'Singh',
      patientCode: 'HARPREETSINGH-19870830',
      contactNo: '9876543274', email: 'harpreet.s@example.com',
      dateOfBirth: new Date('1987-08-30'), gender: 'Male', bloodGroup: 'A+',
      address: '55 Sector 22, Chandigarh', emergencyContact: '9876543275',
      allergies: ['Dust', 'Milk'], isFollowUp: false,
    },
    vitals: {
      heightCm: 182, weightKg: 88, temperatureC: 98.0, pulseBpm: 68,
      systolicBp: 118, diastolicBp: 76, spo2Percent: 99, respiratoryRate: 14,
    },
    vitalsHistory: [
      { heightCm: 182, weightKg: 89, temperatureC: 100.2, pulseBpm: 88, systolicBp: 120, diastolicBp: 78, spo2Percent: 98, respiratoryRate: 18, daysAgo: 15 },
    ],
    appointments: [
      { daysAgo: 15, doctorIndex: 6, type: 'CONSULTATION', fee: 550, time: '11:00', status: 'COMPLETED', notes: 'Recurrent sore throat — tonsillitis' },
      { daysAgo: 3, doctorIndex: 6, type: 'FOLLOW_UP', fee: 300, time: '14:00', status: 'COMPLETED', notes: 'Improved — ENT review in 1 month' },
    ],
  },
  {
    patient: {
      firstName: 'Shobha', middleName: null, lastName: 'Devi',
      patientCode: 'SHOBHADEVI-19580625',
      contactNo: '9876543276', email: 'shobha.d@example.com',
      dateOfBirth: new Date('1958-06-25'), gender: 'Female', bloodGroup: 'B+',
      address: '33 Vasant Kunj, New Delhi', emergencyContact: '9876543277',
      allergies: ['Penicillin', 'Eggs'], isFollowUp: true,
    },
    vitals: {
      heightCm: 150, weightKg: 62, temperatureC: 98.8, pulseBpm: 80,
      systolicBp: 160, diastolicBp: 100, spo2Percent: 95, respiratoryRate: 20,
    },
    vitalsHistory: [
      { heightCm: 150, weightKg: 64, temperatureC: 99.2, pulseBpm: 84, systolicBp: 168, diastolicBp: 104, spo2Percent: 94, respiratoryRate: 22, daysAgo: 55 },
      { heightCm: 150, weightKg: 63, temperatureC: 98.8, pulseBpm: 82, systolicBp: 162, diastolicBp: 102, spo2Percent: 95, respiratoryRate: 20, daysAgo: 20 },
    ],
    appointments: [
      { daysAgo: 55, doctorIndex: 4, type: 'SPECIALIST', fee: 1000, time: '09:00', status: 'COMPLETED', notes: 'Uncontrolled HTN — ER visit history' },
      { daysAgo: 20, doctorIndex: 4, type: 'FOLLOW_UP', fee: 500, time: '10:30', status: 'COMPLETED', notes: 'BP improving with triple therapy' },
    ],
  },
  {
    patient: {
      firstName: 'Aditya', middleName: null, lastName: 'Sharma',
      patientCode: 'ADITYASHARMA-20000915',
      contactNo: '9876543278', email: 'aditya.s@example.com',
      dateOfBirth: new Date('2000-09-15'), gender: 'Male', bloodGroup: 'O+',
      address: '17 Malviya Nagar, Jaipur, Rajasthan', emergencyContact: '9876543279',
      allergies: ['Latex'], isFollowUp: false,
    },
    vitals: {
      heightCm: 176, weightKg: 70, temperatureC: 98.0, pulseBpm: 72,
      systolicBp: 115, diastolicBp: 74, spo2Percent: 99, respiratoryRate: 14,
    },
    vitalsHistory: [
      { heightCm: 176, weightKg: 71, temperatureC: 98.2, pulseBpm: 74, systolicBp: 116, diastolicBp: 75, spo2Percent: 99, respiratoryRate: 14, daysAgo: 12 },
    ],
    appointments: [
      { daysAgo: 12, doctorIndex: 2, type: 'CONSULTATION', fee: 800, time: '09:00', status: 'COMPLETED', notes: 'ACL tear — sports injury' },
      { daysAgo: 2, doctorIndex: 2, type: 'FOLLOW_UP', fee: 400, time: '10:00', status: 'COMPLETED', notes: 'Brace fitted — physiotherapy advised' },
    ],
  },
  {
    patient: {
      firstName: 'Kamala', middleName: null, lastName: 'Nair',
      patientCode: 'KAMALANAIR-19710308',
      contactNo: '9876543280', email: 'kamala.nair@example.com',
      dateOfBirth: new Date('1971-03-08'), gender: 'Female', bloodGroup: 'AB-',
      address: '48 MG Road, Thiruvananthapuram, Kerala', emergencyContact: '9876543281',
      allergies: ['Soy', 'Wheat'], isFollowUp: true,
    },
    vitals: {
      heightCm: 156, weightKg: 66, temperatureC: 98.4, pulseBpm: 76,
      systolicBp: 135, diastolicBp: 86, spo2Percent: 97, respiratoryRate: 16,
    },
    vitalsHistory: [
      { heightCm: 156, weightKg: 68, temperatureC: 98.6, pulseBpm: 78, systolicBp: 140, diastolicBp: 88, spo2Percent: 96, respiratoryRate: 17, daysAgo: 35 },
    ],
    appointments: [
      { daysAgo: 35, doctorIndex: 3, type: 'SPECIALIST', fee: 700, time: '09:00', status: 'COMPLETED', notes: 'Menorrhagia — USG shows fibroids' },
      { daysAgo: 8, doctorIndex: 3, type: 'FOLLOW_UP', fee: 500, time: '10:00', status: 'COMPLETED', notes: 'Conservative management — iron tabs' },
    ],
  },
  {
    patient: {
      firstName: 'Manoj', middleName: null, lastName: 'Tripathi',
      patientCode: 'MANOJTRIPATHI-19800112',
      contactNo: '9876543282', email: 'manoj.t@example.com',
      dateOfBirth: new Date('1980-01-12'), gender: 'Male', bloodGroup: 'B+',
      address: '89 Mahatma Gandhi Road, Varanasi, UP', emergencyContact: '9876543283',
      allergies: ['Iodine', 'Shellfish'], isFollowUp: true,
    },
    vitals: {
      heightCm: 170, weightKg: 78, temperatureC: 98.6, pulseBpm: 80,
      systolicBp: 142, diastolicBp: 90, spo2Percent: 96, respiratoryRate: 17,
    },
    vitalsHistory: [
      { heightCm: 170, weightKg: 80, temperatureC: 98.8, pulseBpm: 82, systolicBp: 148, diastolicBp: 92, spo2Percent: 95, respiratoryRate: 18, daysAgo: 30 },
    ],
    appointments: [
      { daysAgo: 30, doctorIndex: 0, type: 'CONSULTATION', fee: 500, time: '09:00', status: 'COMPLETED', notes: 'GERD — persistent acid reflux' },
      { daysAgo: 7, doctorIndex: 0, type: 'FOLLOW_UP', fee: 300, time: '10:00', status: 'COMPLETED', notes: 'PPI working — continue 4 weeks' },
    ],
  },
  {
    patient: {
      firstName: 'Rekha', middleName: null, lastName: 'Joshi',
      patientCode: 'REKHAJOSHI-19850704',
      contactNo: '9876543284', email: 'rekha.joshi@example.com',
      dateOfBirth: new Date('1985-07-04'), gender: 'Female', bloodGroup: 'A+',
      address: '26 Somajiguda, Hyderabad, Telangana', emergencyContact: '9876543285',
      allergies: ['Bee Sting'], isFollowUp: false,
    },
    vitals: {
      heightCm: 164, weightKg: 58, temperatureC: 98.2, pulseBpm: 72,
      systolicBp: 112, diastolicBp: 72, spo2Percent: 99, respiratoryRate: 14,
    },
    vitalsHistory: [],
    appointments: [
      { daysAgo: 16, doctorIndex: 1, type: 'CONSULTATION', fee: 600, time: '10:00', status: 'COMPLETED', notes: 'Child fever — viral illness' },
      { daysAgo: 4, doctorIndex: 1, type: 'FOLLOW_UP', fee: 300, time: '11:00', status: 'COMPLETED', notes: 'Child recovered' },
    ],
  },
  {
    patient: {
      firstName: 'Vijay', middleName: null, lastName: 'Patel',
      patientCode: 'VIJAYPATEL-19760322',
      contactNo: '9876543286', email: 'vijay.patel@example.com',
      dateOfBirth: new Date('1976-03-22'), gender: 'Male', bloodGroup: 'O-',
      address: '37 CG Road, Ahmedabad, Gujarat', emergencyContact: '9876543287',
      allergies: ['Penicillin'], isFollowUp: true,
    },
    vitals: {
      heightCm: 174, weightKg: 84, temperatureC: 98.4, pulseBpm: 80,
      systolicBp: 145, diastolicBp: 92, spo2Percent: 96, respiratoryRate: 17,
    },
    vitalsHistory: [
      { heightCm: 174, weightKg: 86, temperatureC: 98.6, pulseBpm: 82, systolicBp: 150, diastolicBp: 94, spo2Percent: 95, respiratoryRate: 18, daysAgo: 35 },
    ],
    appointments: [
      { daysAgo: 35, doctorIndex: 0, type: 'CONSULTATION', fee: 500, time: '09:30', status: 'COMPLETED', notes: 'Hypothyroidism — TSH elevated' },
      { daysAgo: 7, doctorIndex: 0, type: 'FOLLOW_UP', fee: 300, time: '10:00', status: 'COMPLETED', notes: 'Levothyroxine started' },
    ],
  },
  {
    patient: {
      firstName: 'Sunita', middleName: null, lastName: 'Pandey',
      patientCode: 'SUNITAPANDEY-19930518',
      contactNo: '9876543288', email: 'sunita.pandey@example.com',
      dateOfBirth: new Date('1993-05-18'), gender: 'Female', bloodGroup: 'B-',
      address: '19 Civil Lines, Allahabad, UP', emergencyContact: '9876543289',
      allergies: [], isFollowUp: false,
    },
    vitals: {
      heightCm: 158, weightKg: 55, temperatureC: 98.0, pulseBpm: 70,
      systolicBp: 106, diastolicBp: 66, spo2Percent: 99, respiratoryRate: 14,
    },
    vitalsHistory: [
      { heightCm: 158, weightKg: 57, temperatureC: 98.2, pulseBpm: 72, systolicBp: 108, diastolicBp: 68, spo2Percent: 99, respiratoryRate: 15, daysAgo: 20 },
    ],
    appointments: [
      { daysAgo: 20, doctorIndex: 3, type: 'CONSULTATION', fee: 600, time: '10:00', status: 'COMPLETED', notes: 'PCOD — irregular periods' },
      { daysAgo: 5, doctorIndex: 3, type: 'FOLLOW_UP', fee: 300, time: '11:00', status: 'COMPLETED', notes: 'Hormonal panel results reviewed' },
    ],
  },
  {
    patient: {
      firstName: 'Ashok', middleName: null, lastName: 'Gupta',
      patientCode: 'ASHOKGUPTA-19631130',
      contactNo: '9876543290', email: 'ashok.gupta@example.com',
      dateOfBirth: new Date('1963-11-30'), gender: 'Male', bloodGroup: 'A-',
      address: '56 Lajpat Nagar, New Delhi', emergencyContact: '9876543291',
      allergies: ['Aspirin', 'Codeine'], isFollowUp: true,
    },
    vitals: {
      heightCm: 168, weightKg: 76, temperatureC: 98.6, pulseBpm: 78,
      systolicBp: 138, diastolicBp: 88, spo2Percent: 97, respiratoryRate: 16,
    },
    vitalsHistory: [
      { heightCm: 168, weightKg: 78, temperatureC: 98.4, pulseBpm: 80, systolicBp: 142, diastolicBp: 90, spo2Percent: 96, respiratoryRate: 17, daysAgo: 50 },
      { heightCm: 168, weightKg: 77, temperatureC: 98.6, pulseBpm: 79, systolicBp: 140, diastolicBp: 89, spo2Percent: 97, respiratoryRate: 16, daysAgo: 18 },
    ],
    appointments: [
      { daysAgo: 50, doctorIndex: 2, type: 'SPECIALIST', fee: 800, time: '08:00', status: 'COMPLETED', notes: 'Frozen shoulder — right' },
      { daysAgo: 18, doctorIndex: 2, type: 'FOLLOW_UP', fee: 400, time: '09:00', status: 'COMPLETED', notes: 'Physiotherapy + intra-articular injection' },
    ],
  },
];

// Appointment/queue history seeding was removed — it cluttered the live
// Appointments/Queue views with fake data indistinguishable from real
// bookings. Only the demo patients themselves are seeded now, so the
// "patient history" feature can still be tested by booking real
// appointments for them through the app.
const PRESCRIPTION_DEMOS = [
  // Patient: Ravi Kumar Sharma (9876543210)
  { patientPhone: '9876543210', doctorIdx: 0, daysAgo: 0, diagnosis: 'Essential Hypertension', notes: 'Follow up in 2 weeks. Reduce salt intake.', status: 'ACTIVE' as const, items: [{ medicineName: 'Amlodipine', dosage: '1-0-0', duration: '30 days', qty: 2 }, { medicineName: 'Telmisartan', dosage: '0-0-1', duration: '30 days', qty: 1 }] },
  { patientPhone: '9876543210', doctorIdx: 0, daysAgo: 7, diagnosis: 'Upper Respiratory Tract Infection', notes: 'Complete the full course of antibiotics.', status: 'DISPENSED' as const, items: [{ medicineName: 'Amoxicillin', dosage: '1-0-1', duration: '7 days', qty: 1 }, { medicineName: 'Cetirizine', dosage: '0-0-1', duration: '7 days', qty: 1 }] },
  { patientPhone: '9876543210', doctorIdx: 0, daysAgo: 30, diagnosis: 'Vitamin D Deficiency', notes: 'Sun exposure 15 min daily.', status: 'DISPENSED' as const, items: [{ medicineName: 'Vitamin D3', dosage: '1-0-0', duration: '60 days', qty: 1 }] },
  // Patient: Sunita Devi Sharma (9876543212)
  { patientPhone: '9876543212', doctorIdx: 4, daysAgo: 0, diagnosis: 'Essential Hypertension', notes: 'Monitor BP daily. Low-salt diet.', status: 'ACTIVE' as const, items: [{ medicineName: 'Amlodipine', dosage: '1-0-0', duration: '30 days', qty: 2 }, { medicineName: 'Metoprolol', dosage: '0-0-1', duration: '30 days', qty: 1 }] },
  { patientPhone: '9876543212', doctorIdx: 2, daysAgo: 30, diagnosis: 'Osteoarthritis - Knee', notes: 'Weight reduction and physiotherapy.', status: 'DISPENSED' as const, items: [{ medicineName: 'Diclofenac', dosage: '1-0-1', duration: '14 days', qty: 1 }, { medicineName: 'Calcium + Vitamin D3', dosage: '1-0-0', duration: '90 days', qty: 3 }] },
  // Patient: Aarav Mehta (9876543214)
  { patientPhone: '9876543214', doctorIdx: 1, daysAgo: 0, diagnosis: 'Pediatric Asthma', notes: 'Mild intermittent — use only when symptomatic.', status: 'ACTIVE' as const, items: [{ medicineName: 'Salbutamol Inhaler', dosage: '1 puff SOS', duration: '15 days', qty: 1 }] },
  { patientPhone: '9876543214', doctorIdx: 1, daysAgo: 28, diagnosis: 'Chickenpox', notes: 'Keep hydrated. Isolate until all lesions crust over.', status: 'DISPENSED' as const, items: [{ medicineName: 'Paracetamol', dosage: '1-0-1', duration: '5 days', qty: 1 }, { medicineName: 'Calamine Lotion', dosage: 'Apply topically TID', duration: '7 days', qty: 1 }] },
  // Patient: Priya Anand Patel (9876543216)
  { patientPhone: '9876543216', doctorIdx: 3, daysAgo: 0, diagnosis: 'Menorrhagia', notes: 'Monitor Hb levels. Consider iron supplementation.', status: 'ACTIVE' as const, items: [{ medicineName: 'Tranexamic Acid', dosage: '1-0-0', duration: '5 days', qty: 1 }, { medicineName: 'Iron + Folic Acid', dosage: '1-0-0', duration: '30 days', qty: 1 }] },
  { patientPhone: '9876543216', doctorIdx: 5, daysAgo: 5, diagnosis: 'Eczema / Atopic Dermatitis', notes: 'Moisturize regularly. Avoid harsh soaps.', status: 'DISPENSED' as const, items: [{ medicineName: 'Mometasone 0.1% Cream', dosage: 'Apply locally OD', duration: '14 days', qty: 1 }, { medicineName: 'Cetirizine', dosage: '0-0-1', duration: '14 days', qty: 1 }] },
  // Patient: Abdul Rahman Khan (9876543218)
  { patientPhone: '9876543218', doctorIdx: 4, daysAgo: 2, diagnosis: 'Type 2 Diabetes Mellitus', status: 'ACTIVE' as const, items: [{ medicineName: 'Metformin', dosage: '1-0-1', duration: '90 days', qty: 3 }, { medicineName: 'Glimepiride', dosage: '1-0-0', duration: '90 days', qty: 2 }] },
  { patientPhone: '9876543218', doctorIdx: 8, daysAgo: 0, diagnosis: 'Migraine', notes: 'Avoid triggers. Maintain sleep schedule.', status: 'ACTIVE' as const, items: [{ medicineName: 'Naproxen', dosage: '1-0-0', duration: '5 days', qty: 1 }] },
  { patientPhone: '9876543218', doctorIdx: 6, daysAgo: 3, diagnosis: 'Allergic Rhinitis', status: 'ACTIVE' as const, items: [{ medicineName: 'Levocetirizine', dosage: '0-0-1', duration: '14 days', qty: 1 }, { medicineName: 'Montelukast', dosage: '0-0-1', duration: '14 days', qty: 1 }] },
  { patientPhone: '9876543218', doctorIdx: 9, daysAgo: 1, diagnosis: 'Generalized Anxiety Disorder', notes: 'Continue therapy. Follow up in 4 weeks.', status: 'ACTIVE' as const, items: [{ medicineName: 'Escitalopram', dosage: '0-0-1', duration: '30 days', qty: 1 }, { medicineName: 'Clonazepam', dosage: '0-0-1', duration: '7 days', qty: 1 }] },
  // Patient: Ananya Lakshmi Iyer (9876543220)
  { patientPhone: '9876543220', doctorIdx: 3, daysAgo: 0, diagnosis: 'Dysmenorrhea', notes: 'NSAIDs as needed during periods.', status: 'ACTIVE' as const, items: [{ medicineName: 'Mefenamic Acid', dosage: '1-0-1', duration: '3 days', qty: 1 }] },
  { patientPhone: '9876543220', doctorIdx: 5, daysAgo: 5, diagnosis: 'Acne Vulgaris', notes: 'Avoid oily foods. Use sunscreen.', status: 'DISPENSED' as const, items: [{ medicineName: 'Isotretinoin', dosage: '1-0-0', duration: '30 days', qty: 1 }, { medicineName: 'Clotrimazole 1% Cream', dosage: 'Apply locally HS', duration: '30 days', qty: 1 }] },
  // Patient: Vikram Singh (9876543222)
  { patientPhone: '9876543222', doctorIdx: 2, daysAgo: 0, diagnosis: 'Ankle Sprain', notes: 'RICE protocol. Follow up in 1 week.', status: 'ACTIVE' as const, items: [{ medicineName: 'Ibuprofen', dosage: '1-0-1', duration: '7 days', qty: 1 }, { medicineName: 'Betamethasone Cream', dosage: 'Apply locally BD', duration: '10 days', qty: 1 }] },
  { patientPhone: '9876543222', doctorIdx: 8, daysAgo: 10, diagnosis: 'Tension Type Headache', notes: 'Stress management. Regular exercise.', status: 'DISPENSED' as const, items: [{ medicineName: 'Paracetamol', dosage: '1-0-1', duration: '3 days', qty: 1 }, { medicineName: 'Ibuprofen', dosage: '1-0-0', duration: '5 days', qty: 1 }] },
  // Patient: Lakshmi Priya Nair (9876543224)
  { patientPhone: '9876543224', doctorIdx: 0, daysAgo: 0, diagnosis: 'Type 2 Diabetes Mellitus', notes: 'Diet control and regular exercise. Recheck HbA1c in 3 months.', status: 'ACTIVE' as const, items: [{ medicineName: 'Metformin', dosage: '1-0-1', duration: '90 days', qty: 3 }] },
  { patientPhone: '9876543224', doctorIdx: 0, daysAgo: 30, diagnosis: 'Dyslipidemia', notes: 'Low-fat diet. Walk 30 min daily.', status: 'DISPENSED' as const, items: [{ medicineName: 'Atorvastatin', dosage: '0-0-1', duration: '90 days', qty: 3 }] },
  // Patient: Arjun Reddy Kapoor (9876543226)
  { patientPhone: '9876543226', doctorIdx: 7, daysAgo: 10, diagnosis: 'Refractive Error', notes: 'Power -1.25 both eyes. Use glasses.', status: 'DISPENSED' as const, items: [] },
  // Patient: Fatima Begum Sheikh (9876543228)
  { patientPhone: '9876543228', doctorIdx: 4, daysAgo: 0, diagnosis: 'Essential Hypertension', notes: 'Stage 2 hypertension. Increase medication dose. Follow up in 2 weeks.', status: 'ACTIVE' as const, items: [{ medicineName: 'Amlodipine', dosage: '1-0-0', duration: '30 days', qty: 2 }, { medicineName: 'Telmisartan', dosage: '0-0-1', duration: '30 days', qty: 1 }, { medicineName: 'Metoprolol', dosage: '0-0-1', duration: '30 days', qty: 1 }] },
  { patientPhone: '9876543228', doctorIdx: 4, daysAgo: 15, diagnosis: 'Type 2 Diabetes Mellitus', notes: 'Diet + exercise. Monitor fasting glucose.', status: 'ACTIVE' as const, items: [{ medicineName: 'Metformin', dosage: '1-0-1', duration: '30 days', qty: 1 }] },
  { patientPhone: '9876543228', doctorIdx: 6, daysAgo: 45, diagnosis: 'Chronic Sinusitis', notes: 'Nasal saline irrigation. Complete antibiotic course.', status: 'DISPENSED' as const, items: [{ medicineName: 'Amoxicillin', dosage: '1-0-1', duration: '10 days', qty: 1 }, { medicineName: 'Montelukast + Levocetirizine', dosage: '0-0-1', duration: '14 days', qty: 1 }] },
  // Patient: Meena Kumari Agarwal (9876543230)
  { patientPhone: '9876543230', doctorIdx: 4, daysAgo: 0, diagnosis: 'Coronary Artery Disease', notes: 'Start dual antiplatelet. Low-fat diet.', status: 'ACTIVE' as const, items: [{ medicineName: 'Atorvastatin', dosage: '0-0-1', duration: '90 days', qty: 3 }, { medicineName: 'Aspirin Low Dose', dosage: '1-0-0', duration: '90 days', qty: 3 }, { medicineName: 'Clopidogrel', dosage: '1-0-0', duration: '30 days', qty: 1 }] },
  { patientPhone: '9876543230', doctorIdx: 0, daysAgo: 3, diagnosis: 'Iron Deficiency Anemia', notes: 'Take iron on empty stomach.', status: 'DISPENSED' as const, items: [{ medicineName: 'Iron + Folic Acid', dosage: '1-0-0', duration: '60 days', qty: 2 }, { medicineName: 'Vitamin C', dosage: '1-0-0', duration: '60 days', qty: 2 }] },
  // Patient: Suresh Babu (9876543232)
  { patientPhone: '9876543232', doctorIdx: 2, daysAgo: 0, diagnosis: 'Cervical Spondylosis', notes: 'Physiotherapy + ergonomics.', status: 'ACTIVE' as const, items: [{ medicineName: 'Diclofenac', dosage: '1-0-1', duration: '14 days', qty: 1 }, { medicineName: 'Pregabalin', dosage: '0-0-1', duration: '14 days', qty: 1 }] },
  { patientPhone: '9876543232', doctorIdx: 0, daysAgo: 5, diagnosis: 'Dyslipidemia', notes: 'Low-fat diet. Walk 30 min daily.', status: 'ACTIVE' as const, items: [{ medicineName: 'Atorvastatin', dosage: '0-0-1', duration: '90 days', qty: 3 }] },
  // Patient: Kavya Reddy (9876543234)
  { patientPhone: '9876543234', doctorIdx: 5, daysAgo: 0, diagnosis: 'Acne Vulgaris', notes: 'Isotretinoin — avoid sun. Monthly LFT.', status: 'ACTIVE' as const, items: [{ medicineName: 'Isotretinoin', dosage: '1-0-0', duration: '30 days', qty: 1 }, { medicineName: 'Clotrimazole 1% Cream', dosage: 'Apply locally HS', duration: '30 days', qty: 1 }] },
  // Patient: Rakesh Tiwari (9876543236)
  { patientPhone: '9876543236', doctorIdx: 4, daysAgo: 2, diagnosis: 'Congestive Heart Failure', notes: 'Fluid restriction. Daily weight.', status: 'ACTIVE' as const, items: [{ medicineName: 'Furosemide', dosage: '1-0-0', duration: '30 days', qty: 1 }, { medicineName: 'Spironolactone', dosage: '1-0-0', duration: '30 days', qty: 1 }, { medicineName: 'Ramipril', dosage: '0-0-1', duration: '30 days', qty: 1 }] },
  { patientPhone: '9876543236', doctorIdx: 0, daysAgo: 2, diagnosis: 'Type 2 Diabetes Mellitus', notes: 'HbA1c 8.1% — optimize control.', status: 'ACTIVE' as const, items: [{ medicineName: 'Metformin', dosage: '1-0-1', duration: '90 days', qty: 3 }, { medicineName: 'Glimepiride', dosage: '1-0-0', duration: '90 days', qty: 2 }] },
  // Patient: Pooja Lata Singh (9876543238)
  { patientPhone: '9876543238', doctorIdx: 3, daysAgo: 0, diagnosis: 'Pregnancy - Routine Antenatal Care', notes: 'Continue iron and calcium. Next visit 4 weeks.', status: 'ACTIVE' as const, items: [{ medicineName: 'Iron + Folic Acid', dosage: '1-0-0', duration: '30 days', qty: 1 }, { medicineName: 'Calcium + Vitamin D3', dosage: '1-0-1', duration: '30 days', qty: 1 }, { medicineName: 'Folic Acid', dosage: '0-0-1', duration: '30 days', qty: 1 }] },
  // Patient: Arvind Patel (9876543240)
  { patientPhone: '9876543240', doctorIdx: 6, daysAgo: 1, diagnosis: 'Chronic Sinusitis', notes: 'Complete course. Nasal irrigation.', status: 'ACTIVE' as const, items: [{ medicineName: 'Amoxicillin', dosage: '1-0-1', duration: '14 days', qty: 1 }, { medicineName: 'Montelukast + Levocetirizine', dosage: '0-0-1', duration: '14 days', qty: 1 }, { medicineName: 'Levocetirizine', dosage: '0-0-1', duration: '7 days', qty: 1 }] },
  // Patient: Shanti Devi (9876543242)
  { patientPhone: '9876543242', doctorIdx: 7, daysAgo: 0, diagnosis: 'Cataract', notes: 'Pre-op drops. Surgery scheduled next week.', status: 'ACTIVE' as const, items: [{ medicineName: 'Moxifloxacin Eye Drops', dosage: '1 drop TID', duration: '7 days', qty: 1 }, { medicineName: 'Timolol Eye Drops', dosage: '1 drop BD', duration: '7 days', qty: 1 }] },
  // Patient: Mohammed Irfan (9876543244)
  { patientPhone: '9876543244', doctorIdx: 9, daysAgo: 5, diagnosis: 'Generalized Anxiety Disorder', notes: 'Take at bedtime. Review in 4 weeks.', status: 'ACTIVE' as const, items: [{ medicineName: 'Escitalopram', dosage: '0-0-1', duration: '30 days', qty: 1 }, { medicineName: 'Clonazepam', dosage: '0-0-1', duration: '14 days', qty: 1 }] },
  // Patient: Lakshmi Devi (9876543246)
  { patientPhone: '9876543246', doctorIdx: 4, daysAgo: 0, diagnosis: 'Essential Hypertension', notes: 'Resistant HTN. Monitor K+ with Spironolactone.', status: 'ACTIVE' as const, items: [{ medicineName: 'Amlodipine', dosage: '1-0-0', duration: '30 days', qty: 2 }, { medicineName: 'Telmisartan', dosage: '0-0-1', duration: '30 days', qty: 1 }, { medicineName: 'Metoprolol', dosage: '0-0-1', duration: '30 days', qty: 1 }, { medicineName: 'Spironolactone', dosage: '0-0-1', duration: '30 days', qty: 1 }] },
  { patientPhone: '9876543246', doctorIdx: 4, daysAgo: 10, diagnosis: 'Dyslipidemia', notes: 'High-dose statin.', status: 'ACTIVE' as const, items: [{ medicineName: 'Atorvastatin', dosage: '0-0-1', duration: '90 days', qty: 3 }] },
  // Patient: Rajiv Menon (9876543248)
  { patientPhone: '9876543248', doctorIdx: 8, daysAgo: 15, diagnosis: 'Headache - Tension Type', notes: 'Stress management. Paracetamol SOS.', status: 'DISPENSED' as const, items: [{ medicineName: 'Paracetamol', dosage: '1-0-1', duration: '5 days', qty: 1 }, { medicineName: 'Escitalopram', dosage: '0-0-1', duration: '30 days', qty: 1 }] },
  { patientPhone: '9876543248', doctorIdx: 0, daysAgo: 2, diagnosis: 'Influenza', notes: 'Oseltamivir if within 48h. Rest fluids.', status: 'DISPENSED' as const, items: [{ medicineName: 'Oseltamivir', dosage: '1-0-1', duration: '5 days', qty: 1 }, { medicineName: 'Paracetamol', dosage: '1-0-1', duration: '5 days', qty: 1 }] },
  // Patient: Anjum Begum (9876543250)
  { patientPhone: '9876543250', doctorIdx: 0, daysAgo: 0, diagnosis: 'Type 2 Diabetes Mellitus', notes: 'HbA1c 7.8%. Diet + exercise + Metformin.', status: 'ACTIVE' as const, items: [{ medicineName: 'Metformin', dosage: '1-0-1', duration: '90 days', qty: 3 }] },
  // Patient: Deepak Verma (9876543252)
  { patientPhone: '9876543252', doctorIdx: 0, daysAgo: 5, diagnosis: 'Acute Bronchitis', notes: 'Inhaler PRN. Complete course.', status: 'DISPENSED' as const, items: [{ medicineName: 'Salbutamol Inhaler', dosage: '1 puff PRN', duration: '14 days', qty: 1 }, { medicineName: 'Amoxicillin', dosage: '1-0-1', duration: '7 days', qty: 1 }, { medicineName: 'Montelukast + Levocetirizine', dosage: '0-0-1', duration: '10 days', qty: 1 }] },
  // Patient: Sunita Joshi (9876543254)
  { patientPhone: '9876543254', doctorIdx: 3, daysAgo: 0, diagnosis: 'Polycystic Ovarian Syndrome', notes: 'OCP + Metformin. Lifestyle modification.', status: 'ACTIVE' as const, items: [{ medicineName: 'Metformin', dosage: '1-0-1', duration: '90 days', qty: 3 }, { medicineName: 'Dydrogesterone', dosage: '1-0-0', duration: '10 days', qty: 3 }] },
  // Patient: Prakash Rao (9876543256)
  { patientPhone: '9876543256', doctorIdx: 2, daysAgo: 0, diagnosis: 'Osteoarthritis - Knee', notes: 'Post-injection care. Weight management.', status: 'ACTIVE' as const, items: [{ medicineName: 'Diclofenac', dosage: '1-0-1', duration: '14 days', qty: 1 }, { medicineName: 'Calcium + Vitamin D3', dosage: '1-0-0', duration: '90 days', qty: 3 }] },
  // Patient: Nisha Agarwal (9876543258)
  { patientPhone: '9876543258', doctorIdx: 5, daysAgo: 0, diagnosis: 'Eczema / Atopic Dermatitis', notes: 'Emollients. Avoid triggers.', status: 'ACTIVE' as const, items: [{ medicineName: 'Mometasone 0.1% Cream', dosage: 'Apply locally OD', duration: '14 days', qty: 1 }, { medicineName: 'Levocetirizine', dosage: '0-0-1', duration: '14 days', qty: 1 }] },
  // Patient: Vijay Kumar Malhotra (9876543260)
  { patientPhone: '9876543260', doctorIdx: 0, daysAgo: 0, diagnosis: 'Obesity', notes: 'Diet plan + exercise. Follow up monthly.', status: 'ACTIVE' as const, items: [{ medicineName: 'Orlistat', dosage: '1-0-1', duration: '30 days', qty: 1 }] },
  { patientPhone: '9876543260', doctorIdx: 0, daysAgo: 14, diagnosis: 'Essential Hypertension', notes: 'Lifestyle changes + medication.', status: 'ACTIVE' as const, items: [{ medicineName: 'Amlodipine', dosage: '1-0-0', duration: '30 days', qty: 1 }, { medicineName: 'Losartan', dosage: '0-0-1', duration: '30 days', qty: 1 }] },
  // Patient: Chandrika Menon (9876543262)
  { patientPhone: '9876543262', doctorIdx: 0, daysAgo: 0, diagnosis: 'Migraine', notes: 'Prophylaxis with Amitriptyline. Avoid triggers.', status: 'ACTIVE' as const, items: [{ medicineName: 'Paracetamol', dosage: '1-0-1 SOS', duration: '5 days', qty: 1 }, { medicineName: 'Escitalopram', dosage: '0-0-1', duration: '30 days', qty: 1 }] },
  { patientPhone: '9876543262', doctorIdx: 5, daysAgo: 3, diagnosis: 'Psoriasis', notes: 'Topical steroids + moisturizer.', status: 'ACTIVE' as const, items: [{ medicineName: 'Betamethasone Cream', dosage: 'Apply locally OD', duration: '14 days', qty: 1 }, { medicineName: 'Cetirizine', dosage: '0-0-1', duration: '14 days', qty: 1 }] },
  // Patient: Sanjay Patil (9876543264)
  { patientPhone: '9876543264', doctorIdx: 4, daysAgo: 0, diagnosis: 'Coronary Artery Disease', notes: 'Post-angiography. Dual antiplatelet + statin.', status: 'ACTIVE' as const, items: [{ medicineName: 'Aspirin Low Dose', dosage: '1-0-0', duration: '90 days', qty: 3 }, { medicineName: 'Clopidogrel', dosage: '1-0-0', duration: '90 days', qty: 3 }, { medicineName: 'Atorvastatin', dosage: '0-0-1', duration: '90 days', qty: 3 }, { medicineName: 'Metoprolol', dosage: '0-0-1', duration: '30 days', qty: 1 }] },
  { patientPhone: '9876543264', doctorIdx: 4, daysAgo: 5, diagnosis: 'Coronary Artery Disease', notes: 'Pre-PCI medications.', status: 'DISPENSED' as const, items: [{ medicineName: 'Aspirin Low Dose', dosage: '1-0-0', duration: '5 days', qty: 1 }, { medicineName: 'Atorvastatin', dosage: '0-0-1', duration: '5 days', qty: 1 }] },
  // Patient: Divya Prabha Rao (9876543266)
  { patientPhone: '9876543266', doctorIdx: 3, daysAgo: 0, diagnosis: 'Dysmenorrhea', notes: 'NSAIDs during periods. Heat therapy.', status: 'ACTIVE' as const, items: [{ medicineName: 'Mefenamic Acid', dosage: '1-0-1', duration: '3 days', qty: 1 }] },
  // Patient: Rajesh Yadav (9876543268)
  { patientPhone: '9876543268', doctorIdx: 8, daysAgo: 0, diagnosis: 'Cerebrovascular Accident (Stroke)', notes: 'Secondary prevention. Dual antiplatelet + statin.', status: 'ACTIVE' as const, items: [{ medicineName: 'Aspirin Low Dose', dosage: '1-0-0', duration: '90 days', qty: 3 }, { medicineName: 'Clopidogrel', dosage: '1-0-0', duration: '21 days', qty: 1 }, { medicineName: 'Atorvastatin', dosage: '0-0-1', duration: '90 days', qty: 3 }] },
  // Patient: Aisha Khan (9876543270)
  { patientPhone: '9876543270', doctorIdx: 9, daysAgo: 0, diagnosis: 'Major Depressive Disorder', notes: 'SSRI started. Review in 2 weeks.', status: 'ACTIVE' as const, items: [{ medicineName: 'Sertraline', dosage: '0-0-1', duration: '30 days', qty: 1 }] },
  // Patient: Gopal Krishna Iyer (9876543272)
  { patientPhone: '9876543272', doctorIdx: 7, daysAgo: 0, diagnosis: 'Glaucoma', notes: 'Timolol eye drops. Monitor IOP monthly.', status: 'ACTIVE' as const, items: [{ medicineName: 'Timolol Eye Drops', dosage: '1 drop BD', duration: '30 days', qty: 1 }] },
  // Patient: Harpreet Singh (9876543274)
  { patientPhone: '9876543274', doctorIdx: 6, daysAgo: 0, diagnosis: 'Tonsillitis', notes: 'Antibiotics. Tonsillectomy if recurrent.', status: 'ACTIVE' as const, items: [{ medicineName: 'Amoxicillin', dosage: '1-0-1', duration: '10 days', qty: 1 }, { medicineName: 'Paracetamol', dosage: '1-0-1 SOS', duration: '5 days', qty: 1 }] },
  // Patient: Shobha Devi (9876543276)
  { patientPhone: '9876543276', doctorIdx: 4, daysAgo: 0, diagnosis: 'Essential Hypertension', notes: 'Resistant HTN. BP still elevated.', status: 'ACTIVE' as const, items: [{ medicineName: 'Amlodipine', dosage: '1-0-0', duration: '30 days', qty: 2 }, { medicineName: 'Telmisartan', dosage: '0-0-1', duration: '30 days', qty: 1 }, { medicineName: 'Metoprolol', dosage: '0-0-1', duration: '30 days', qty: 1 }, { medicineName: 'Furosemide', dosage: '1-0-0', duration: '30 days', qty: 1 }] },
  // Patient: Aditya Sharma (9876543278)
  { patientPhone: '9876543278', doctorIdx: 2, daysAgo: 0, diagnosis: 'Ankle Sprain', notes: 'RICE + physiotherapy. Follow up 2 weeks.', status: 'ACTIVE' as const, items: [{ medicineName: 'Ibuprofen', dosage: '1-0-1', duration: '7 days', qty: 1 }, { medicineName: 'Diclofenac', dosage: 'Apply locally TID', duration: '10 days', qty: 1 }] },
  // Patient: Kamala Nair (9876543280)
  { patientPhone: '9876543280', doctorIdx: 3, daysAgo: 0, diagnosis: 'Uterine Fibroids', notes: 'Conservative. Iron supplementation.', status: 'ACTIVE' as const, items: [{ medicineName: 'Iron + Folic Acid', dosage: '1-0-0', duration: '60 days', qty: 2 }, { medicineName: 'Tranexamic Acid', dosage: '1-0-1', duration: '5 days', qty: 1 }] },
  // Patient: Manoj Tripathi (9876543282)
  { patientPhone: '9876543282', doctorIdx: 0, daysAgo: 0, diagnosis: 'GERD', notes: 'PPI 4 weeks. Lifestyle modifications.', status: 'ACTIVE' as const, items: [{ medicineName: 'Pantoprazole', dosage: '1-0-0', duration: '30 days', qty: 1 }, { medicineName: 'Domperidone', dosage: '1-0-1', duration: '14 days', qty: 1 }] },
  // Patient: Rekha Joshi (9876543284)
  { patientPhone: '9876543284', doctorIdx: 1, daysAgo: 0, diagnosis: 'Chickenpox', notes: 'Keep hydrated. Calamine for itch.', status: 'ACTIVE' as const, items: [{ medicineName: 'Paracetamol', dosage: '1-0-1', duration: '5 days', qty: 1 }, { medicineName: 'Calamine Lotion', dosage: 'Apply topically TID', duration: '7 days', qty: 1 }] },
  // Patient: Vijay Patel (9876543286)
  { patientPhone: '9876543286', doctorIdx: 0, daysAgo: 0, diagnosis: 'Hypothyroidism', notes: 'Levothyroxine on empty stomach. Recheck TSH in 6 weeks.', status: 'ACTIVE' as const, items: [{ medicineName: 'Levothyroxine', dosage: '1-0-0', duration: '90 days', qty: 3 }] },
  // Patient: Sunita Pandey (9876543288)
  { patientPhone: '9876543288', doctorIdx: 3, daysAgo: 0, diagnosis: 'Polycystic Ovarian Syndrome', notes: 'OCP + lifestyle. Recheck hormones in 3 months.', status: 'ACTIVE' as const, items: [{ medicineName: 'Dydrogesterone', dosage: '1-0-0', duration: '10 days', qty: 3 }, { medicineName: 'Metformin', dosage: '1-0-1', duration: '90 days', qty: 3 }] },
  // Patient: Ashok Gupta (9876543290)
  { patientPhone: '9876543290', doctorIdx: 2, daysAgo: 0, diagnosis: 'Frozen Shoulder', notes: 'Physiotherapy + NSAIDs. Intra-articular injection.', status: 'ACTIVE' as const, items: [{ medicineName: 'Diclofenac', dosage: '1-0-1', duration: '14 days', qty: 1 }, { medicineName: 'Pregabalin', dosage: '0-0-1', duration: '14 days', qty: 1 }] },
];

async function seedPatientsWithHistory(doctorRows: Doctor[]) {
  let totalPatients = 0;
  let totalVitals = 0;
  let totalRx = 0;
  // Look up superadmin user for createdById
  const superadmin = await prisma.user.findFirst({ where: { email: 'superadmin@clinic.com' } });
  const userId = superadmin?.id ?? null;
  for (const demo of PATIENT_DEMOS) {
    const patient = await prisma.patient.upsert({
      where: { patientCode: demo.patient.patientCode },
      update: {},
      create: demo.patient,
    });
    totalPatients++;

    // Seed vitals for this patient
    const existingVitals = await prisma.patientVitals.findFirst({
      where: { patientId: patient.id },
    });
    if (!existingVitals) {
      // Seed historical vitals first (older records)
      if (demo.vitalsHistory && demo.vitalsHistory.length > 0) {
        for (const vh of demo.vitalsHistory) {
          const bmi = vh.heightCm && vh.weightKg
            ? Math.round((vh.weightKg / ((vh.heightCm / 100) ** 2)) * 10) / 10
            : null;
          await prisma.patientVitals.create({
            data: {
              patientId: patient.id,
              heightCm: vh.heightCm,
              weightKg: vh.weightKg,
              bmi,
              temperatureC: vh.temperatureC,
              pulseBpm: vh.pulseBpm,
              systolicBp: vh.systolicBp,
              diastolicBp: vh.diastolicBp,
              spo2Percent: vh.spo2Percent,
              respiratoryRate: vh.respiratoryRate,
              recordedAt: new Date(Date.now() - (vh as any).daysAgo * 24 * 60 * 60 * 1000),
              createdById: userId,
            },
          });
          totalVitals++;
        }
      }
      // Seed latest vitals
      if (demo.vitals) {
        const v = demo.vitals;
        const bmi = v.heightCm && v.weightKg
          ? Math.round((v.weightKg / ((v.heightCm / 100) ** 2)) * 10) / 10
          : null;
        await prisma.patientVitals.create({
          data: {
            patientId: patient.id,
            heightCm: v.heightCm,
            weightKg: v.weightKg,
            bmi,
            temperatureC: v.temperatureC,
            pulseBpm: v.pulseBpm,
            systolicBp: v.systolicBp,
            diastolicBp: v.diastolicBp,
            spo2Percent: v.spo2Percent,
            respiratoryRate: v.respiratoryRate,
            createdById: userId,
          },
        });
        totalVitals++;
      }
    }
  }
  console.log(`Seeded ${totalPatients} demo patients with ${totalVitals} vitals records.`);

  // Seed demo prescriptions for those patients (only if none exist yet)
  const existingRxCount = await prisma.prescription.count();
  if (existingRxCount === 0) {
    const medicines = await prisma.medicine.findMany({ take: 100 });
    const medicineByName = new Map(medicines.map((m) => [m.name, m]));

    for (const rx of PRESCRIPTION_DEMOS) {
      const patient = await prisma.patient.findFirst({ where: { contactNo: rx.patientPhone } });
      if (!patient) {
        console.warn(`Patient not found for phone ${rx.patientPhone}, skipping prescription.`);
        continue;
      }
      const doctor = doctorRows[rx.doctorIdx];
      if (!doctor) continue;

      const createdAt = new Date(Date.now() - rx.daysAgo * 24 * 60 * 60 * 1000);

      await prisma.prescription.create({
        data: {
          patientId: patient.id,
          doctorId: doctor.id,
          diagnosis: rx.diagnosis,
          notes: rx.notes ?? null,
          status: rx.status,
          createdAt,
          updatedAt: createdAt,
          items: {
            create: rx.items.map((item) => {
              const medicine = medicineByName.get(item.medicineName);
              return {
                medicineId: medicine?.id ?? 'unknown',
                medicineName: item.medicineName,
                dosage: item.dosage,
                duration: item.duration,
                quantity: item.qty,
              };
            }),
          },
        },
      });
      totalRx++;
    }
  }
  console.log(`Seeded ${totalRx} demo prescriptions with items.`);
}

// ─── Main ───────────────────────────────────────────────────

// ─── Prescription Templates ───────────────────────────────

const prescriptionTemplateData = [
  // ═══════════════════════════════════════════════════════════
  // PRESCRIPTION TEMPLATES
  // ═══════════════════════════════════════════════════════════

  // ── 1. Classic — Traditional formal layout ──
  {
    name: 'Classic Clinic Rx',
    type: 'prescription',
    description: 'Traditional Rx with clean lines and formal structure — the standard clinic prescription',
    isDefault: true,
    headerTitle: 'City Clinic — OPD',
    headerSubtitle: 'Department of Ophthalmology & General Medicine',
    clinicPhone: '022-25551234',
    clinicEmail: 'info@cityclinic.com',
    clinicWebsite: 'https://cityclinic.com',
    doctorName: 'Dr. Rajesh Sharma',
    doctorSpecialization: 'General Medicine',
    doctorQualification: 'MBBS, MD',
    doctorRegistrationNo: 'MCI-10001',
    layout: {
      layoutStyle: 'classic',
      headerStyle: 'centered',
      fontFamily: 'serif',
      paperSize: 'A4',
      fontSize: 'medium',
      showRxSymbol: true,
      showPatientFields: true,
      showMedicineTable: true,
      showRecommendations: false,
      showFooter: true,
      showQRCode: false,
      showBorder: true,
      showClinicAddress: true,
      showRegistrationNo: true,
      showWatermark: false,
      showDiagnosis: true,
      showNotes: true,
      primaryColor: '#2563eb',
      secondaryColor: '#dbeafe',
      headerBgColor: '#2563eb',
      recommendations: [],
      footerText: '',
      footerColumns: ['address', 'phone', 'email'],
    },
  },
  // ── 2. Modern — Contemporary with colored header banner ──
  {
    name: 'Modern Clinic Rx',
    type: 'prescription',
    description: 'Contemporary design with gradient header banner, rounded elements, and color accents',
    isDefault: false,
    headerTitle: 'City Heart Clinic',
    headerSubtitle: 'Cardiology & Cardiovascular Medicine',
    clinicPhone: '022-25551235',
    clinicEmail: 'heart@cityclinic.com',
    clinicWebsite: 'https://cityclinic.com/heart',
    doctorName: 'Dr. Arun Singh',
    doctorSpecialization: 'Cardiology',
    doctorQualification: 'MBBS, DM Cardiology',
    doctorRegistrationNo: 'MCI-10005',
    layout: {
      layoutStyle: 'modern',
      headerStyle: 'banner',
      fontFamily: 'sans',
      paperSize: 'A4',
      fontSize: 'medium',
      showRxSymbol: true,
      showPatientFields: true,
      showMedicineTable: true,
      showRecommendations: false,
      showFooter: true,
      showQRCode: false,
      showBorder: true,
      showClinicAddress: true,
      showRegistrationNo: true,
      showWatermark: false,
      showDiagnosis: true,
      showNotes: true,
      primaryColor: '#dc2626',
      secondaryColor: '#fef2f2',
      headerBgColor: '#dc2626',
      recommendations: [],
      footerText: '',
      footerColumns: ['address', 'phone'],
    },
  },
  // ── 3. Minimal — Stripped-down, quick prescriptions ──
  {
    name: 'Minimal Rx',
    type: 'prescription',
    description: 'Clean, minimal template without branding — ideal for quick prescriptions',
    isDefault: false,
    headerTitle: '',
    headerSubtitle: '',
    clinicPhone: '',
    clinicEmail: '',
    clinicWebsite: '',
    doctorName: '',
    doctorSpecialization: '',
    doctorQualification: '',
    doctorRegistrationNo: '',
    layout: {
      layoutStyle: 'minimal',
      headerStyle: 'left',
      fontFamily: 'sans',
      paperSize: 'A4',
      fontSize: 'small',
      showRxSymbol: true,
      showPatientFields: true,
      showMedicineTable: true,
      showRecommendations: false,
      showFooter: false,
      showQRCode: false,
      showBorder: false,
      showClinicAddress: false,
      showRegistrationNo: false,
      showWatermark: false,
      showDiagnosis: false,
      showNotes: false,
      primaryColor: '#000000',
      secondaryColor: '#ffffff',
      headerBgColor: '#000000',
      recommendations: [],
      footerText: '',
      footerColumns: [],
    },
  },
  // ── 4. Two-Column — Split layout for dense prescriptions ──
  {
    name: 'Two-Column Rx',
    type: 'prescription',
    description: 'Split layout: patient info on left, medicines on right — great for detailed prescriptions',
    isDefault: false,
    headerTitle: 'City Clinic — OPD',
    headerSubtitle: 'Multi-Specialty Clinic',
    clinicPhone: '022-25551234',
    clinicEmail: 'info@cityclinic.com',
    clinicWebsite: 'https://cityclinic.com',
    doctorName: 'Dr. Lakshmi Iyer',
    doctorSpecialization: 'Gynecology',
    doctorQualification: 'MBBS, MS OBG',
    doctorRegistrationNo: 'MCI-10004',
    layout: {
      layoutStyle: 'two-column',
      headerStyle: 'split',
      fontFamily: 'sans',
      paperSize: 'A4',
      fontSize: 'small',
      showRxSymbol: true,
      showPatientFields: true,
      showMedicineTable: true,
      showRecommendations: true,
      showFooter: true,
      showQRCode: false,
      showBorder: true,
      showClinicAddress: true,
      showRegistrationNo: true,
      showWatermark: false,
      showDiagnosis: true,
      showNotes: true,
      primaryColor: '#7c3aed',
      secondaryColor: '#ede9fe',
      headerBgColor: '#7c3aed',
      recommendations: [
        'Continue Breastfeeding',
        'Vaccination Schedule',
        'Growth Monitoring',
        'Nutrition Advice',
        'Iron Supplements',
      ],
      footerText: '',
      footerColumns: ['address', 'phone', 'email'],
    },
  },
  // ── 5. Compact — Dense layout for high-volume clinics ──
  {
    name: 'Compact Rx',
    type: 'prescription',
    description: 'Dense layout fitting more info in less space — perfect for high-volume OPD',
    isDefault: false,
    headerTitle: 'City Clinic — Express',
    headerSubtitle: 'Quick Consultation Desk',
    clinicPhone: '022-25551234',
    clinicEmail: 'express@cityclinic.com',
    clinicWebsite: '',
    doctorName: 'Dr. Vivek Mehta',
    doctorSpecialization: 'Orthopedics',
    doctorQualification: 'MBBS, MS Ortho',
    doctorRegistrationNo: 'MCI-10003',
    layout: {
      layoutStyle: 'compact',
      headerStyle: 'left',
      fontFamily: 'sans',
      paperSize: 'A5',
      fontSize: 'small',
      showRxSymbol: true,
      showPatientFields: true,
      showMedicineTable: true,
      showRecommendations: false,
      showFooter: true,
      showQRCode: false,
      showBorder: true,
      showClinicAddress: true,
      showRegistrationNo: true,
      showWatermark: false,
      showDiagnosis: true,
      showNotes: false,
      primaryColor: '#059669',
      secondaryColor: '#d1fae5',
      headerBgColor: '#059669',
      recommendations: [],
      footerText: '',
      footerColumns: ['address', 'phone'],
    },
  },
  // ── 6. Banner — Full-width header with centered content ──
  {
    name: 'Banner Rx',
    type: 'prescription',
    description: 'Full-width header banner with centered content — premium clinic look',
    isDefault: false,
    headerTitle: 'City Eye Centre',
    headerSubtitle: 'Complete Eye Care & Vision Solutions',
    clinicPhone: '022-25551234',
    clinicEmail: 'eyes@cityclinic.com',
    clinicWebsite: 'https://cityclinic.com/eyes',
    doctorName: 'Dr. Deepa Nair',
    doctorSpecialization: 'Ophthalmology',
    doctorQualification: 'MBBS, MS Ophthalmology',
    doctorRegistrationNo: 'MCI-10008',
    layout: {
      layoutStyle: 'banner',
      headerStyle: 'centered',
      fontFamily: 'serif',
      paperSize: 'A4',
      fontSize: 'medium',
      showRxSymbol: true,
      showPatientFields: true,
      showMedicineTable: true,
      showRecommendations: true,
      showFooter: true,
      showQRCode: true,
      showBorder: true,
      showClinicAddress: true,
      showRegistrationNo: true,
      showWatermark: true,
      showDiagnosis: true,
      showNotes: true,
      freeFormMode: false,
      writingLineCount: 20,
      showWritingLines: true,
      showSignatureLine: true,
      signatureText: 'Signature:',
      showHeaderLine: true,
      headerLineColor: '#0891b2',
      primaryColor: '#0891b2',
      secondaryColor: '#ecfeff',
      headerBgColor: '#0891b2',
      recommendations: [
        'Single Vision',
        'Bifocal',
        'Trifocal',
        'Progressive',
        'Polycarbonate',
        'Trivex',
        'Hi-Index',
        'Anti-Reflective Coating',
        'Photochromic',
        'Tint',
        'Polarized',
      ],
      footerText: 'Thank you for choosing City Eye Centre',
      footerColumns: ['address', 'phone', 'email', 'website'],
    },
  },
  // ── 7. Letterhead — Hospital letterhead with split header and line separator ──
  {
    name: 'Hospital Letterhead Rx',
    type: 'prescription',
    description: 'Classic hospital letterhead with doctor info left, hospital right, and colored separator line',
    isDefault: false,
    headerTitle: 'City Hospital',
    headerSubtitle: 'Multi-Specialty Hospital',
    clinicPhone: '022-25551234',
    clinicEmail: 'info@cityhospital.com',
    clinicWebsite: 'https://cityhospital.com',
    doctorName: 'Dr. Arun Singh',
    doctorSpecialization: 'Cardiology',
    doctorQualification: 'MBBS, DM Cardiology',
    doctorRegistrationNo: 'MCI-10005',
    layout: {
      layoutStyle: 'letterhead',
      headerStyle: 'split-line',
      fontFamily: 'serif',
      paperSize: 'A4',
      fontSize: 'medium',
      showRxSymbol: false,
      showPatientFields: true,
      showMedicineTable: true,
      showRecommendations: false,
      showFooter: false,
      showQRCode: false,
      showBorder: false,
      showClinicAddress: true,
      showRegistrationNo: true,
      showWatermark: false,
      showDiagnosis: false,
      showNotes: false,
      freeFormMode: false,
      writingLineCount: 20,
      showWritingLines: true,
      showSignatureLine: true,
      signatureText: 'Signature:',
      showHeaderLine: true,
      headerLineColor: '#16a34a',
      primaryColor: '#16a34a',
      secondaryColor: '#dcfce7',
      headerBgColor: '#16a34a',
      recommendations: [],
      footerText: '',
      footerColumns: [],
    },
  },
  // ── 8. Doctor's Script — Free-form writing pad with handwriting font ──
  {
    name: "Doctor's Script Pad",
    type: 'prescription',
    description: 'Free-form writing pad with lined paper and handwriting font — for doctors who prefer to write by hand',
    isDefault: false,
    headerTitle: '',
    headerSubtitle: '',
    clinicPhone: '',
    clinicEmail: '',
    clinicWebsite: '',
    doctorName: 'Dr. Priya Kapoor',
    doctorSpecialization: 'Dermatology',
    doctorQualification: 'MBBS, MD Dermatology',
    doctorRegistrationNo: 'MCI-10006',
    layout: {
      layoutStyle: 'doctor-script',
      headerStyle: 'left',
      fontFamily: 'handwriting',
      paperSize: 'A4',
      fontSize: 'large',
      showRxSymbol: true,
      showPatientFields: true,
      showMedicineTable: false,
      showRecommendations: false,
      showFooter: false,
      showQRCode: false,
      showBorder: true,
      showClinicAddress: false,
      showRegistrationNo: true,
      showWatermark: false,
      showDiagnosis: true,
      showNotes: false,
      freeFormMode: true,
      writingLineCount: 25,
      showWritingLines: true,
      showSignatureLine: true,
      signatureText: 'Dr. Priya Kapoor',
      showHeaderLine: true,
      headerLineColor: '#d97706',
      primaryColor: '#d97706',
      secondaryColor: '#fef3c7',
      headerBgColor: '#d97706',
      recommendations: [],
      footerText: '',
      footerColumns: [],
    },
  },
  // ── 9. Prescription Pad — Classic pad with no footer, just signature ──
  {
    name: 'Quick Prescription Pad',
    type: 'prescription',
    description: 'Minimal pad — header, patient line, writing space, and signature. No footer, no table.',
    isDefault: false,
    headerTitle: '',
    headerSubtitle: '',
    clinicPhone: '022-25551234',
    clinicEmail: '',
    clinicWebsite: '',
    doctorName: 'Dr. Mohammed Farooq',
    doctorSpecialization: 'ENT',
    doctorQualification: 'MBBS, MS ENT',
    doctorRegistrationNo: 'MCI-10007',
    layout: {
      layoutStyle: 'prescription-pad',
      headerStyle: 'split-line',
      fontFamily: 'serif',
      paperSize: 'A4',
      fontSize: 'medium',
      showRxSymbol: false,
      showPatientFields: true,
      showMedicineTable: false,
      showRecommendations: false,
      showFooter: false,
      showQRCode: false,
      showBorder: true,
      showClinicAddress: true,
      showRegistrationNo: false,
      showWatermark: false,
      showDiagnosis: false,
      showNotes: false,
      freeFormMode: true,
      writingLineCount: 22,
      showWritingLines: true,
      showSignatureLine: true,
      signatureText: 'Signature:',
      showHeaderLine: true,
      headerLineColor: '#7c3aed',
      primaryColor: '#7c3aed',
      secondaryColor: '#ede9fe',
      headerBgColor: '#7c3aed',
      recommendations: [],
      footerText: '',
      footerColumns: [],
    },
  },

  // ═══════════════════════════════════════════════════════════
  // DIAGNOSIS TEMPLATES
  // ═══════════════════════════════════════════════════════════

  // ── 10. Standard Diagnosis Report ──
  {
    name: 'Standard Diagnosis Report',
    type: 'diagnosis',
    description: 'General diagnosis report with clinical findings, investigation, and treatment plan',
    isDefault: true,
    headerTitle: 'City Hospital',
    headerSubtitle: 'Multi-Specialty Hospital',
    clinicPhone: '022-25551234',
    clinicEmail: 'info@cityhospital.com',
    clinicWebsite: 'https://cityhospital.com',
    doctorName: 'Dr. Rajesh Sharma',
    doctorSpecialization: 'General Medicine',
    doctorQualification: 'MBBS, MD',
    doctorRegistrationNo: 'MCI-10001',
    layout: {
      layoutStyle: 'classic',
      headerStyle: 'centered',
      fontFamily: 'serif',
      paperSize: 'A4',
      fontSize: 'medium',
      showRxSymbol: false,
      showPatientFields: true,
      showMedicineTable: false,
      showRecommendations: false,
      showFooter: true,
      showQRCode: false,
      showBorder: true,
      showClinicAddress: true,
      showRegistrationNo: true,
      showWatermark: false,
      showDiagnosis: true,
      showNotes: true,
      freeFormMode: true,
      writingLineCount: 15,
      showWritingLines: true,
      showSignatureLine: true,
      signatureText: 'Signature:',
      showHeaderLine: true,
      headerLineColor: '#16a34a',
      primaryColor: '#16a34a',
      secondaryColor: '#dcfce7',
      headerBgColor: '#16a34a',
      recommendations: [],
      footerText: '',
      footerColumns: ['address', 'phone'],
    },
  },

  // ── 11. Fitness Certificate ──
  {
    name: 'Fitness Certificate',
    type: 'diagnosis',
    description: 'Medical fitness certificate for employment, sports, or travel',
    isDefault: false,
    headerTitle: 'City Hospital',
    headerSubtitle: 'Medical Fitness Department',
    clinicPhone: '022-25551234',
    clinicEmail: 'fitness@cityhospital.com',
    clinicWebsite: '',
    doctorName: 'Dr. Arun Singh',
    doctorSpecialization: 'General Medicine',
    doctorQualification: 'MBBS, MD',
    doctorRegistrationNo: 'MCI-10005',
    layout: {
      layoutStyle: 'letterhead',
      headerStyle: 'split-line',
      fontFamily: 'serif',
      paperSize: 'A4',
      fontSize: 'medium',
      showRxSymbol: false,
      showPatientFields: true,
      showMedicineTable: false,
      showRecommendations: false,
      showFooter: true,
      showQRCode: false,
      showBorder: true,
      showClinicAddress: true,
      showRegistrationNo: true,
      showWatermark: false,
      showDiagnosis: true,
      showNotes: true,
      freeFormMode: true,
      writingLineCount: 18,
      showWritingLines: true,
      showSignatureLine: true,
      signatureText: 'Doctor Signature:',
      showHeaderLine: true,
      headerLineColor: '#0891b2',
      primaryColor: '#0891b2',
      secondaryColor: '#ecfeff',
      headerBgColor: '#0891b2',
      recommendations: [],
      footerText: 'This certificate is valid for 30 days from the date of issue.',
      footerColumns: ['address', 'phone'],
    },
  },

  // ── 12. Sick Leave Certificate ──
  {
    name: 'Sick Leave Certificate',
    type: 'diagnosis',
    description: 'Sick leave / medical leave certificate for employers and institutions',
    isDefault: false,
    headerTitle: 'City Clinic',
    headerSubtitle: '',
    clinicPhone: '022-25551234',
    clinicEmail: '',
    clinicWebsite: '',
    doctorName: 'Dr. Sunita Verma',
    doctorSpecialization: 'General Medicine',
    doctorQualification: 'MBBS, DCH',
    doctorRegistrationNo: 'MCI-10002',
    layout: {
      layoutStyle: 'minimal',
      headerStyle: 'left',
      fontFamily: 'serif',
      paperSize: 'A4',
      fontSize: 'medium',
      showRxSymbol: false,
      showPatientFields: true,
      showMedicineTable: false,
      showRecommendations: false,
      showFooter: false,
      showQRCode: false,
      showBorder: true,
      showClinicAddress: false,
      showRegistrationNo: true,
      showWatermark: false,
      showDiagnosis: false,
      showNotes: false,
      freeFormMode: true,
      writingLineCount: 12,
      showWritingLines: true,
      showSignatureLine: true,
      signatureText: 'Doctor Signature:',
      showHeaderLine: true,
      headerLineColor: '#d97706',
      primaryColor: '#d97706',
      secondaryColor: '#fef3c7',
      headerBgColor: '#d97706',
      recommendations: [],
      footerText: '',
      footerColumns: [],
    },
  },

  // ═══════════════════════════════════════════════════════════
  // LAB TEST TEMPLATES
  // ═══════════════════════════════════════════════════════════

  // ── 13. Standard Lab Test Order ──
  {
    name: 'Standard Lab Test Order',
    type: 'test',
    description: 'Comprehensive lab test order form with all test categories and checkboxes',
    isDefault: true,
    headerTitle: 'City Diagnostic Centre',
    headerSubtitle: 'NABL Accredited Laboratory',
    clinicPhone: '022-25551235',
    clinicEmail: 'lab@cityclinic.com',
    clinicWebsite: 'https://cityclinic.com/lab',
    doctorName: '',
    doctorSpecialization: '',
    doctorQualification: '',
    doctorRegistrationNo: '',
    layout: {
      layoutStyle: 'classic',
      headerStyle: 'centered',
      fontFamily: 'sans',
      paperSize: 'A4',
      fontSize: 'small',
      showRxSymbol: false,
      showPatientFields: true,
      showMedicineTable: false,
      showRecommendations: false,
      showFooter: true,
      showQRCode: true,
      showBorder: true,
      showClinicAddress: true,
      showRegistrationNo: false,
      showWatermark: false,
      showDiagnosis: false,
      showNotes: false,
      freeFormMode: false,
      writingLineCount: 20,
      showWritingLines: true,
      showSignatureLine: true,
      signatureText: 'Referring Doctor:',
      showHeaderLine: true,
      headerLineColor: '#dc2626',
      primaryColor: '#dc2626',
      secondaryColor: '#fef2f2',
      headerBgColor: '#dc2626',
      recommendations: [],
      footerText: 'Report will be available in 24-48 hours',
      footerColumns: ['address', 'phone', 'email'],
    },
  },

  // ── 14. Quick Test Requisition ──
  {
    name: 'Quick Test Requisition',
    type: 'test',
    description: 'Minimal test requisition — just patient info and test checklist',
    isDefault: false,
    headerTitle: 'City Clinic Lab',
    headerSubtitle: '',
    clinicPhone: '022-25551234',
    clinicEmail: '',
    clinicWebsite: '',
    doctorName: 'Dr. Priya Kapoor',
    doctorSpecialization: 'Dermatology',
    doctorQualification: 'MBBS, MD Dermatology',
    doctorRegistrationNo: 'MCI-10006',
    layout: {
      layoutStyle: 'minimal',
      headerStyle: 'left',
      fontFamily: 'sans',
      paperSize: 'A5',
      fontSize: 'small',
      showRxSymbol: false,
      showPatientFields: true,
      showMedicineTable: false,
      showRecommendations: false,
      showFooter: false,
      showQRCode: false,
      showBorder: true,
      showClinicAddress: false,
      showRegistrationNo: true,
      showWatermark: false,
      showDiagnosis: false,
      showNotes: false,
      freeFormMode: false,
      writingLineCount: 15,
      showWritingLines: true,
      showSignatureLine: true,
      signatureText: 'Doctor:',
      showHeaderLine: true,
      headerLineColor: '#7c3aed',
      primaryColor: '#7c3aed',
      secondaryColor: '#ede9fe',
      headerBgColor: '#7c3aed',
      recommendations: [],
      footerText: '',
      footerColumns: [],
    },
  },
];

async function seedPrescriptionTemplates() {
  const existing = await prisma.prescriptionTemplate.count();
  if (existing > 0 && !FRESH) {
    console.log('Prescription templates already seeded, skipping.');
    return;
  }
  const orgId = '00000000-0000-0000-0000-000000000001';
  const superadmin = await prisma.user.findFirst({ where: { email: 'superadmin@clinic.com' } });
  const userId = superadmin?.id ?? null;

  for (const t of prescriptionTemplateData) {
    await prisma.prescriptionTemplate.create({
      data: {
        name: t.name,
        type: t.type ?? 'prescription',
        description: t.description,
        isDefault: t.isDefault,
        clinicName: t.headerTitle,
        clinicPhone: t.clinicPhone,
        clinicEmail: t.clinicEmail,
        clinicWebsite: t.clinicWebsite,
        doctorName: t.doctorName,
        doctorSpecialization: t.doctorSpecialization,
        doctorQualification: t.doctorQualification,
        doctorRegNo: t.doctorRegistrationNo,
        layout: t.layout,
        createdById: userId,
      },
    });
  }
  console.log(`Seeded ${prescriptionTemplateData.length} prescription templates (prescription, diagnosis, and test).`);
}

// ─── Appointments ─────────────────────────────────────────

async function seedAppointments(doctorRows: Doctor[]) {
  const existing = await prisma.appointment.count();
  if (existing > 0 && !FRESH) {
    console.log('Appointments already seeded, skipping.');
    return;
  }
  const patients = await prisma.patient.findMany();
  if (patients.length === 0) return;
  const now = Date.now();
  // Use UTC-based date construction to match the API's filter boundaries
  function utcDate(daysOffset: number, hours: number, minutes: number): Date {
    const d = new Date(now + daysOffset * DAY);
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), hours, minutes, 0, 0));
  }

  // Completed appointments (past)
  const completedAppts = [
    { patientPhone: '9876543210', doctorIdx: 0, daysAgo: 21, type: 'WALK_IN', fee: 0, status: 'COMPLETED', notes: 'General check-up — mild fever' },
    { patientPhone: '9876543210', doctorIdx: 1, daysAgo: 14, type: 'CONSULTATION', fee: 600, status: 'COMPLETED', notes: 'Pediatric follow-up for child' },
    { patientPhone: '9876543210', doctorIdx: 2, daysAgo: 10, type: 'SPECIALIST', fee: 800, status: 'COMPLETED', notes: 'Orthopedic consult for knee pain' },
    { patientPhone: '9876543210', doctorIdx: 0, daysAgo: 7, type: 'FOLLOW_UP', fee: 500, status: 'COMPLETED', notes: 'Follow-up — fever resolved' },
    { patientPhone: '9876543210', doctorIdx: 4, daysAgo: 3, type: 'SPECIALIST', fee: 1000, status: 'COMPLETED', notes: 'Cardiology check-up — chest discomfort' },
    { patientPhone: '9876543212', doctorIdx: 2, daysAgo: 30, type: 'SPECIALIST', fee: 800, status: 'COMPLETED', notes: 'Orthopedic consult — chronic knee pain' },
    { patientPhone: '9876543212', doctorIdx: 4, daysAgo: 18, type: 'SPECIALIST', fee: 1000, status: 'COMPLETED', notes: 'Cardiology follow-up — hypertension' },
    { patientPhone: '9876543212', doctorIdx: 4, daysAgo: 5, type: 'FOLLOW_UP', fee: 500, status: 'COMPLETED', notes: 'BP check — stable' },
    { patientPhone: '9876543214', doctorIdx: 1, daysAgo: 45, type: 'WALK_IN', fee: 0, status: 'COMPLETED', notes: 'Newborn check-up — weight & vaccinations' },
    { patientPhone: '9876543214', doctorIdx: 1, daysAgo: 28, type: 'CONSULTATION', fee: 600, status: 'COMPLETED', notes: 'Routine vaccination visit' },
    { patientPhone: '9876543214', doctorIdx: 1, daysAgo: 12, type: 'FOLLOW_UP', fee: 300, status: 'COMPLETED', notes: 'Milk allergy assessment — improving' },
    { patientPhone: '9876543216', doctorIdx: 5, daysAgo: 35, type: 'CONSULTATION', fee: 600, status: 'COMPLETED', notes: 'Skin rash — diagnosed as eczema' },
    { patientPhone: '9876543216', doctorIdx: 5, daysAgo: 20, type: 'FOLLOW_UP', fee: 300, status: 'COMPLETED', notes: 'Dermatology follow-up — improved' },
    { patientPhone: '9876543216', doctorIdx: 3, daysAgo: 8, type: 'SPECIALIST', fee: 700, status: 'COMPLETED', notes: 'Gynecology consult — routine check-up' },
    { patientPhone: '9876543218', doctorIdx: 8, daysAgo: 40, type: 'SPECIALIST', fee: 1200, status: 'COMPLETED', notes: 'Neurology consult — chronic headaches' },
    { patientPhone: '9876543218', doctorIdx: 6, daysAgo: 25, type: 'CONSULTATION', fee: 550, status: 'COMPLETED', notes: 'ENT check — hearing difficulty' },
    { patientPhone: '9876543218', doctorIdx: 8, daysAgo: 10, type: 'FOLLOW_UP', fee: 600, status: 'COMPLETED', notes: 'Headache follow-up — MRI reports normal' },
    { patientPhone: '9876543218', doctorIdx: 6, daysAgo: 2, type: 'FOLLOW_UP', fee: 300, status: 'COMPLETED', notes: 'ENT follow-up — hearing aid trial' },
    { patientPhone: '9876543220', doctorIdx: 3, daysAgo: 15, type: 'CONSULTATION', fee: 600, status: 'COMPLETED', notes: 'Regular gynecology check-up' },
    { patientPhone: '9876543220', doctorIdx: 5, daysAgo: 5, type: 'SPECIALIST', fee: 600, status: 'COMPLETED', notes: 'Acne treatment follow-up' },
    { patientPhone: '9876543222', doctorIdx: 2, daysAgo: 20, type: 'SPECIALIST', fee: 800, status: 'COMPLETED', notes: 'Sports injury — ankle sprain' },
    { patientPhone: '9876543222', doctorIdx: 2, daysAgo: 8, type: 'FOLLOW_UP', fee: 400, status: 'COMPLETED', notes: 'Ankle healing well, physiotherapy advised' },
    { patientPhone: '9876543224', doctorIdx: 0, daysAgo: 60, type: 'CONSULTATION', fee: 500, status: 'COMPLETED', notes: 'Diabetes screening — borderline' },
    { patientPhone: '9876543224', doctorIdx: 0, daysAgo: 30, type: 'FOLLOW_UP', fee: 300, status: 'COMPLETED', notes: 'HbA1c results reviewed — lifestyle changes advised' },
    { patientPhone: '9876543226', doctorIdx: 7, daysAgo: 10, type: 'CONSULTATION', fee: 600, status: 'COMPLETED', notes: 'Vision check — mild myopia detected' },
    { patientPhone: '9876543228', doctorIdx: 4, daysAgo: 45, type: 'SPECIALIST', fee: 1000, status: 'COMPLETED', notes: 'Cardiology consult — uncontrolled hypertension' },
    { patientPhone: '9876543228', doctorIdx: 4, daysAgo: 15, type: 'FOLLOW_UP', fee: 500, status: 'COMPLETED', notes: 'BP medication adjusted — monitor weekly' },
    // ── Batch 2 completed appointments ──
    { patientPhone: '9876543230', doctorIdx: 4, daysAgo: 40, type: 'SPECIALIST', fee: 1000, status: 'COMPLETED', notes: 'Cardiology — chest pain on exertion' },
    { patientPhone: '9876543230', doctorIdx: 4, daysAgo: 15, type: 'FOLLOW_UP', fee: 500, status: 'COMPLETED', notes: 'Stress test recommended' },
    { patientPhone: '9876543230', doctorIdx: 0, daysAgo: 3, type: 'CONSULTATION', fee: 500, status: 'COMPLETED', notes: 'General check-up — fatigue' },
    { patientPhone: '9876543232', doctorIdx: 2, daysAgo: 60, type: 'SPECIALIST', fee: 800, status: 'COMPLETED', notes: 'Back pain — spondylosis' },
    { patientPhone: '9876543232', doctorIdx: 2, daysAgo: 30, type: 'FOLLOW_UP', fee: 400, status: 'COMPLETED', notes: 'Physiotherapy started' },
    { patientPhone: '9876543232', doctorIdx: 0, daysAgo: 5, type: 'CONSULTATION', fee: 500, status: 'COMPLETED', notes: 'Diabetes check' },
    { patientPhone: '9876543234', doctorIdx: 5, daysAgo: 12, type: 'CONSULTATION', fee: 600, status: 'COMPLETED', notes: 'Acne treatment started' },
    { patientPhone: '9876543234', doctorIdx: 5, daysAgo: 3, type: 'FOLLOW_UP', fee: 300, status: 'COMPLETED', notes: 'Skin improving' },
    { patientPhone: '9876543236', doctorIdx: 4, daysAgo: 50, type: 'SPECIALIST', fee: 1000, status: 'COMPLETED', notes: 'CHF evaluation' },
    { patientPhone: '9876543236', doctorIdx: 4, daysAgo: 20, type: 'FOLLOW_UP', fee: 500, status: 'COMPLETED', notes: 'BP improved' },
    { patientPhone: '9876543236', doctorIdx: 0, daysAgo: 2, type: 'CONSULTATION', fee: 500, status: 'COMPLETED', notes: 'HbA1c review' },
    { patientPhone: '9876543238', doctorIdx: 3, daysAgo: 30, type: 'SPECIALIST', fee: 700, status: 'COMPLETED', notes: 'Prenatal 16 weeks' },
    { patientPhone: '9876543238', doctorIdx: 3, daysAgo: 7, type: 'FOLLOW_UP', fee: 500, status: 'COMPLETED', notes: 'Routine antenatal' },
    { patientPhone: '9876543240', doctorIdx: 6, daysAgo: 8, type: 'CONSULTATION', fee: 550, status: 'COMPLETED', notes: 'Chronic sinusitis' },
    { patientPhone: '9876543240', doctorIdx: 6, daysAgo: 1, type: 'FOLLOW_UP', fee: 300, status: 'COMPLETED', notes: 'CT results reviewed' },
    { patientPhone: '9876543242', doctorIdx: 7, daysAgo: 45, type: 'SPECIALIST', fee: 650, status: 'COMPLETED', notes: 'Cataract evaluation' },
    { patientPhone: '9876543242', doctorIdx: 7, daysAgo: 10, type: 'FOLLOW_UP', fee: 300, status: 'COMPLETED', notes: 'Pre-op assessment' },
    { patientPhone: '9876543244', doctorIdx: 9, daysAgo: 20, type: 'CONSULTATION', fee: 800, status: 'COMPLETED', notes: 'Anxiety and insomnia' },
    { patientPhone: '9876543244', doctorIdx: 9, daysAgo: 5, type: 'FOLLOW_UP', fee: 400, status: 'COMPLETED', notes: 'Dosage adjusted' },
    { patientPhone: '9876543246', doctorIdx: 4, daysAgo: 35, type: 'SPECIALIST', fee: 1000, status: 'COMPLETED', notes: 'Resistant HTN' },
    { patientPhone: '9876543246', doctorIdx: 4, daysAgo: 10, type: 'FOLLOW_UP', fee: 500, status: 'COMPLETED', notes: 'Added Spironolactone' },
    { patientPhone: '9876543248', doctorIdx: 8, daysAgo: 15, type: 'SPECIALIST', fee: 1200, status: 'COMPLETED', notes: 'Tension headaches' },
    { patientPhone: '9876543248', doctorIdx: 0, daysAgo: 2, type: 'CONSULTATION', fee: 500, status: 'COMPLETED', notes: 'Viral fever' },
    { patientPhone: '9876543250', doctorIdx: 0, daysAgo: 30, type: 'CONSULTATION', fee: 500, status: 'COMPLETED', notes: 'Diabetes screening' },
    { patientPhone: '9876543250', doctorIdx: 0, daysAgo: 7, type: 'FOLLOW_UP', fee: 300, status: 'COMPLETED', notes: 'HbA1c 7.8%' },
    { patientPhone: '9876543252', doctorIdx: 0, daysAgo: 20, type: 'CONSULTATION', fee: 500, status: 'COMPLETED', notes: 'Acute bronchitis' },
    { patientPhone: '9876543252', doctorIdx: 0, daysAgo: 5, type: 'FOLLOW_UP', fee: 300, status: 'COMPLETED', notes: 'Bronchitis resolving' },
    { patientPhone: '9876543254', doctorIdx: 3, daysAgo: 10, type: 'CONSULTATION', fee: 600, status: 'COMPLETED', notes: 'PCOD evaluation' },
    { patientPhone: '9876543254', doctorIdx: 3, daysAgo: 3, type: 'FOLLOW_UP', fee: 300, status: 'COMPLETED', notes: 'USG confirmed PCOD' },
    { patientPhone: '9876543256', doctorIdx: 2, daysAgo: 25, type: 'SPECIALIST', fee: 800, status: 'COMPLETED', notes: 'Knee OA Grade 3' },
    { patientPhone: '9876543256', doctorIdx: 2, daysAgo: 5, type: 'FOLLOW_UP', fee: 400, status: 'COMPLETED', notes: 'Viscosupplementation' },
    { patientPhone: '9876543258', doctorIdx: 5, daysAgo: 14, type: 'CONSULTATION', fee: 600, status: 'COMPLETED', notes: 'Eczema flare-up' },
    { patientPhone: '9876543258', doctorIdx: 5, daysAgo: 4, type: 'FOLLOW_UP', fee: 300, status: 'COMPLETED', notes: 'Eczema improving' },
    { patientPhone: '9876543260', doctorIdx: 0, daysAgo: 42, type: 'CONSULTATION', fee: 500, status: 'COMPLETED', notes: 'Obesity consult' },
    { patientPhone: '9876543260', doctorIdx: 0, daysAgo: 14, type: 'FOLLOW_UP', fee: 300, status: 'COMPLETED', notes: 'Weight loss 2kg' },
    // ── Batch 3 completed appointments ──
    { patientPhone: '9876543262', doctorIdx: 0, daysAgo: 50, type: 'CONSULTATION', fee: 500, status: 'COMPLETED', notes: 'Migraine evaluation' },
    { patientPhone: '9876543262', doctorIdx: 0, daysAgo: 20, type: 'FOLLOW_UP', fee: 300, status: 'COMPLETED', notes: 'Headache frequency reduced' },
    { patientPhone: '9876543262', doctorIdx: 5, daysAgo: 3, type: 'CONSULTATION', fee: 600, status: 'COMPLETED', notes: 'Psoriasis flare-up' },
    { patientPhone: '9876543264', doctorIdx: 4, daysAgo: 60, type: 'SPECIALIST', fee: 1000, status: 'COMPLETED', notes: 'Angina evaluation' },
    { patientPhone: '9876543264', doctorIdx: 4, daysAgo: 25, type: 'FOLLOW_UP', fee: 500, status: 'COMPLETED', notes: 'TMT positive' },
    { patientPhone: '9876543264', doctorIdx: 4, daysAgo: 5, type: 'SPECIALIST', fee: 1000, status: 'COMPLETED', notes: 'Post-angiography' },
    { patientPhone: '9876543266', doctorIdx: 3, daysAgo: 18, type: 'CONSULTATION', fee: 600, status: 'COMPLETED', notes: 'Dysmenorrhea' },
    { patientPhone: '9876543266', doctorIdx: 3, daysAgo: 6, type: 'FOLLOW_UP', fee: 300, status: 'COMPLETED', notes: 'Pain improved' },
    { patientPhone: '9876543268', doctorIdx: 8, daysAgo: 45, type: 'SPECIALIST', fee: 1200, status: 'COMPLETED', notes: 'Stroke evaluation' },
    { patientPhone: '9876543268', doctorIdx: 8, daysAgo: 12, type: 'FOLLOW_UP', fee: 600, status: 'COMPLETED', notes: 'MRI review' },
    { patientPhone: '9876543270', doctorIdx: 9, daysAgo: 22, type: 'CONSULTATION', fee: 800, status: 'COMPLETED', notes: 'Depression screening' },
    { patientPhone: '9876543270', doctorIdx: 9, daysAgo: 8, type: 'FOLLOW_UP', fee: 400, status: 'COMPLETED', notes: 'SSRI started' },
    { patientPhone: '9876543272', doctorIdx: 7, daysAgo: 40, type: 'SPECIALIST', fee: 650, status: 'COMPLETED', notes: 'Glaucoma screening' },
    { patientPhone: '9876543272', doctorIdx: 7, daysAgo: 10, type: 'FOLLOW_UP', fee: 300, status: 'COMPLETED', notes: 'Timolol started' },
    { patientPhone: '9876543274', doctorIdx: 6, daysAgo: 15, type: 'CONSULTATION', fee: 550, status: 'COMPLETED', notes: 'Recurrent tonsillitis' },
    { patientPhone: '9876543274', doctorIdx: 6, daysAgo: 3, type: 'FOLLOW_UP', fee: 300, status: 'COMPLETED', notes: 'Improved' },
    { patientPhone: '9876543276', doctorIdx: 4, daysAgo: 55, type: 'SPECIALIST', fee: 1000, status: 'COMPLETED', notes: 'Uncontrolled HTN' },
    { patientPhone: '9876543276', doctorIdx: 4, daysAgo: 20, type: 'FOLLOW_UP', fee: 500, status: 'COMPLETED', notes: 'BP improving' },
    { patientPhone: '9876543278', doctorIdx: 2, daysAgo: 12, type: 'CONSULTATION', fee: 800, status: 'COMPLETED', notes: 'ACL tear' },
    { patientPhone: '9876543278', doctorIdx: 2, daysAgo: 2, type: 'FOLLOW_UP', fee: 400, status: 'COMPLETED', notes: 'Brace fitted' },
    { patientPhone: '9876543280', doctorIdx: 3, daysAgo: 35, type: 'SPECIALIST', fee: 700, status: 'COMPLETED', notes: 'Menorrhagia eval' },
    { patientPhone: '9876543280', doctorIdx: 3, daysAgo: 8, type: 'FOLLOW_UP', fee: 500, status: 'COMPLETED', notes: 'Conservative mgmt' },
    { patientPhone: '9876543282', doctorIdx: 0, daysAgo: 30, type: 'CONSULTATION', fee: 500, status: 'COMPLETED', notes: 'GERD eval' },
    { patientPhone: '9876543282', doctorIdx: 0, daysAgo: 7, type: 'FOLLOW_UP', fee: 300, status: 'COMPLETED', notes: 'PPI working' },
    { patientPhone: '9876543284', doctorIdx: 1, daysAgo: 16, type: 'CONSULTATION', fee: 600, status: 'COMPLETED', notes: 'Child fever' },
    { patientPhone: '9876543284', doctorIdx: 1, daysAgo: 4, type: 'FOLLOW_UP', fee: 300, status: 'COMPLETED', notes: 'Child recovered' },
    { patientPhone: '9876543286', doctorIdx: 0, daysAgo: 35, type: 'CONSULTATION', fee: 500, status: 'COMPLETED', notes: 'Hypothyroid eval' },
    { patientPhone: '9876543286', doctorIdx: 0, daysAgo: 7, type: 'FOLLOW_UP', fee: 300, status: 'COMPLETED', notes: 'Levothyroxine started' },
    { patientPhone: '9876543288', doctorIdx: 3, daysAgo: 20, type: 'CONSULTATION', fee: 600, status: 'COMPLETED', notes: 'PCOD eval' },
    { patientPhone: '9876543288', doctorIdx: 3, daysAgo: 5, type: 'FOLLOW_UP', fee: 300, status: 'COMPLETED', notes: 'Hormones reviewed' },
    { patientPhone: '9876543290', doctorIdx: 2, daysAgo: 50, type: 'SPECIALIST', fee: 800, status: 'COMPLETED', notes: 'Frozen shoulder eval' },
    { patientPhone: '9876543290', doctorIdx: 2, daysAgo: 18, type: 'FOLLOW_UP', fee: 400, status: 'COMPLETED', notes: 'Physiotherapy started' },
    // ── Cancelled and No-Show appointments ──
    { patientPhone: '9876543262', doctorIdx: 9, daysAgo: 10, type: 'CONSULTATION', fee: 800, status: 'CANCELLED', notes: 'Patient cancelled — personal reasons' },
    { patientPhone: '9876543270', doctorIdx: 5, daysAgo: 15, type: 'CONSULTATION', fee: 600, status: 'CANCELLED', notes: 'Patient cancelled — felt better' },
    { patientPhone: '9876543276', doctorIdx: 0, daysAgo: 8, type: 'FOLLOW_UP', fee: 300, status: 'NO_SHOW', notes: 'Patient did not attend' },
    { patientPhone: '9876543284', doctorIdx: 6, daysAgo: 12, type: 'CONSULTATION', fee: 550, status: 'NO_SHOW', notes: 'Patient did not attend' },
    { patientPhone: '9876543288', doctorIdx: 5, daysAgo: 18, type: 'CONSULTATION', fee: 600, status: 'RESCHEDULED', notes: 'Rescheduled to later date' },
    { patientPhone: '9876543264', doctorIdx: 0, daysAgo: 15, type: 'CONSULTATION', fee: 500, status: 'CANCELLED', notes: 'Doctor unavailable — rescheduled' },
    // ── Confirmed / Checked-In appointments ──
    { patientPhone: '9876543230', doctorIdx: 0, daysAgo: 1, type: 'CONSULTATION', fee: 500, status: 'CONFIRMED', notes: 'General check-up confirmed' },
    { patientPhone: '9876543252', doctorIdx: 2, daysAgo: 1, type: 'SPECIALIST', fee: 800, status: 'CHECKED_IN', notes: 'Checked in for ortho consult' },
  ];

  const patientByPhone = new Map(patients.map((p) => [p.contactNo, p]));
  let apptCount = 0;

  for (const a of completedAppts) {
    const patient = patientByPhone.get(a.patientPhone);
    if (!patient) continue;
    const doctor = doctorRows[a.doctorIdx];
    if (!doctor) continue;
    const date = utcDate(-a.daysAgo, 9 + (a.doctorIdx % 8), (a.doctorIdx * 15) % 60);

    await prisma.appointment.create({
      data: {
        patientId: patient.id,
        doctorId: doctor.id,
        date,
        type: a.type,
        status: a.status,
        fee: a.fee,
        registrationFee: a.daysAgo > 30 ? 100 : 0,
        notes: a.notes,
      },
    });
    apptCount++;
  }

  // Upcoming appointments (next 7 days)
  const upcomingAppts = [
    { patientPhone: '9876543210', doctorIdx: 0, daysAhead: 2, type: 'FOLLOW_UP', fee: 500, status: 'SCHEDULED', notes: 'BP follow-up' },
    { patientPhone: '9876543212', doctorIdx: 4, daysAhead: 3, type: 'FOLLOW_UP', fee: 500, status: 'SCHEDULED', notes: 'Cardiology review' },
    { patientPhone: '9876543214', doctorIdx: 1, daysAhead: 1, type: 'CONSULTATION', fee: 600, status: 'SCHEDULED', notes: 'Growth assessment' },
    { patientPhone: '9876543216', doctorIdx: 3, daysAhead: 5, type: 'SPECIALIST', fee: 700, status: 'SCHEDULED', notes: 'Gynecology follow-up' },
    { patientPhone: '9876543218', doctorIdx: 9, daysAhead: 4, type: 'FOLLOW_UP', fee: 400, status: 'SCHEDULED', notes: 'Psychiatry session' },
    { patientPhone: '9876543220', doctorIdx: 3, daysAhead: 7, type: 'CONSULTATION', fee: 600, status: 'SCHEDULED', notes: 'Prenatal check-up' },
    { patientPhone: '9876543222', doctorIdx: 2, daysAhead: 6, type: 'FOLLOW_UP', fee: 400, status: 'SCHEDULED', notes: 'Ankle rehab check' },
    { patientPhone: '9876543224', doctorIdx: 0, daysAhead: 3, type: 'FOLLOW_UP', fee: 300, status: 'SCHEDULED', notes: 'Diabetes review' },
    { patientPhone: '9876543226', doctorIdx: 7, daysAhead: 2, type: 'FOLLOW_UP', fee: 300, status: 'SCHEDULED', notes: 'Glasses fitting' },
    { patientPhone: '9876543228', doctorIdx: 4, daysAhead: 1, type: 'FOLLOW_UP', fee: 500, status: 'SCHEDULED', notes: 'BP recheck' },
    // ── Batch 2 upcoming appointments ──
    { patientPhone: '9876543230', doctorIdx: 4, daysAhead: 2, type: 'FOLLOW_UP', fee: 500, status: 'SCHEDULED', notes: 'Cardiology review' },
    { patientPhone: '9876543232', doctorIdx: 2, daysAhead: 4, type: 'FOLLOW_UP', fee: 400, status: 'SCHEDULED', notes: 'Back pain check' },
    { patientPhone: '9876543234', doctorIdx: 5, daysAhead: 3, type: 'FOLLOW_UP', fee: 300, status: 'SCHEDULED', notes: 'Acne review' },
    { patientPhone: '9876543236', doctorIdx: 4, daysAhead: 2, type: 'FOLLOW_UP', fee: 500, status: 'SCHEDULED', notes: 'CHF follow-up' },
    { patientPhone: '9876543238', doctorIdx: 3, daysAhead: 5, type: 'FOLLOW_UP', fee: 500, status: 'SCHEDULED', notes: 'Prenatal 20 weeks' },
    { patientPhone: '9876543242', doctorIdx: 7, daysAhead: 3, type: 'SPECIALIST', fee: 650, status: 'SCHEDULED', notes: 'Cataract surgery' },
    { patientPhone: '9876543244', doctorIdx: 9, daysAhead: 4, type: 'FOLLOW_UP', fee: 400, status: 'SCHEDULED', notes: 'Anxiety review' },
    { patientPhone: '9876543246', doctorIdx: 4, daysAhead: 2, type: 'FOLLOW_UP', fee: 500, status: 'SCHEDULED', notes: 'BP recheck' },
    { patientPhone: '9876543250', doctorIdx: 0, daysAhead: 3, type: 'FOLLOW_UP', fee: 300, status: 'SCHEDULED', notes: 'Diabetes review' },
    { patientPhone: '9876543254', doctorIdx: 3, daysAhead: 7, type: 'FOLLOW_UP', fee: 300, status: 'SCHEDULED', notes: 'PCOD follow-up' },
    { patientPhone: '9876543256', doctorIdx: 2, daysAhead: 6, type: 'FOLLOW_UP', fee: 400, status: 'SCHEDULED', notes: 'Knee review' },
    { patientPhone: '9876543260', doctorIdx: 0, daysAhead: 5, type: 'FOLLOW_UP', fee: 300, status: 'SCHEDULED', notes: 'Weight check' },
    // ── Batch 3 upcoming ──
    { patientPhone: '9876543262', doctorIdx: 5, daysAhead: 3, type: 'FOLLOW_UP', fee: 300, status: 'SCHEDULED', notes: 'Psoriasis review' },
    { patientPhone: '9876543264', doctorIdx: 4, daysAhead: 2, type: 'SPECIALIST', fee: 1000, status: 'SCHEDULED', notes: 'Pre-PCI assessment' },
    { patientPhone: '9876543268', doctorIdx: 8, daysAhead: 4, type: 'FOLLOW_UP', fee: 600, status: 'SCHEDULED', notes: 'Stroke secondary prevention' },
    { patientPhone: '9876543270', doctorIdx: 9, daysAhead: 3, type: 'FOLLOW_UP', fee: 400, status: 'SCHEDULED', notes: 'SSRI review' },
    { patientPhone: '9876543272', doctorIdx: 7, daysAhead: 5, type: 'FOLLOW_UP', fee: 300, status: 'SCHEDULED', notes: 'IOP recheck' },
    { patientPhone: '9876543276', doctorIdx: 4, daysAhead: 2, type: 'FOLLOW_UP', fee: 500, status: 'SCHEDULED', notes: 'BP recheck' },
    { patientPhone: '9876543278', doctorIdx: 2, daysAhead: 4, type: 'FOLLOW_UP', fee: 400, status: 'SCHEDULED', notes: 'ACL rehab check' },
    { patientPhone: '9876543280', doctorIdx: 3, daysAhead: 6, type: 'FOLLOW_UP', fee: 500, status: 'SCHEDULED', notes: 'Fibroid review' },
    { patientPhone: '9876543282', doctorIdx: 0, daysAhead: 7, type: 'FOLLOW_UP', fee: 300, status: 'SCHEDULED', notes: 'PPI review' },
    { patientPhone: '9876543286', doctorIdx: 0, daysAhead: 3, type: 'FOLLOW_UP', fee: 300, status: 'SCHEDULED', notes: 'TSH recheck' },
    { patientPhone: '9876543288', doctorIdx: 3, daysAhead: 5, type: 'FOLLOW_UP', fee: 300, status: 'SCHEDULED', notes: 'PCOD follow-up' },
    { patientPhone: '9876543290', doctorIdx: 2, daysAhead: 6, type: 'FOLLOW_UP', fee: 400, status: 'SCHEDULED', notes: 'Frozen shoulder rehab' },
  ];

  for (const a of upcomingAppts) {
    const patient = patientByPhone.get(a.patientPhone);
    if (!patient) continue;
    const doctor = doctorRows[a.doctorIdx];
    if (!doctor) continue;
    const date = utcDate(a.daysAhead, 9 + (a.doctorIdx % 8), (a.doctorIdx * 15) % 60);

    await prisma.appointment.create({
      data: {
        patientId: patient.id,
        doctorId: doctor.id,
        date,
        type: a.type,
        status: a.status,
        fee: a.fee,
        notes: a.notes,
      },
    });
    apptCount++;
  }

  // Today's appointments (one per doctor with a queue entry)
  const todayAppts = [
    { patientPhone: '9876543210', doctorIdx: 0, type: 'FOLLOW_UP', fee: 500, status: 'IN_PROGRESS', notes: 'Routine follow-up' },
    { patientPhone: '9876543224', doctorIdx: 0, type: 'CONSULTATION', fee: 500, status: 'SCHEDULED', notes: 'Diabetes review' },
    { patientPhone: '9876543214', doctorIdx: 1, type: 'CONSULTATION', fee: 600, status: 'IN_PROGRESS', notes: 'Growth assessment' },
    { patientPhone: '9876543222', doctorIdx: 2, type: 'FOLLOW_UP', fee: 400, status: 'COMPLETED', notes: 'Ankle rehab check' },
    { patientPhone: '9876543220', doctorIdx: 3, type: 'CONSULTATION', fee: 600, status: 'SCHEDULED', notes: 'Prenatal check-up' },
    { patientPhone: '9876543228', doctorIdx: 4, type: 'FOLLOW_UP', fee: 500, status: 'SCHEDULED', notes: 'BP monitoring' },
    { patientPhone: '9876543212', doctorIdx: 4, type: 'FOLLOW_UP', fee: 500, status: 'SCHEDULED', notes: 'Hypertension review' },
    { patientPhone: '9876543216', doctorIdx: 5, type: 'FOLLOW_UP', fee: 300, status: 'SCHEDULED', notes: 'Eczema follow-up' },
    { patientPhone: '9876543218', doctorIdx: 6, type: 'CONSULTATION', fee: 550, status: 'IN_PROGRESS', notes: 'Ear pain' },
    { patientPhone: '9876543226', doctorIdx: 7, type: 'CONSULTATION', fee: 600, status: 'SCHEDULED', notes: 'Vision check' },
    { patientPhone: '9876543218', doctorIdx: 8, type: 'FOLLOW_UP', fee: 600, status: 'SCHEDULED', notes: 'Headache follow-up' },
    { patientPhone: '9876543210', doctorIdx: 9, type: 'CONSULTATION', fee: 800, status: 'SCHEDULED', notes: 'Anxiety session' },
    // ── Batch 2 today appointments ──
    { patientPhone: '9876543230', doctorIdx: 4, type: 'FOLLOW_UP', fee: 500, status: 'SCHEDULED', notes: 'Cardiac follow-up' },
    { patientPhone: '9876543236', doctorIdx: 4, type: 'FOLLOW_UP', fee: 500, status: 'SCHEDULED', notes: 'CHF review' },
    { patientPhone: '9876543246', doctorIdx: 4, type: 'FOLLOW_UP', fee: 500, status: 'SCHEDULED', notes: 'Resistant HTN' },
    { patientPhone: '9876543250', doctorIdx: 0, type: 'FOLLOW_UP', fee: 300, status: 'SCHEDULED', notes: 'Diabetes review' },
    { patientPhone: '9876543242', doctorIdx: 7, type: 'SPECIALIST', fee: 650, status: 'SCHEDULED', notes: 'Pre-op drops check' },
    { patientPhone: '9876543260', doctorIdx: 0, type: 'FOLLOW_UP', fee: 300, status: 'IN_PROGRESS', notes: 'Weight management' },
    // ── Batch 3 today appointments ──
    { patientPhone: '9876543262', doctorIdx: 0, type: 'FOLLOW_UP', fee: 300, status: 'SCHEDULED', notes: 'Migraine follow-up' },
    { patientPhone: '9876543264', doctorIdx: 4, type: 'SPECIALIST', fee: 1000, status: 'SCHEDULED', notes: 'Pre-PCI assessment' },
    { patientPhone: '9876543268', doctorIdx: 8, type: 'FOLLOW_UP', fee: 600, status: 'IN_PROGRESS', notes: 'Stroke follow-up' },
    { patientPhone: '9876543270', doctorIdx: 9, type: 'FOLLOW_UP', fee: 400, status: 'SCHEDULED', notes: 'Depression review' },
    { patientPhone: '9876543272', doctorIdx: 7, type: 'FOLLOW_UP', fee: 300, status: 'SCHEDULED', notes: 'Glaucoma check' },
    { patientPhone: '9876543276', doctorIdx: 4, type: 'FOLLOW_UP', fee: 500, status: 'SCHEDULED', notes: 'BP recheck' },
    { patientPhone: '9876543280', doctorIdx: 3, type: 'FOLLOW_UP', fee: 500, status: 'SCHEDULED', notes: 'Fibroid review' },
    { patientPhone: '9876543286', doctorIdx: 0, type: 'FOLLOW_UP', fee: 300, status: 'SCHEDULED', notes: 'Thyroid recheck' },
    { patientPhone: '9876543288', doctorIdx: 3, type: 'FOLLOW_UP', fee: 300, status: 'SCHEDULED', notes: 'PCOD follow-up' },
    { patientPhone: '9876543290', doctorIdx: 2, type: 'FOLLOW_UP', fee: 400, status: 'COMPLETED', notes: 'Frozen shoulder check' },
  ];  for (let i = 0; i < todayAppts.length; i++) {
    const a = todayAppts[i];
    const patient = patientByPhone.get(a.patientPhone);
    if (!patient) continue;
    const doctor = doctorRows[a.doctorIdx];
    if (!doctor) continue;

    const date = utcDate(0, 9 + i, (i * 15) % 60);

    await prisma.appointment.create({
      data: {
        patientId: patient.id,
        doctorId: doctor.id,
        date,
        type: a.type,
        status: a.status,
        fee: a.fee,
        notes: a.notes,
      },
    });
    apptCount++;
  }

  console.log(`Seeded ${apptCount} appointments (${completedAppts.length} completed, ${upcomingAppts.length} upcoming, ${todayAppts.length} today).`);
}

// ─── Queue Entries ────────────────────────────────────────

async function seedQueueEntries(doctorRows: Doctor[]) {
  const existing = await prisma.queueEntry.count();
  if (existing > 0 && !FRESH) {
    console.log('Queue entries already seeded, skipping.');
    return;
  }
  const patients = await prisma.patient.findMany();
  if (patients.length === 0) return;
  const patientByPhone = new Map(patients.map((p) => [p.contactNo, p]));
  // Use UTC midnight to match the queue service's filter boundaries
  const today = new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), new Date().getUTCDate()));

  const queueData = [
    // Dr. Rajesh Sharma (idx 0) — General Medicine
    { patientPhone: '9876543210', doctorIdx: 0, token: 'T001', status: 'IN_PROGRESS' },
    { patientPhone: '9876543224', doctorIdx: 0, token: 'T002', status: 'WAITING' },
    // Dr. Sunita Verma (idx 1) — Pediatrics
    { patientPhone: '9876543214', doctorIdx: 1, token: 'T003', status: 'IN_PROGRESS' },
    // Dr. Vivek Mehta (idx 2) — Orthopedics
    { patientPhone: '9876543222', doctorIdx: 2, token: 'T004', status: 'COMPLETED' },
    // Dr. Lakshmi Iyer (idx 3) — Gynecology
    { patientPhone: '9876543220', doctorIdx: 3, token: 'T005', status: 'WAITING' },
    // Dr. Arun Singh (idx 4) — Cardiology
    { patientPhone: '9876543228', doctorIdx: 4, token: 'T006', status: 'WAITING' },
    { patientPhone: '9876543212', doctorIdx: 4, token: 'T007', status: 'WAITING' },
    // Dr. Priya Kapoor (idx 5) — Dermatology
    { patientPhone: '9876543216', doctorIdx: 5, token: 'T008', status: 'WAITING' },
    // Dr. Mohammed Farooq (idx 6) — ENT
    { patientPhone: '9876543218', doctorIdx: 6, token: 'T009', status: 'IN_PROGRESS' },
    // Dr. Deepa Nair (idx 7) — Ophthalmology
    { patientPhone: '9876543226', doctorIdx: 7, token: 'T010', status: 'WAITING' },
    // Dr. Sanjay Gupta (idx 8) — Neurology
    { patientPhone: '9876543218', doctorIdx: 8, token: 'T011', status: 'WAITING' },
    // Dr. Anjali Desai (idx 9) — Psychiatry
    { patientPhone: '9876543210', doctorIdx: 9, token: 'T012', status: 'WAITING' },
    // ── Batch 2 queue entries ──
    { patientPhone: '9876543230', doctorIdx: 4, token: 'T013', status: 'WAITING' },
    { patientPhone: '9876543236', doctorIdx: 4, token: 'T014', status: 'WAITING' },
    { patientPhone: '9876543246', doctorIdx: 4, token: 'T015', status: 'WAITING' },
    { patientPhone: '9876543250', doctorIdx: 0, token: 'T016', status: 'WAITING' },
    { patientPhone: '9876543242', doctorIdx: 7, token: 'T017', status: 'WAITING' },
    { patientPhone: '9876543260', doctorIdx: 0, token: 'T018', status: 'IN_PROGRESS' },
    { patientPhone: '9876543234', doctorIdx: 5, token: 'T019', status: 'WAITING' },
    { patientPhone: '9876543258', doctorIdx: 5, token: 'T020', status: 'WAITING' },
    { patientPhone: '9876543238', doctorIdx: 3, token: 'T021', status: 'WAITING' },
    { patientPhone: '9876543254', doctorIdx: 3, token: 'T022', status: 'WAITING' },
    { patientPhone: '9876543232', doctorIdx: 2, token: 'T023', status: 'WAITING' },
    { patientPhone: '9876543256', doctorIdx: 2, token: 'T024', status: 'COMPLETED' },
    { patientPhone: '9876543244', doctorIdx: 9, token: 'T025', status: 'WAITING' },
    { patientPhone: '9876543240', doctorIdx: 6, token: 'T026', status: 'WAITING' },
    // ── Batch 3 queue entries ──
    { patientPhone: '9876543262', doctorIdx: 0, token: 'T027', status: 'WAITING' },
    { patientPhone: '9876543268', doctorIdx: 8, token: 'T028', status: 'SEND_IN' },
    { patientPhone: '9876543270', doctorIdx: 9, token: 'T029', status: 'SEND_IN' },
    { patientPhone: '9876543272', doctorIdx: 7, token: 'T030', status: 'WAITING' },
    { patientPhone: '9876543274', doctorIdx: 6, token: 'T031', status: 'WAITING' },
    { patientPhone: '9876543276', doctorIdx: 4, token: 'T032', status: 'WAITING' },
    { patientPhone: '9876543278', doctorIdx: 2, token: 'T033', status: 'WAITING' },
    { patientPhone: '9876543280', doctorIdx: 3, token: 'T034', status: 'WAITING' },
    { patientPhone: '9876543282', doctorIdx: 0, token: 'T035', status: 'WAITING' },
    { patientPhone: '9876543284', doctorIdx: 1, token: 'T036', status: 'WAITING' },
    { patientPhone: '9876543286', doctorIdx: 0, token: 'T037', status: 'SEND_IN' },
    { patientPhone: '9876543288', doctorIdx: 3, token: 'T038', status: 'WAITING' },
    { patientPhone: '9876543290', doctorIdx: 2, token: 'T039', status: 'SKIPPED' },
    { patientPhone: '9876543266', doctorIdx: 3, token: 'T040', status: 'NO_SHOW' },
    { patientPhone: '9876543264', doctorIdx: 4, token: 'T041', status: 'SKIPPED' },
  ];

  let count = 0;
  for (const q of queueData) {
    const patient = patientByPhone.get(q.patientPhone);
    if (!patient) continue;
    const doctor = doctorRows[q.doctorIdx];
    if (!doctor) continue;

    await prisma.queueEntry.create({
      data: {
        patientId: patient.id,
        doctorId: doctor.id,
        tokenNumber: q.token,
        status: q.status,
        queueDate: today,
        checkedInAt: new Date(),
      },
    });
    count++;
  }
  console.log(`Seeded ${count} queue entries for today.`);
}

// ─── Bills ────────────────────────────────────────────────

async function seedBills() {
  const existing = await prisma.bill.count();
  if (existing > 0 && !FRESH) {
    console.log('Bills already seeded, skipping.');
    return;
  }
  const patients = await prisma.patient.findMany();
  const appointments = await prisma.appointment.findMany({ where: { status: 'COMPLETED' } });
  if (patients.length === 0 || appointments.length === 0) return;
  const patientById = new Map(patients.map((p) => [p.id, p]));

  let invoiceCounter = 1000;
  let billCount = 0;

  // Create bills for a subset of completed appointments
  const billsToCreate = appointments.slice(0, Math.min(15, appointments.length));
  for (const appt of billsToCreate) {
    const patient = patientById.get(appt.patientId);
    if (!patient) continue;
    const invoiceNo = `INV-${String(invoiceCounter++).padStart(5, '0')}`;
    const consultationFee = appt.fee || 500;
    const registrationFee = appt.registrationFee || 0;
    const medicineFee = Math.floor(Math.random() * 300) + 50;
    const labFee = Math.random() > 0.5 ? Math.floor(Math.random() * 500) + 200 : 0;
    const subtotal = consultationFee + registrationFee + medicineFee + labFee;
    const discount = Math.random() > 0.7 ? Math.floor(subtotal * 0.1) : 0;
    const tax = Math.floor((subtotal - discount) * 0.18);
    const total = subtotal - discount + tax;
    const paymentMethods = ['CASH', 'CARD', 'UPI', 'INSURANCE'];
    const paymentMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];
    const statuses = ['PAID', 'PAID', 'PAID', 'PENDING'];
    const status = statuses[Math.floor(Math.random() * statuses.length)];

    const bill = await prisma.bill.create({
      data: {
        patientId: patient.id,
        appointmentId: appt.id,
        invoiceNo,
        subtotal,
        discount,
        tax,
        total,
        paymentMethod,
        status,
        notes: `Bill for appointment on ${appt.date.toISOString().split('T')[0]}`,
      },
    });

    // Add bill items
    const items: { itemType: string; itemName: string; quantity: number; unitPrice: number; amount: number }[] = [];
    if (consultationFee > 0) items.push({ itemType: 'consultation', itemName: 'Consultation Fee', quantity: 1, unitPrice: consultationFee, amount: consultationFee });
    if (registrationFee > 0) items.push({ itemType: 'registration', itemName: 'Registration Fee', quantity: 1, unitPrice: registrationFee, amount: registrationFee });
    if (medicineFee > 0) items.push({ itemType: 'medicine', itemName: 'Medicines', quantity: Math.ceil(medicineFee / 50), unitPrice: 50, amount: medicineFee });
    if (labFee > 0) items.push({ itemType: 'lab', itemName: 'Lab Tests', quantity: 1, unitPrice: labFee, amount: labFee });

    await prisma.billItem.createMany({
      data: items.map((item) => ({ ...item, billId: bill.id })),
    });
    billCount++;
  }
  console.log(`Seeded ${billCount} bills with items.`);
}

// ─── Lab / Radiology / Procedure Orders ───────────────────

async function seedOrders(doctorRows: Doctor[]) {
  const existingLab = await prisma.labOrder.count();
  if (existingLab > 0 && !FRESH) {
    console.log('Orders already seeded, skipping.');
    return;
  }
  const patients = await prisma.patient.findMany();
  if (patients.length === 0) return;
  const patientByPhone = new Map(patients.map((p) => [p.contactNo, p]));

  const labOrders = [
    { patientPhone: '9876543210', doctorIdx: 4, testName: 'Complete Blood Count (CBC)', category: 'Hematology', status: 'COMPLETED', result: 'WNL — All parameters within normal limits', daysAgo: 3 },
    { patientPhone: '9876543210', doctorIdx: 4, testName: 'Lipid Profile', category: 'Biochemistry', status: 'ORDERED', daysAgo: 0 },
    { patientPhone: '9876543212', doctorIdx: 4, testName: 'HbA1c', category: 'Biochemistry', status: 'COMPLETED', result: '7.2% — Above target', daysAgo: 5 },
    { patientPhone: '9876543212', doctorIdx: 4, testName: 'Renal Function Test', category: 'Biochemistry', status: 'ORDERED', daysAgo: 0 },
    { patientPhone: '9876543214', doctorIdx: 1, testName: 'Complete Blood Count (CBC)', category: 'Hematology', status: 'COMPLETED', result: 'Normal for age', daysAgo: 12 },
    { patientPhone: '9876543216', doctorIdx: 3, testName: 'Pregnancy Test (Urine)', category: 'Immunology', status: 'COMPLETED', result: 'Negative', daysAgo: 8 },
    { patientPhone: '9876543218', doctorIdx: 8, testName: 'Thyroid Profile (TSH, T3, T4)', category: 'Endocrinology', status: 'COMPLETED', result: 'TSH 4.5 — Mildly elevated', daysAgo: 10 },
    { patientPhone: '9876543218', doctorIdx: 8, testName: 'Vitamin B12 Level', category: 'Biochemistry', status: 'ORDERED', daysAgo: 0 },
    { patientPhone: '9876543220', doctorIdx: 3, testName: 'Complete Blood Count (CBC)', category: 'Hematology', status: 'COMPLETED', result: 'Hb 10.2 — Mild anemia', daysAgo: 5 },
    { patientPhone: '9876543222', doctorIdx: 2, testName: 'X-Ray Ankle AP/Lateral', category: 'Radiology', status: 'COMPLETED', result: 'No fracture. Soft tissue swelling noted.', daysAgo: 20 },
    { patientPhone: '9876543224', doctorIdx: 0, testName: 'Fasting Blood Sugar', category: 'Biochemistry', status: 'COMPLETED', result: '126 mg/dL — Diabetic range', daysAgo: 30 },
    { patientPhone: '9876543224', doctorIdx: 0, testName: 'HbA1c', category: 'Biochemistry', status: 'ORDERED', daysAgo: 0 },
    { patientPhone: '9876543228', doctorIdx: 4, testName: 'ECG', category: 'Cardiology', status: 'COMPLETED', result: 'Sinus rhythm. No acute changes.', daysAgo: 15 },
    { patientPhone: '9876543228', doctorIdx: 4, testName: 'Echocardiography', category: 'Cardiology', status: 'ORDERED', daysAgo: 0 },
    // ── Batch 2 lab orders ──
    { patientPhone: '9876543230', doctorIdx: 4, testName: 'Lipid Profile', category: 'Biochemistry', status: 'COMPLETED', result: 'Total Chol 280 — High. LDL 180.', daysAgo: 35 },
    { patientPhone: '9876543230', doctorIdx: 4, testName: 'Cardiac Enzymes (Troponin)', category: 'Cardiology', status: 'COMPLETED', result: 'Negative — ruled out ACS', daysAgo: 35 },
    { patientPhone: '9876543230', doctorIdx: 4, testName: 'Thyroid Profile', category: 'Endocrinology', status: 'ORDERED', daysAgo: 0 },
    { patientPhone: '9876543232', doctorIdx: 2, testName: 'X-Ray Lumbar Spine AP/Lateral', category: 'Radiology', status: 'COMPLETED', result: 'L4-L5 disc space narrowing. Osteophytes.', daysAgo: 55 },
    { patientPhone: '9876543232', doctorIdx: 0, testName: 'HbA1c', category: 'Biochemistry', status: 'COMPLETED', result: '6.8% — Prediabetic range', daysAgo: 5 },
    { patientPhone: '9876543236', doctorIdx: 4, testName: 'ECG', category: 'Cardiology', status: 'COMPLETED', result: 'Sinus tachycardia. ST depression V4-V6.', daysAgo: 48 },
    { patientPhone: '9876543236', doctorIdx: 4, testName: 'Echocardiography', category: 'Cardiology', status: 'COMPLETED', result: 'EF 40%. Mild LV dilatation.', daysAgo: 45 },
    { patientPhone: '9876543236', doctorIdx: 0, testName: 'HbA1c', category: 'Biochemistry', status: 'COMPLETED', result: '8.1% — Poor control', daysAgo: 2 },
    { patientPhone: '9876543238', doctorIdx: 3, testName: 'CBC', category: 'Hematology', status: 'COMPLETED', result: 'Normal. Hb 11.8.', daysAgo: 28 },
    { patientPhone: '9876543238', doctorIdx: 3, testName: 'Blood Group & Crossmatch', category: 'Hematology', status: 'ORDERED', daysAgo: 0 },
    { patientPhone: '9876543240', doctorIdx: 6, testName: 'CT PNS', category: 'Radiology', status: 'COMPLETED', result: 'Mild pansinusitis. No polyp.', daysAgo: 1 },
    { patientPhone: '9876543242', doctorIdx: 7, testName: 'Slit Lamp Examination', category: 'Ophthalmology', status: 'COMPLETED', result: 'Grade 2 NS OU. No other pathology.', daysAgo: 42 },
    { patientPhone: '9876543246', doctorIdx: 4, testName: 'Renal Function Test', category: 'Biochemistry', status: 'COMPLETED', result: 'Cr 1.2. K+ 4.8 — monitor.', daysAgo: 8 },
    { patientPhone: '9876543246', doctorIdx: 4, testName: 'ECG', category: 'Cardiology', status: 'COMPLETED', result: 'LVH. No acute changes.', daysAgo: 8 },
    { patientPhone: '9876543250', doctorIdx: 0, testName: 'Fasting Blood Sugar', category: 'Biochemistry', status: 'COMPLETED', result: '142 mg/dL — Diabetic', daysAgo: 28 },
    { patientPhone: '9876543250', doctorIdx: 0, testName: 'Lipid Profile', category: 'Biochemistry', status: 'ORDERED', daysAgo: 0 },
    { patientPhone: '9876543252', doctorIdx: 0, testName: 'CBC', category: 'Hematology', status: 'COMPLETED', result: 'WBC elevated — 14000. Viral.', daysAgo: 18 },
    { patientPhone: '9876543254', doctorIdx: 3, testName: 'USG Pelvis', category: 'Radiology', status: 'COMPLETED', result: 'Bilateral PCOM. Thickened endometrium.', daysAgo: 8 },
    { patientPhone: '9876543256', doctorIdx: 2, testName: 'X-Ray Knee AP/Oblique', category: 'Radiology', status: 'COMPLETED', result: 'Grade 3 OA medial compartment. Joint space narrowed.', daysAgo: 22 },
    { patientPhone: '9876543260', doctorIdx: 0, testName: 'Fasting Blood Sugar', category: 'Biochemistry', status: 'COMPLETED', result: '98 mg/dL — Normal', daysAgo: 40 },
    { patientPhone: '9876543260', doctorIdx: 0, testName: 'Lipid Profile', category: 'Biochemistry', status: 'COMPLETED', result: 'Total Chol 240. LDL 155.', daysAgo: 40 },
    // ── Batch 3 lab orders ──
    { patientPhone: '9876543262', doctorIdx: 0, testName: 'Thyroid Profile', category: 'Endocrinology', status: 'COMPLETED', result: 'Normal. TSH 2.1.', daysAgo: 45 },
    { patientPhone: '9876543264', doctorIdx: 4, testName: 'Coronary Angiography', category: 'Cardiology', status: 'COMPLETED', result: '60% LAD. 40% RCA. No intervention needed.', daysAgo: 4 },
    { patientPhone: '9876543264', doctorIdx: 4, testName: 'Lipid Profile', category: 'Biochemistry', status: 'COMPLETED', result: 'Total Chol 320. LDL 210. High risk.', daysAgo: 55 },
    { patientPhone: '9876543264', doctorIdx: 4, testName: 'CBC', category: 'Hematology', status: 'COMPLETED', result: 'Normal.', daysAgo: 4 },
    { patientPhone: '9876543266', doctorIdx: 3, testName: 'Hemoglobin', category: 'Hematology', status: 'COMPLETED', result: 'Hb 10.5 — Mild anemia.', daysAgo: 16 },
    { patientPhone: '9876543268', doctorIdx: 8, testName: 'MRI Brain', category: 'Neurology', status: 'COMPLETED', result: 'Multiple lacunar infarcts in basal ganglia.', daysAgo: 10 },
    { patientPhone: '9876543268', doctorIdx: 8, testName: 'Carotid Doppler', category: 'Neurology', status: 'ORDERED', daysAgo: 0 },
    { patientPhone: '9876543270', doctorIdx: 9, testName: 'Thyroid Profile', category: 'Endocrinology', status: 'COMPLETED', result: 'Normal.', daysAgo: 20 },
    { patientPhone: '9876543272', doctorIdx: 7, testName: 'IOP Measurement', category: 'Ophthalmology', status: 'COMPLETED', result: 'Right 22mmHg, Left 20mmHg — elevated.', daysAgo: 38 },
    { patientPhone: '9876543272', doctorIdx: 7, testName: 'Visual Field Test', category: 'Ophthalmology', status: 'ORDERED', daysAgo: 0 },
    { patientPhone: '9876543276', doctorIdx: 4, testName: 'ECG', category: 'Cardiology', status: 'COMPLETED', result: 'LVH. ST changes. Strain pattern.', daysAgo: 52 },
    { patientPhone: '9876543278', doctorIdx: 2, testName: 'MRI Knee', category: 'Orthopedics', status: 'COMPLETED', result: 'ACL tear confirmed. Meniscus intact.', daysAgo: 10 },
    { patientPhone: '9876543280', doctorIdx: 3, testName: 'USG Pelvis', category: 'Gynecology', status: 'COMPLETED', result: 'Multiple fibroids — largest 4cm submucosal.', daysAgo: 32 },
    { patientPhone: '9876543282', doctorIdx: 0, testName: 'H. Pylori Test', category: 'Gastroenterology', status: 'COMPLETED', result: 'Positive — triple therapy recommended.', daysAgo: 28 },
    { patientPhone: '9876543286', doctorIdx: 0, testName: 'Thyroid Profile', category: 'Endocrinology', status: 'COMPLETED', result: 'TSH 8.2 — Elevated. Hypothyroid.', daysAgo: 32 },
    { patientPhone: '9876543288', doctorIdx: 3, testName: 'USG Pelvis', category: 'Gynecology', status: 'COMPLETED', result: 'Bilateral PCOM. No fibroids.', daysAgo: 18 },
    { patientPhone: '9876543290', doctorIdx: 2, testName: 'X-Ray Shoulder', category: 'Orthopedics', status: 'COMPLETED', result: 'Frozen shoulder — reduced joint space.', daysAgo: 48 },
  ];

  let labCount = 0;
  for (const lo of labOrders) {
    const patient = patientByPhone.get(lo.patientPhone);
    if (!patient) continue;
    const doctor = doctorRows[lo.doctorIdx];
    if (!doctor) continue;
    await prisma.labOrder.create({
      data: {
        patientId: patient.id,
        doctorId: doctor.id,
        testName: lo.testName,
        category: lo.category,
        status: lo.status,
        result: lo.result ?? null,
        resultDate: lo.result ? new Date(Date.now() - lo.daysAgo * DAY) : null,
        createdAt: new Date(Date.now() - lo.daysAgo * DAY),
      },
    });
    labCount++;
  }

  const radiologyOrders = [
    { patientPhone: '9876543210', doctorIdx: 4, studyName: 'Chest X-Ray PA View', category: 'Radiology', status: 'COMPLETED', result: 'Normal chest radiograph. No active pathology.', daysAgo: 3 },
    { patientPhone: '9876543218', doctorIdx: 8, studyName: 'MRI Brain with Contrast', category: 'Neurology', status: 'COMPLETED', result: 'No intracranial mass, bleed, or significant abnormality.', daysAgo: 10 },
    { patientPhone: '9876543222', doctorIdx: 2, studyName: 'X-Ray Ankle AP/Lateral', category: 'Orthopedics', status: 'COMPLETED', result: 'No fracture. Mild soft tissue swelling.', daysAgo: 20 },
    { patientPhone: '9876543228', doctorIdx: 4, studyName: 'Chest X-Ray PA View', category: 'Cardiology', status: 'ORDERED', daysAgo: 0 },
    // ── Batch 2 radiology orders ──
    { patientPhone: '9876543230', doctorIdx: 4, studyName: 'Treadmill Test', category: 'Cardiology', status: 'COMPLETED', result: 'Positive for ischemia at 8 min. ST depression 2mm inferior leads.', daysAgo: 30 },
    { patientPhone: '9876543236', doctorIdx: 4, studyName: 'Chest X-Ray PA View', category: 'Cardiology', status: 'COMPLETED', result: 'Cardiomegaly. Bilateral pleural effusion.', daysAgo: 45 },
    { patientPhone: '9876543242', doctorIdx: 7, studyName: 'B-Scan Ultrasound Eye', category: 'Ophthalmology', status: 'COMPLETED', result: 'Dense cataract. No retinal detachment.', daysAgo: 40 },
    { patientPhone: '9876543256', doctorIdx: 2, studyName: 'MRI Knee', category: 'Orthopedics', status: 'ORDERED', daysAgo: 0 },
    // ── Batch 3 radiology orders ──
    { patientPhone: '9876543264', doctorIdx: 4, studyName: 'Coronary Angiography', category: 'Cardiology', status: 'COMPLETED', result: '60% LAD. 40% RCA.', daysAgo: 4 },
    { patientPhone: '9876543278', doctorIdx: 2, studyName: 'MRI Knee', category: 'Orthopedics', status: 'COMPLETED', result: 'ACL tear confirmed.', daysAgo: 10 },
    { patientPhone: '9876543290', doctorIdx: 2, studyName: 'X-Ray Shoulder AP/Lateral', category: 'Orthopedics', status: 'COMPLETED', result: 'Frozen shoulder. Reduced joint space.', daysAgo: 48 },
  ];

  let radioCount = 0;
  for (const ro of radiologyOrders) {
    const patient = patientByPhone.get(ro.patientPhone);
    if (!patient) continue;
    const doctor = doctorRows[ro.doctorIdx];
    if (!doctor) continue;
    await prisma.radiologyOrder.create({
      data: {
        patientId: patient.id,
        doctorId: doctor.id,
        studyName: ro.studyName,
        category: ro.category,
        status: ro.status,
        result: ro.result ?? null,
        resultDate: ro.result ? new Date(Date.now() - ro.daysAgo * DAY) : null,
        createdAt: new Date(Date.now() - ro.daysAgo * DAY),
      },
    });
    radioCount++;
  }

  const procedureOrders = [
    { patientPhone: '9876543210', doctorIdx: 4, procedureName: 'Treadmill Test (TMT)', category: 'Cardiology', status: 'COMPLETED', result: 'Normal exercise tolerance. No ST changes.', daysAgo: 2 },
    { patientPhone: '9876543216', doctorIdx: 3, procedureName: 'Pap Smear', category: 'Gynecology', status: 'COMPLETED', result: 'Normal — No dysplasia', daysAgo: 8 },
    { patientPhone: '9876543222', doctorIdx: 2, procedureName: 'Physiotherapy Session', category: 'Rehabilitation', status: 'ORDERED', daysAgo: 0 },
    // ── Batch 2 procedure orders ──
    { patientPhone: '9876543230', doctorIdx: 4, procedureName: 'Coronary Angiography', category: 'Cardiology', status: 'ORDERED', daysAgo: 0 },
    { patientPhone: '9876543232', doctorIdx: 2, procedureName: 'Physiotherapy — Lumbar', category: 'Rehabilitation', status: 'COMPLETED', result: '6 sessions completed. Mild improvement.', daysAgo: 15 },
    { patientPhone: '9876543238', doctorIdx: 3, procedureName: 'Anomaly Scan (18-22 weeks)', category: 'Gynecology', status: 'ORDERED', daysAgo: 0 },
    { patientPhone: '9876543242', doctorIdx: 7, procedureName: 'Phacoemulsification + IOL', category: 'Ophthalmology', status: 'ORDERED', daysAgo: 0 },
    { patientPhone: '9876543256', doctorIdx: 2, procedureName: 'Intra-articular Injection', category: 'Orthopedics', status: 'COMPLETED', result: 'Hyaluronic acid injected. No complications.', daysAgo: 4 },
    { patientPhone: '9876543260', doctorIdx: 0, procedureName: 'Body Composition Analysis', category: 'General', status: 'COMPLETED', result: 'BMI 28.4. Body fat 32%. Lean mass 62kg.', daysAgo: 38 },
    // ── Batch 3 procedure orders ──
    { patientPhone: '9876543264', doctorIdx: 4, procedureName: 'PTCA + Stenting', category: 'Cardiology', status: 'ORDERED', daysAgo: 0 },
    { patientPhone: '9876543278', doctorIdx: 2, procedureName: 'ACL Reconstruction', category: 'Orthopedics', status: 'ORDERED', daysAgo: 0 },
    { patientPhone: '9876543290', doctorIdx: 2, procedureName: 'Hydrodilatation', category: 'Orthopedics', status: 'COMPLETED', result: 'Shoulder range improved post-procedure.', daysAgo: 15 },
    { patientPhone: '9876543272', doctorIdx: 7, procedureName: 'Laser Trabeculoplasty', category: 'Ophthalmology', status: 'ORDERED', daysAgo: 0 },
  ];

  let procCount = 0;
  for (const po of procedureOrders) {
    const patient = patientByPhone.get(po.patientPhone);
    if (!patient) continue;
    const doctor = doctorRows[po.doctorIdx];
    if (!doctor) continue;
    await prisma.procedureOrder.create({
      data: {
        patientId: patient.id,
        doctorId: doctor.id,
        procedureName: po.procedureName,
        category: po.category,
        status: po.status,
        result: po.result ?? null,
        resultDate: po.result ? new Date(Date.now() - po.daysAgo * DAY) : null,
        createdAt: new Date(Date.now() - po.daysAgo * DAY),
      },
    });
    procCount++;
  }

  console.log(`Seeded ${labCount} lab orders, ${radioCount} radiology orders, ${procCount} procedure orders.`);
}

// ─── Dispensing Records ───────────────────────────────────

async function seedDispensing() {
  const existing = await prisma.dispensing.count();
  if (existing > 0 && !FRESH) {
    console.log('Dispensing records already seeded, skipping.');
    return;
  }
  const dispensedPrescriptions = await prisma.prescription.findMany({
    where: { status: 'DISPENSED' },
    include: { items: true },
  });
  if (dispensedPrescriptions.length === 0) return;

  let count = 0;
  for (const rx of dispensedPrescriptions) {
    for (const item of rx.items) {
      const batchNo = `BATCH-${String(Math.floor(Math.random() * 9000) + 1000)}`;
      const expiryDate = new Date(Date.now() + Math.floor(Math.random() * 365 + 90) * 24 * 60 * 60 * 1000);
      await prisma.dispensing.create({
        data: {
          prescriptionId: rx.id,
          medicineId: item.medicineId,
          medicineName: item.medicineName,
          quantity: item.quantity,
          batchNo,
          expiryDate,
          dispensedAt: rx.createdAt,
          dispensedBy: 'Pharmacy',
        },
      });
      count++;
    }
  }
  console.log(`Seeded ${count} dispensing records for ${dispensedPrescriptions.length} dispensed prescriptions.`);
}

// ─── Patient Allergies & Allergy Records ──────────────────

async function seedPatientAllergies() {
  const existing = await prisma.patientAllergy.count();
  if (existing > 0 && !FRESH) {
    console.log('Patient allergies already seeded, skipping.');
    return;
  }
  const patients = await prisma.patient.findMany();
  const allergyCatalog = await prisma.allergy.findMany();
  if (patients.length === 0 || allergyCatalog.length === 0) return;
  const allergyByName = new Map(allergyCatalog.map((a) => [a.name, a]));
  const patientByPhone = new Map(patients.map((p) => [p.contactNo, p]));

  // Link patients to their catalog allergies via PatientAllergy
  const allergyLinks = [
    { patientPhone: '9876543210', allergyNames: ['Pollen', 'Dust'], notes: 'Seasonal — worse in monsoon' },
    { patientPhone: '9876543212', allergyNames: ['Aspirin', 'Penicillin'], notes: 'Severe reaction to penicillin — anaphylaxis history' },
    { patientPhone: '9876543214', allergyNames: ['Milk', 'Eggs'], notes: 'Pediatric food allergy — improving with age' },
    { patientPhone: '9876543216', allergyNames: ['Sulfa', 'Dust'], notes: 'Sulfa rash — confirmed on challenge' },
    { patientPhone: '9876543218', allergyNames: ['Codeine'], notes: 'Nausea and vomiting with codeine' },
    { patientPhone: '9876543220', allergyNames: ['Peanuts', 'Shellfish'], notes: 'Peanut allergy — carry EpiPen' },
    { patientPhone: '9876543222', allergyNames: ['Bee Sting', 'Latex'], notes: 'Bee sting — anaphylaxis. Latex — contact urticaria.' },
    { patientPhone: '9876543224', allergyNames: ['Soy', 'Wheat'], notes: 'Gluten sensitivity confirmed' },
    { patientPhone: '9876543228', allergyNames: ['Iodine'], notes: 'Contrast dye allergy — premedicate if needed' },
    // ── Batch 2 allergy links ──
    { patientPhone: '9876543230', allergyNames: ['Penicillin', 'Sulfa'], notes: 'Penicillin — anaphylaxis history. Sulfa — rash.' },
    { patientPhone: '9876543232', allergyNames: ['Aspirin'], notes: 'Aspirin-induced bronchospasm' },
    { patientPhone: '9876543234', allergyNames: ['Ibuprofen'], notes: 'GI upset with NSAIDs' },
    { patientPhone: '9876543236', allergyNames: ['Latex'], notes: 'Contact dermatitis with latex gloves' },
    { patientPhone: '9876543240', allergyNames: ['Pollen'], notes: 'Severe seasonal allergies' },
    { patientPhone: '9876543242', allergyNames: ['Iodine'], notes: 'Flushing with contrast dye' },
    { patientPhone: '9876543246', allergyNames: ['Shellfish'], notes: 'Hives and cramps with shellfish' },
    { patientPhone: '9876543248', allergyNames: ['Codeine'], notes: 'Severe nausea with codeine' },
    { patientPhone: '9876543250', allergyNames: ['Milk', 'Soy'], notes: 'Dairy and soy intolerance' },
    { patientPhone: '9876543252', allergyNames: ['Dust', 'Pollen'], notes: 'Environmental allergies — dust and pollen' },
    { patientPhone: '9876543256', allergyNames: ['Peanuts'], notes: 'Peanut allergy — carry EpiPen' },
    { patientPhone: '9876543258', allergyNames: ['Eggs', 'Wheat'], notes: 'Egg and wheat sensitivity' },
    { patientPhone: '9876543260', allergyNames: ['Bee Sting'], notes: 'Severe reaction to bee stings' },
    // ── Batch 3 allergy links ──
    { patientPhone: '9876543262', allergyNames: ['Codeine', 'Ibuprofen'], notes: 'Codeine — nausea. Ibuprofen — GI bleeding.' },
    { patientPhone: '9876543264', allergyNames: ['Aspirin', 'Latex'], notes: 'Aspirin — bronchospasm. Latex — contact dermatitis.' },
    { patientPhone: '9876543266', allergyNames: ['Shellfish'], notes: 'Hives with shellfish' },
    { patientPhone: '9876543268', allergyNames: ['Peanuts'], notes: 'Anaphylaxis risk' },
    { patientPhone: '9876543270', allergyNames: ['Sulfa', 'Pollen'], notes: 'Sulfa — rash. Pollen — seasonal.' },
    { patientPhone: '9876543274', allergyNames: ['Dust', 'Milk'], notes: 'Dust — cough. Milk — bloating.' },
    { patientPhone: '9876543276', allergyNames: ['Penicillin', 'Eggs'], notes: 'Penicillin — anaphylaxis history. Eggs — urticaria.' },
    { patientPhone: '9876543278', allergyNames: ['Latex'], notes: 'Contact urticaria' },
    { patientPhone: '9876543286', allergyNames: ['Penicillin'], notes: 'Rash with penicillin' },
    { patientPhone: '9876543290', allergyNames: ['Aspirin', 'Codeine'], notes: 'Aspirin — GI upset. Codeine — nausea.' },
  ];

  let count = 0;
  for (const link of allergyLinks) {
    const patient = patientByPhone.get(link.patientPhone);
    if (!patient) continue;
    for (const allergyName of link.allergyNames) {
      const allergy = allergyByName.get(allergyName);
      if (!allergy) continue;
      await prisma.patientAllergy.create({
        data: {
          patientId: patient.id,
          allergyId: allergy.id,
          notes: link.notes,
        },
      });
      count++;
    }
  }
  console.log(`Seeded ${count} patient allergy links.`);

  // PatientAllergyRecord — detailed records
  const existingRecords = await prisma.patientAllergyRecord.count();
  if (existingRecords > 0) return;

  const allergyRecords = [
    { patientPhone: '9876543210', allergen: 'Pollen', allergyType: 'ENVIRONMENTAL', reaction: 'Sneezing, watery eyes, nasal congestion', severity: 'MILD', status: 'ACTIVE' },
    { patientPhone: '9876543210', allergen: 'Dust', allergyType: 'ENVIRONMENTAL', reaction: 'Coughing, throat irritation', severity: 'MILD', status: 'ACTIVE' },
    { patientPhone: '9876543212', allergen: 'Penicillin', allergyType: 'DRUG', reaction: 'Anaphylaxis — hives, swelling, difficulty breathing', severity: 'LIFE_THREATENING', status: 'ACTIVE' },
    { patientPhone: '9876543212', allergen: 'Aspirin', allergyType: 'DRUG', reaction: 'Urticaria, bronchospasm', severity: 'SEVERE', status: 'ACTIVE' },
    { patientPhone: '9876543214', allergen: 'Milk', allergyType: 'FOOD', reaction: 'Diaper rash, loose stools', severity: 'MODERATE', status: 'ACTIVE' },
    { patientPhone: '9876543214', allergen: 'Eggs', allergyType: 'FOOD', reaction: 'Skin rash, mild vomiting', severity: 'MODERATE', status: 'ACTIVE' },
    { patientPhone: '9876543216', allergen: 'Sulfa', allergyType: 'DRUG', reaction: 'Maculopapular rash, fever', severity: 'MODERATE', status: 'ACTIVE' },
    { patientPhone: '9876543218', allergen: 'Codeine', allergyType: 'DRUG', reaction: 'Nausea, vomiting, dizziness', severity: 'MODERATE', status: 'ACTIVE' },
    { patientPhone: '9876543220', allergen: 'Peanuts', allergyType: 'FOOD', reaction: 'Throat tightness, urticaria, vomiting', severity: 'SEVERE', status: 'ACTIVE' },
    { patientPhone: '9876543220', allergen: 'Shellfish', allergyType: 'FOOD', reaction: 'Hives, facial swelling', severity: 'SEVERE', status: 'ACTIVE' },
    { patientPhone: '9876543222', allergen: 'Bee Sting', allergyType: 'ENVIRONMENTAL', reaction: 'Anaphylaxis — hypotension, airway edema', severity: 'LIFE_THREATENING', status: 'ACTIVE' },
    { patientPhone: '9876543222', allergen: 'Latex', allergyType: 'ENVIRONMENTAL', reaction: 'Contact urticaria, itching', severity: 'MODERATE', status: 'ACTIVE' },
    { patientPhone: '9876543224', allergen: 'Soy', allergyType: 'FOOD', reaction: 'Bloating, abdominal discomfort', severity: 'MILD', status: 'ACTIVE' },
    { patientPhone: '9876543224', allergen: 'Wheat', allergyType: 'FOOD', reaction: 'Abdominal pain, diarrhea', severity: 'MODERATE', status: 'ACTIVE' },
    { patientPhone: '9876543228', allergen: 'Iodine', allergyType: 'DRUG', reaction: 'Urticaria, flushing with contrast dye', severity: 'MODERATE', status: 'ACTIVE' },
    // ── Batch 2 allergy records ──
    { patientPhone: '9876543230', allergen: 'Penicillin', allergyType: 'DRUG', reaction: 'Hives, facial swelling', severity: 'SEVERE', status: 'ACTIVE' },
    { patientPhone: '9876543230', allergen: 'Sulfa', allergyType: 'DRUG', reaction: 'Maculopapular rash', severity: 'MODERATE', status: 'ACTIVE' },
    { patientPhone: '9876543232', allergen: 'Aspirin', allergyType: 'DRUG', reaction: 'Bronchospasm, wheezing', severity: 'SEVERE', status: 'ACTIVE' },
    { patientPhone: '9876543234', allergen: 'Ibuprofen', allergyType: 'DRUG', reaction: 'GI upset, mild rash', severity: 'MILD', status: 'ACTIVE' },
    { patientPhone: '9876543236', allergen: 'Latex', allergyType: 'ENVIRONMENTAL', reaction: 'Contact dermatitis', severity: 'MODERATE', status: 'ACTIVE' },
    { patientPhone: '9876543240', allergen: 'Pollen', allergyType: 'ENVIRONMENTAL', reaction: 'Severe rhinitis, eye itching', severity: 'MODERATE', status: 'ACTIVE' },
    { patientPhone: '9876543242', allergen: 'Iodine', allergyType: 'DRUG', reaction: 'Flushing with povidone', severity: 'MODERATE', status: 'ACTIVE' },
    { patientPhone: '9876543246', allergen: 'Shellfish', allergyType: 'FOOD', reaction: 'Hives, abdominal cramps', severity: 'SEVERE', status: 'ACTIVE' },
    { patientPhone: '9876543248', allergen: 'Codeine', allergyType: 'DRUG', reaction: 'Severe nausea, vomiting', severity: 'MODERATE', status: 'ACTIVE' },
    { patientPhone: '9876543250', allergen: 'Milk', allergyType: 'FOOD', reaction: 'Diarrhea, bloating', severity: 'MILD', status: 'ACTIVE' },
    { patientPhone: '9876543250', allergen: 'Soy', allergyType: 'FOOD', reaction: 'Abdominal discomfort', severity: 'MILD', status: 'ACTIVE' },
    { patientPhone: '9876543252', allergen: 'Dust', allergyType: 'ENVIRONMENTAL', reaction: 'Coughing, sneezing', severity: 'MODERATE', status: 'ACTIVE' },
    { patientPhone: '9876543252', allergen: 'Pollen', allergyType: 'ENVIRONMENTAL', reaction: 'Seasonal rhinitis', severity: 'MILD', status: 'ACTIVE' },
    { patientPhone: '9876543256', allergen: 'Peanuts', allergyType: 'FOOD', reaction: 'Throat tightness, urticaria', severity: 'SEVERE', status: 'ACTIVE' },
    { patientPhone: '9876543258', allergen: 'Eggs', allergyType: 'FOOD', reaction: 'Skin rash, eczema flare', severity: 'MODERATE', status: 'ACTIVE' },
    { patientPhone: '9876543258', allergen: 'Wheat', allergyType: 'FOOD', reaction: 'Abdominal pain, diarrhea', severity: 'MODERATE', status: 'ACTIVE' },
    { patientPhone: '9876543260', allergen: 'Bee Sting', allergyType: 'ENVIRONMENTAL', reaction: 'Swelling, pain at sting site', severity: 'SEVERE', status: 'ACTIVE' },
    // ── Batch 3 allergy records ──
    { patientPhone: '9876543262', allergen: 'Codeine', allergyType: 'DRUG', reaction: 'Severe nausea and headache', severity: 'MODERATE', status: 'ACTIVE' },
    { patientPhone: '9876543262', allergen: 'Ibuprofen', allergyType: 'DRUG', reaction: 'GI bleeding history', severity: 'SEVERE', status: 'ACTIVE' },
    { patientPhone: '9876543264', allergen: 'Aspirin', allergyType: 'DRUG', reaction: 'Bronchospasm', severity: 'SEVERE', status: 'ACTIVE' },
    { patientPhone: '9876543264', allergen: 'Latex', allergyType: 'ENVIRONMENTAL', reaction: 'Contact dermatitis', severity: 'MODERATE', status: 'ACTIVE' },
    { patientPhone: '9876543266', allergen: 'Shellfish', allergyType: 'FOOD', reaction: 'Hives, facial swelling', severity: 'SEVERE', status: 'ACTIVE' },
    { patientPhone: '9876543268', allergen: 'Peanuts', allergyType: 'FOOD', reaction: 'Throat tightness', severity: 'SEVERE', status: 'ACTIVE' },
    { patientPhone: '9876543270', allergen: 'Sulfa', allergyType: 'DRUG', reaction: 'Skin rash', severity: 'MODERATE', status: 'ACTIVE' },
    { patientPhone: '9876543270', allergen: 'Pollen', allergyType: 'ENVIRONMENTAL', reaction: 'Seasonal rhinitis', severity: 'MILD', status: 'ACTIVE' },
    { patientPhone: '9876543274', allergen: 'Dust', allergyType: 'ENVIRONMENTAL', reaction: 'Coughing', severity: 'MILD', status: 'ACTIVE' },
    { patientPhone: '9876543274', allergen: 'Milk', allergyType: 'FOOD', reaction: 'Bloating', severity: 'MILD', status: 'ACTIVE' },
    { patientPhone: '9876543276', allergen: 'Penicillin', allergyType: 'DRUG', reaction: 'Anaphylaxis history', severity: 'LIFE_THREATENING', status: 'ACTIVE' },
    { patientPhone: '9876543276', allergen: 'Eggs', allergyType: 'FOOD', reaction: 'Urticaria', severity: 'MODERATE', status: 'ACTIVE' },
    { patientPhone: '9876543278', allergen: 'Latex', allergyType: 'ENVIRONMENTAL', reaction: 'Contact urticaria', severity: 'MODERATE', status: 'ACTIVE' },
    { patientPhone: '9876543286', allergen: 'Penicillin', allergyType: 'DRUG', reaction: 'Rash', severity: 'MODERATE', status: 'ACTIVE' },
    { patientPhone: '9876543290', allergen: 'Aspirin', allergyType: 'DRUG', reaction: 'GI upset', severity: 'MODERATE', status: 'ACTIVE' },
    { patientPhone: '9876543290', allergen: 'Codeine', allergyType: 'DRUG', reaction: 'Nausea, dizziness', severity: 'MODERATE', status: 'ACTIVE' },
  ];

  let recordCount = 0;
  for (const ar of allergyRecords) {
    const patient = patientByPhone.get(ar.patientPhone);
    if (!patient) continue;
    await prisma.patientAllergyRecord.create({
      data: {
        patientId: patient.id,
        allergen: ar.allergen,
        allergyType: ar.allergyType,
        reaction: ar.reaction,
        severity: ar.severity,
        status: ar.status,
      },
    });
    recordCount++;
  }
  console.log(`Seeded ${recordCount} patient allergy records.`);
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
  await seedDiagnosisSystems();
  await seedDiagnoses();
  await seedMedicines();
  const doctors = await seedDoctors();
  await seedEmployeeSchedules(doctors);

  const permissions = await seedPermissions();
  const roles = await seedRoles(permissions);
  await seedUsers(
    roles.superAdmin.id, roles.receptionist.id, roles.doctor.id, roles.assistant.id, doctors,
    roles.nurse.id, roles.pharmacist.id, roles.labTech.id, roles.admin.id,
  );

  console.log('\n📊 Seeding demo transactional data...');

  await seedPatientsWithHistory(doctors);
  await seedAppointments(doctors);
  await seedQueueEntries(doctors);
  await seedBills();
  await seedOrders(doctors);
  await seedDispensing();
  await seedPatientAllergies();

  await seedPrescriptionTemplates();
  await seedSidebarConfig();

  console.log('✅ Seed complete.');
}

async function seedSidebarConfig() {
  const existing = await prisma.sidebarMenu.count();
  if (existing > 0) {
    console.log('⏭️  Sidebar config already seeded, skipping.');
    return;
  }

  // Fetch all roles
  const roles = await prisma.role.findMany();
  const roleMap = new Map(roles.map(r => [r.name, r.id]));

  const adminId = roleMap.get('Admin');
  const doctorId = roleMap.get('Doctor');
  const receptionistId = roleMap.get('Receptionist');
  const pharmacistId = roleMap.get('Pharmacist');
  const nurseId = roleMap.get('Nurse');
  const developerId = roleMap.get('Developer');
  const superAdminId = roleMap.get('Super Admin') ?? developerId;

  const allRoleIds = Array.from(roleMap.values());
  const clinicalRoles = [adminId, doctorId, receptionistId, nurseId, developerId].filter(Boolean);
  const frontDeskRoles = [adminId, receptionistId, developerId].filter(Boolean);
  const pharmacyRoles = [adminId, pharmacistId, developerId].filter(Boolean);

  const menuItems = [
    // Clinic group
    { label: 'Dashboard', path: '/dashboard', icon: 'LayoutDashboard', group: 'Clinic', sortOrder: 0, roleIds: allRoleIds },
    { label: 'Appointments', path: '/appointments', icon: 'CalendarClock', group: 'Clinic', sortOrder: 1, roleIds: [...frontDeskRoles, doctorId, nurseId].filter(Boolean) },
    { label: 'Patients', path: '/patients', icon: 'Users', group: 'Clinic', sortOrder: 2, roleIds: frontDeskRoles },
    { label: 'Doctors', path: '/doctors', icon: 'UserCog', group: 'Clinic', sortOrder: 3, roleIds: frontDeskRoles },
    { label: 'Prescriptions', path: '/prescriptions', icon: 'ClipboardList', group: 'Clinic', sortOrder: 4, roleIds: clinicalRoles },
    { label: 'Diagnoses', path: '/diagnoses', icon: 'Stethoscope', group: 'Clinic', sortOrder: 5, roleIds: clinicalRoles },

    // Reports group
    { label: 'Revenue by Category', path: '/reports/revenue-by-category', icon: 'BarChart3', group: 'Reports', sortOrder: 0, roleIds: [adminId, developerId].filter(Boolean) },
    { label: 'Outstanding Bills', path: '/reports/outstanding-bills', icon: 'AlertCircle', group: 'Reports', sortOrder: 1, roleIds: [adminId, developerId].filter(Boolean) },
    { label: 'Doctor Performance', path: '/reports/doctor-performance', icon: 'UserCog', group: 'Reports', sortOrder: 2, roleIds: [adminId, developerId].filter(Boolean) },
    { label: 'Top Medicines', path: '/reports/top-medicines', icon: 'Pill', group: 'Reports', sortOrder: 3, roleIds: [adminId, developerId].filter(Boolean) },

    // Pharmacy & Billing group
    { label: 'Medicine Catalog', path: '/medicine-catalog', icon: 'Pill', group: 'Pharmacy & Billing', sortOrder: 0, roleIds: pharmacyRoles },
    { label: 'Billing', path: '/billing', icon: 'Receipt', group: 'Pharmacy & Billing', sortOrder: 1, roleIds: pharmacyRoles },
    { label: 'Dispensing', path: '/dispensing', icon: 'Package', group: 'Pharmacy & Billing', sortOrder: 2, roleIds: pharmacyRoles },

    // Organisation group
    { label: 'Overview', path: '/organisation', icon: 'Building2', group: 'Organisation', sortOrder: 0, roleIds: [adminId, developerId].filter(Boolean) },
    { label: 'Rx Templates', path: '/organisation/prescription-templates', icon: 'FileText', group: 'Organisation', sortOrder: 1, roleIds: [adminId, doctorId, developerId].filter(Boolean) },
    { label: 'Shifts', path: '/shifts', icon: 'Clock', group: 'Organisation', sortOrder: 2, roleIds: [adminId, developerId].filter(Boolean) },
    { label: 'Addresses', path: '/addresses', icon: 'MapPin', group: 'Organisation', sortOrder: 3, roleIds: [adminId, developerId].filter(Boolean) },
    { label: 'Users', path: '/organisation/users', icon: 'UserCog', group: 'Organisation', sortOrder: 4, roleIds: [adminId, developerId].filter(Boolean) },
    { label: 'Sidebar Config', path: '/organisation/sidebar-config', icon: 'Settings', group: 'Organisation', sortOrder: 5, roleIds: [adminId, developerId].filter(Boolean) },

    // Access Control group
    { label: 'Roles & Permissions', path: '/organisation/roles', icon: 'ShieldCheck', group: 'Access Control', sortOrder: 0, roleIds: [adminId, developerId].filter(Boolean) },

    // Developer group
    { label: 'Overview', path: '/developer', icon: 'Cpu', group: 'Developer', sortOrder: 0, roleIds: [developerId].filter(Boolean) },
    { label: 'Modules', path: '/developer/modules', icon: 'Box', group: 'Developer', sortOrder: 1, roleIds: [developerId].filter(Boolean) },
    { label: 'Features', path: '/developer/features', icon: 'Zap', group: 'Developer', sortOrder: 2, roleIds: [developerId].filter(Boolean) },

    // Account group
    { label: 'Profile', path: '/profile', icon: 'User', group: 'Account', sortOrder: 0, roleIds: allRoleIds },
    { label: 'Help', path: '/help', icon: 'LifeBuoy', group: 'Account', sortOrder: 1, roleIds: allRoleIds },
  ];

  for (const item of menuItems) {
    await prisma.sidebarMenu.create({
      data: {
        label: item.label,
        path: item.path,
        icon: item.icon,
        group: item.group,
        sortOrder: item.sortOrder,
        roleMenus: {
          create: item.roleIds.map(roleId => ({ roleId })),
        },
      },
    });
  }

  console.log(`✅ Sidebar config seeded (${menuItems.length} items).`);
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
