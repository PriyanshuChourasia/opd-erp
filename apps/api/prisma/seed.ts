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
  await prisma.patientVitals.deleteMany();
  await prisma.patientAllergyRecord.deleteMany();
  await prisma.patientAllergy.deleteMany();
  await prisma.allergy.deleteMany();
  await prisma.diagnosis.deleteMany();
  await prisma.diagnosisSystem.deleteMany();
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
  { name: 'Fungal Skin Infection', icdCode: 'B36.9', description: 'Superficial mycosis of the skin' },
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
  const developerPerms = permissions.filter((p) => p.resource === 'developer');

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
  const developer = await upsertRoleWithPermissions('Developer', 'Developer tools: inspect modules, features, and API surface', developerPerms);

  console.log(`Seeded roles: Super Admin (${superAdminPerms.length}), Receptionist (${receptionistPerms.length}), Doctor (${doctorPerms.length}), Assistant (${assistantPerms.length}), Developer (${developerPerms.length}).`);
  return { superAdmin, receptionist, doctor, assistant, developer };
}

async function seedUsers(
  superAdminRoleId: string,
  receptionistRoleId: string,
  doctorRoleId: string,
  assistantRoleId: string,
  doctorRows: Doctor[],
  developerRoleId: string,
) {
  const password = await bcrypt.hash('Password@123', 10);
  const doctorPassword = await bcrypt.hash('Doctor@123', 10);

  // System users (no doctor link)
  const systemUsers = [
    { username: 'superadmin', firstName: 'Super', lastName: 'Admin', email: 'superadmin@clinic.com', password, roleId: superAdminRoleId },
    { username: 'admin', firstName: 'Admin', lastName: 'User', email: 'admin@clinic.com', password, roleId: superAdminRoleId },
    { username: 'anitapatel', firstName: 'Anita', lastName: 'Patel', email: 'assistant@clinic.com', password, roleId: assistantRoleId },
    { username: 'developer', firstName: 'Dev', lastName: 'Team', email: 'developer@clinic.com', password, roleId: developerRoleId },
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
  console.log('  developer@clinic.com / Password@123 (Developer)');
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
      { heightCm: 155, weightKg: 70, temperatureC: 99.2, pulseBpm: 82, systolicBp: 152, diastolicBp: 96, spo2Percent: 95, respiratoryRate: 19, daysAgo: 45 },
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
    vitalsHistory: [],
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
      where: { contactNo: demo.patient.contactNo },
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

  // Seed demo prescriptions for those patients
  const medicines = await prisma.medicine.findMany({ take: 100 });
  const medicineByName = new Map(medicines.map((m) => [m.name, m]));

  for (const rx of PRESCRIPTION_DEMOS) {
    const patient = await prisma.patient.findUnique({ where: { contactNo: rx.patientPhone } });
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
  console.log(`Seeded ${totalRx} demo prescriptions with items.`);
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
  await seedUsers(roles.superAdmin.id, roles.receptionist.id, roles.doctor.id, roles.assistant.id, doctors, roles.developer.id);

  if (FRESH) {
    await seedPatientsWithHistory(doctors);
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
