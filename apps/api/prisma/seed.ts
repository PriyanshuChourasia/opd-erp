import { PrismaClient, type Permission, type Doctor } from '@prisma/client';
import bcrypt from 'bcryptjs';
import * as XLSX from 'xlsx';
import * as path from 'path';

const prisma = new PrismaClient();
const FRESH = process.argv.includes('--fresh');
const DAY = 24 * 60 * 60 * 1000; // ms in a day

const doctorData = [
  { firstName: 'Rajesh', lastName: 'Sharma', specialization: 'General Medicine', medicalRegistrationNo: 'MCI-10001', consultationFee: 500, qualification: 'MBBS, MD', yearsOfExperience: 15 },
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
  'medicine-catalog', 'queue', 'billing', 'dispensing', 'discounts',
  'medicine-groups', 'units',
  'departments', 'designations', 'financial-years',
  // Accounting
  'accounting',
  // Diagnostics & orders
  'lab-orders', 'radiology-orders', 'procedure-orders', 'diagnoses', 'diagnosis-systems',
  // Patient data
  'allergies', 'patient-allergy-records', 'patient-vitals', 'addresses',
  // Organisation & HR
  'organisation', 'company', 'prescription-templates',
  'users', 'roles', 'permissions', 'shifts', 'employee-schedules',
  // System
  'documents', 'settings', 'dashboard', 'reports', 'developer', 'health',
];
const ACTIONS = ['read', 'create', 'update', 'delete', 'manage', 'refund'];

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
  await prisma.payment.deleteMany();
  await prisma.queueEntry.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.rolePermission.deleteMany();
  await prisma.discountRule.deleteMany();
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
  // SidebarMenu must go before Role — RoleSidebarMenu cascades from either
  // side, but leaving SidebarMenu rows behind after Role is wiped orphans
  // every menu item's role links, and seedSidebarConfig() skips reseeding
  // once any SidebarMenu rows exist — so /sidebar-config/my silently
  // returns [] for every role on every reseed after the first.
  await prisma.sidebarMenu.deleteMany();
  await prisma.role.deleteMany();
  await prisma.address.deleteMany();
  await prisma.prescriptionTemplate.deleteMany();
  await prisma.company.deleteMany();
  console.log('✅ All tables wiped.');
}

// ─── Seed functions ─────────────────────────────────────────

async function seedOrganisation() {
  const existing = await prisma.company.count();
  if (existing > 0 && !FRESH) {
    console.log('Company already seeded, skipping.');
    return;
  }
  await prisma.company.upsert({
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
      gstNumber: '27AABCU9603R1ZM',
      panNumber: 'AABCU9603R',
      cinNumber: 'U74999MH2014PTC255989',
    },
  });
  console.log('Seeded company.');
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
  const rows: Doctor[] = [];
  for (const doc of doctorData) {
    const existing = await prisma.doctor.findFirst({ where: { medicalRegistrationNo: doc.medicalRegistrationNo } });
    if (existing) {
      rows.push(existing);
      continue;
    }
    rows.push(
      await prisma.doctor.create({
        data: {
          specialization: doc.specialization,
          medicalRegistrationNo: doc.medicalRegistrationNo,
          consultationFee: doc.consultationFee,
          qualification: doc.qualification,
          yearsOfExperience: doc.yearsOfExperience,
        },
      }),
    );
  }
  console.log(`Seeded ${rows.length} doctor(s).`);
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

async function seedBloodGroups() {
  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  for (const name of bloodGroups) {
    await prisma.bloodGroup.upsert({ where: { name }, update: {}, create: { name } });
  }
  console.log(`✅ Blood groups seeded (${bloodGroups.length} items).`);
}

// ─── Starter patients (lightweight — safe to seed online) ──
// A handful of real Patient rows, no vitals/appointments/prescriptions.
// Runs unconditionally (upsert by patientCode) every seed, including on a
// fresh online/production deploy, unlike the heavy PATIENT_DEMOS generator
// below (seedPatientsWithHistory), which is deliberately disabled in main()
// so re-seeding a live DB doesn't keep regenerating 40+ demo patients.
const STARTER_PATIENTS = [
  { firstName: 'Neha', middleName: null, lastName: 'Kapoor', patientCode: 'NEHAKAPOOR-19950322', contactNo: '9876543292', email: 'neha.kapoor@example.com', dateOfBirth: new Date('1995-03-22'), gender: 'Female', bloodGroup: 'A+', address: '8 Sector 15, Noida, UP', emergencyContact: '9876543293', allergies: [], isFollowUp: false },
  { firstName: 'Arjun', middleName: null, lastName: 'Reddy', patientCode: 'ARJUNREDDY-19880710', contactNo: '9876543294', email: 'arjun.reddy@example.com', dateOfBirth: new Date('1988-07-10'), gender: 'Male', bloodGroup: 'B+', address: '23 Jubilee Hills, Hyderabad, Telangana', emergencyContact: '9876543295', allergies: ['Peanuts'], isFollowUp: false },
  { firstName: 'Fatima', middleName: null, lastName: 'Sheikh', patientCode: 'FATIMASHEIKH-19700208', contactNo: '9876543296', email: 'fatima.sheikh@example.com', dateOfBirth: new Date('1970-02-08'), gender: 'Female', bloodGroup: 'O-', address: '5 Marine Lines, Mumbai, Maharashtra', emergencyContact: '9876543297', allergies: ['Penicillin'], isFollowUp: true },
  { firstName: 'Karan', middleName: null, lastName: 'Malhotra', patientCode: 'KARANMALHOTRA-20010914', contactNo: '9876543298', email: 'karan.malhotra@example.com', dateOfBirth: new Date('2001-09-14'), gender: 'Male', bloodGroup: 'AB+', address: '61 Model Town, Ludhiana, Punjab', emergencyContact: '9876543299', allergies: [], isFollowUp: false },
];

async function seedStarterPatients() {
  let count = 0;
  for (const p of STARTER_PATIENTS) {
    await prisma.patient.upsert({
      where: { patientCode: p.patientCode },
      update: {},
      create: p,
    });
    count++;
  }
  console.log(`✅ Starter patients seeded (${count} — safe to re-run, upserted by patientCode).`);
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

  // ── Developer: full access to every module including Developer tools ──
  const developerPerms = [...permissions];

  // ── Super Admin: every permission EXCEPT the `developer` resource ──
  // Developer tooling stays exclusive to the Developer role.
  const superAdminRolePerms = permissions.filter((p) => p.resource !== 'developer');

  // ── Admin: full operational access, minus Developer tools ──
  // Explicit resource:action list (not a Set-of-resources pattern like the
  // other roles) because this mirrors an exact hand-configured permission
  // grant — some resources are full CRUD+manage, others are read/update-only.
  // This is the pre-slimming seed's grant verbatim, plus accounting CRUD
  // (accounting endpoints guard on read/create/update/delete:accounting and
  // the resource was missing from RESOURCES — see seedPermissions). Keep this
  // list in sync if the Admin role's permissions are adjusted through the
  // Roles & Permissions UI.
  const adminPermKeys = new Set([
    'accounting:create', 'accounting:delete', 'accounting:read', 'accounting:update',
    'addresses:create', 'addresses:delete', 'addresses:manage', 'addresses:read', 'addresses:update',
    'allergies:create', 'allergies:delete', 'allergies:manage', 'allergies:read', 'allergies:update',
    'appointments:create', 'appointments:manage', 'appointments:read', 'appointments:update',
    'billing:create', 'billing:delete', 'billing:manage', 'billing:read', 'billing:refund', 'billing:update',
    'company:create', 'company:delete', 'company:manage', 'company:read', 'company:update',
    'dashboard:read', 'dashboard:update',
    'diagnoses:read', 'diagnoses:update',
    'diagnosis-systems:read', 'diagnosis-systems:update',
    'discounts:create', 'discounts:delete', 'discounts:manage', 'discounts:read', 'discounts:update',
    'dispensing:create', 'dispensing:delete', 'dispensing:manage', 'dispensing:read', 'dispensing:update',
    'doctors:create', 'doctors:delete', 'doctors:manage', 'doctors:read', 'doctors:update',
    'documents:create', 'documents:read', 'documents:update',
    // Needed to render available booking slots when scheduling/rescheduling appointments.
    'employee-schedules:read',
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

  // ── Employee: consolidated front-line staff role. Union of the legacy
  // Receptionist + Nurse + Assistant + Pharmacist + Lab Technician grants,
  // minus the admin/system resources (roles/permissions/users/settings/
  // financial-years/company/developer stay Admin+/Super Admin/Developer). ──
  const receptionistResources = new Set([
    'patients', 'appointments', 'queue', 'billing',
    'prescriptions', 'dispensing', 'documents',
  ]);
  const receptionistReadResources = new Set([
    'medicine-catalog', 'lab-orders', 'radiology-orders', 'procedure-orders',
    // Needed to populate the discount dropdown at payment time.
    'discounts',
    // Needed to render available booking slots when scheduling/rescheduling appointments.
    'employee-schedules',
    // Needed to reprint a prescription on its doctor's assigned template.
    'prescription-templates',
    // Needed for sidebar header company name.
    'company',
  ]);
  const receptionistWriteResources = new Set(['doctors', 'users']);
  const receptionistPerms = permissions.filter(
    (p) =>
      receptionistResources.has(p.resource) ||
      receptionistReadResources.has(p.resource) && p.action === 'read' ||
      (receptionistWriteResources.has(p.resource) && (p.action === 'create' || p.action === 'read')) ||
      (p.resource === 'doctors' && p.action === 'delete'),
  );

  const nurseReadResources = new Set([
    'patients', 'appointments', 'queue', 'medicine-catalog',
    'allergies', 'patient-allergy-records', 'patient-vitals',
    'diagnoses', 'addresses', 'doctors',
    // Needed for sidebar header company name.
    'company',
  ]);
  const nurseWriteResources = new Set(['patient-vitals', 'patient-allergy-records', 'queue']);
  const nursePerms = permissions.filter(
    (p) =>
      (nurseReadResources.has(p.resource) && p.action === 'read') ||
      (nurseWriteResources.has(p.resource) &&
        (p.action === 'create' || p.action === 'update' || p.action === 'read')),
  );

  const assistantReadResources = new Set(['patients', 'appointments', 'medicine-catalog', 'doctors', 'company']);
  const assistantWriteResources = new Set(['queue']);
  const assistantPerms = permissions.filter(
    (p) =>
      (assistantReadResources.has(p.resource) && p.action === 'read') ||
      (assistantWriteResources.has(p.resource) &&
        (p.action === 'read' || p.action === 'update')),
  );

  const pharmacistReadResources = new Set([
    'patients', 'prescriptions', 'medicine-catalog', 'dispensing', 'billing', 'discounts', 'doctors',
    // Needed for sidebar header company name.
    'company',
  ]);
  const pharmacistWriteResources = new Set(['dispensing', 'billing']);
  const pharmacistPerms = permissions.filter(
    (p) =>
      (pharmacistReadResources.has(p.resource) && p.action === 'read') ||
      (pharmacistWriteResources.has(p.resource) &&
        (p.action === 'create' || p.action === 'update' || p.action === 'read')),
  );

  const labTechReadResources = new Set([
    'patients', 'lab-orders', 'radiology-orders', 'procedure-orders',
    'appointments', 'diagnoses', 'doctors',
    // Needed for sidebar header company name.
    'company',
  ]);
  const labTechWriteResources = new Set(['lab-orders', 'radiology-orders', 'procedure-orders']);
  const labTechPerms = permissions.filter(
    (p) =>
      (labTechReadResources.has(p.resource) && p.action === 'read') ||
      (labTechWriteResources.has(p.resource) &&
        (p.action === 'create' || p.action === 'update' || p.action === 'read')),
  );

  const EMPLOYEE_EXCLUDED_RESOURCES = new Set([
    'roles', 'permissions', 'users', 'settings', 'financial-years', 'company', 'developer',
  ]);
  const employeePerms = [...new Set([
    ...receptionistPerms, ...nursePerms, ...assistantPerms, ...pharmacistPerms, ...labTechPerms,
  ])].filter((p) => !EMPLOYEE_EXCLUDED_RESOURCES.has(p.resource));

  // ── Doctor: clinical operations ──
  const doctorReadResources = new Set([
    'patients', 'appointments', 'queue', 'medicine-catalog',
    'allergies', 'patient-allergy-records', 'patient-vitals',
    'diagnoses', 'diagnosis-systems', 'addresses', 'doctors',
    // Needed to render available slots when rescheduling from the consultation page.
    'employee-schedules',
    // Needed to print a prescription on the doctor's own assigned template.
    'prescription-templates',
    // Needed for sidebar header company name.
    'company',
  ]);
  const doctorWriteResources = new Set([
    'prescriptions', 'lab-orders', 'radiology-orders', 'procedure-orders',
    'patient-vitals', 'patient-allergy-records',
  ]);
  // Doctor's own consultation workflow (doctor-pos-page.tsx) advances queue
  // status and appointment status/reschedule — needs update on these two,
  // but not create (booking stays a front-desk action).
  const doctorUpdateOnlyResources = new Set(['queue', 'appointments']);
  const doctorPerms = permissions.filter(
    (p) =>
      (doctorReadResources.has(p.resource) && p.action === 'read') ||
      (doctorWriteResources.has(p.resource) &&
        (p.action === 'create' || p.action === 'update' || p.action === 'read')) ||
      (doctorUpdateOnlyResources.has(p.resource) && p.action === 'update'),
  );

  // ── Patient: read-only access to own data ──
  const patientReadResources = new Set(['appointments', 'prescriptions', 'lab-orders', 'billing']);
  const patientPerms = permissions.filter(
    (p) => patientReadResources.has(p.resource) && p.action === 'read',
  );

  const developer = await upsertRoleWithPermissions('Developer', 'Full access to every module including Developer tools', developerPerms);
  const superAdmin = await upsertRoleWithPermissions('Super Admin', 'Full operational access to every module except Developer tools', superAdminRolePerms);
  const admin = await upsertRoleWithPermissions('Admin', 'Full operational access — clinical, billing, staff, and system config — excluding Developer tools', adminPerms);
  const employee = await upsertRoleWithPermissions('Employee', 'Front-line staff: front-desk, clinical support, pharmacy, and lab operations', employeePerms);
  const doctor = await upsertRoleWithPermissions('Doctor', 'Clinical: prescriptions, vitals, allergies, lab/radiology/procedure orders', doctorPerms);
  const patient = await upsertRoleWithPermissions('Patient', 'Patient portal: read-only access to own appointments, prescriptions, lab orders, and bills', patientPerms);

  console.log(`Seeded roles: Developer (${developerPerms.length}), Super Admin (${superAdminRolePerms.length}), Admin (${adminPerms.length}), Employee (${employeePerms.length}), Doctor (${doctorPerms.length}), Patient (${patientPerms.length}).`);
  return { developer, superAdmin, admin, employee, doctor, patient };
}

async function seedUsers(
  developerRoleId: string,
  superAdminRoleId: string,
  adminRoleId: string,
  doctorRoleId: string,
  demoDoctorId: string,
) {
  const developerPassword = await bcrypt.hash('Developer@123', 10);
  await prisma.user.upsert({
    where: { email: 'developer@clinic.com' },
    update: {},
    create: {
      username: 'developer',
      firstName: 'Developer',
      lastName: 'User',
      email: 'developer@clinic.com',
      password: developerPassword,
      roleId: developerRoleId,
    },
  });

  // Super Admin demo account — every permission except Developer-only
  // tooling (see the Super Admin role definition in seedRoles). Several
  // other seed functions look this account up by email for createdById
  // attribution on seeded historical data.
  const superAdminPassword = await bcrypt.hash('SuperAdmin@123', 10);
  await prisma.user.upsert({
    where: { email: 'superadmin@clinic.com' },
    update: {},
    create: {
      username: 'superadmin',
      firstName: 'Super',
      lastName: 'Admin',
      email: 'superadmin@clinic.com',
      password: superAdminPassword,
      roleId: superAdminRoleId,
    },
  });

  // Admin demo account (operational access, no Developer tools)
  const adminPassword = await bcrypt.hash('Admin@123', 10);
  await prisma.user.upsert({
    where: { email: 'admin@clinic.com' },
    update: {},
    create: {
      username: 'admin',
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@clinic.com',
      password: adminPassword,
      roleId: adminRoleId,
    },
  });

  // Demo doctor account — linked to the first doctorData row (Dr Rajesh
  // Sharma, MCI-10001), whose Mon–Fri 09:00–17:00 schedule is seeded by
  // seedEmployeeSchedules. Upsert by email: an existing user (e.g. from a
  // live deployment) keeps its own password.
  const doctorPassword = await bcrypt.hash('Doctor@123', 10);
  await prisma.user.upsert({
    where: { email: 'rajesh.sharma@clinic.com' },
    update: {},
    create: {
      username: 'rajeshsharma',
      firstName: 'Rajesh',
      lastName: 'Sharma',
      email: 'rajesh.sharma@clinic.com',
      password: doctorPassword,
      roleId: doctorRoleId,
      userableType: 'Doctor',
      userableId: demoDoctorId,
    },
  });

  console.log('Seeded 4 login users (Developer, Super Admin, Admin, Doctor).');
  console.log('Login credentials:');
  console.log('  developer@clinic.com / Developer@123 (Developer — every permission, including Developer tools)');
  console.log('  superadmin@clinic.com / SuperAdmin@123 (Super Admin — every permission except Developer tools)');
  console.log('  admin@clinic.com / Admin@123 (Admin)');
  console.log('  rajesh.sharma@clinic.com / Doctor@123 (Doctor — Dr Rajesh Sharma)');
}

// ─── Medicine Catalog ──────────────────────────────────────
// Sourced from the clinic's actual Tally inventory export (List_of_Items.xlsx,
// copied to the repo/image root) rather than a hardcoded placeholder list, so
// every freshly-seeded environment (local, Docker, CI) matches what's really
// on the shelf. See apps/api/prisma/import-medicines-from-excel.ts for the
// one-off script this logic was lifted from.

interface ParsedMedicineRow {
  name: string;
  alias: string | null;
  groupName: string;
  openingStock: number;
  unitName: string;
  isActive: boolean;
}

function parseMedicineExcel(): ParsedMedicineRow[] {
  const excelPath = path.resolve(__dirname, '../../../List_of_Items.xlsx');
  const wb = XLSX.readFile(excelPath);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows: unknown[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null });

  const items: ParsedMedicineRow[] = [];
  for (const row of rows) {
    const [rawName, rawAlias, rawGroup, rawStock, rawUnit] = row ?? [];
    // Real item rows are the only ones with a numeric stock and a unit string —
    // this skips the letterhead rows, the header row, the blank separator, and
    // the trailing "Totals" row in one check.
    if (typeof rawName !== 'string' || !rawName.trim()) continue;
    if (typeof rawStock !== 'number') continue;
    if (typeof rawUnit !== 'string' || !rawUnit.trim()) continue;

    const trimmedName = rawName.trim();
    // A leading '*' is this Tally export's marker for a suspended/inactive item.
    const isActive = !trimmedName.startsWith('*');
    const name = (isActive ? trimmedName : trimmedName.slice(1)).trim();
    const alias = typeof rawAlias === 'string' && rawAlias.trim() ? rawAlias.trim() : null;
    const groupName = typeof rawGroup === 'string' && rawGroup.trim() ? rawGroup.trim() : 'General';

    items.push({ name, alias, groupName, openingStock: rawStock, unitName: rawUnit.trim(), isActive });
  }
  return items;
}

async function seedMedicines() {
  const existing = await prisma.medicine.count();
  if (existing > 0 && !FRESH) {
    console.log('Medicines already seeded, skipping.');
    return;
  }

  const items = parseMedicineExcel();

  const groupIdByName = new Map<string, string>();
  for (const name of new Set(items.map((i) => i.groupName))) {
    const group = await prisma.medicineGroup.upsert({ where: { name }, update: {}, create: { name } });
    groupIdByName.set(name, group.id);
  }

  const unitIdByName = new Map<string, string>();
  for (const name of new Set(items.map((i) => i.unitName))) {
    const unit = await prisma.unit.upsert({ where: { name }, update: {}, create: { name } });
    unitIdByName.set(name, unit.id);
  }

  for (const item of items) {
    await prisma.medicine.create({
      data: {
        name: item.name,
        alias: item.alias,
        unit: item.unitName,
        unitId: unitIdByName.get(item.unitName),
        groupId: groupIdByName.get(item.groupName),
        price: 0,
        openingStock: item.openingStock,
        currentStock: item.openingStock,
        isActive: item.isActive,
      },
    });
  }
  console.log(`Seeded ${items.length} medicines in the catalog from List_of_Items.xlsx.`);
}

// ─── Demo patients (with vitals & prescription history) ──
// Creates demo patients with vitals history — useful for testing the
// "patient history" feature shown in the new-appointment flow.
// NOTE: appointment history is intentionally NOT seeded for these patients
// (see the note above PRESCRIPTION_DEMOS) so the demo data never clutters
// the live Appointments/Queue views.

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
  let totalAppt = 0;
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

  // Seed demo prescriptions + their appointments for those patients (each
  // independently skipped once its own table already has rows, so a DB that
  // e.g. already has prescriptions from elsewhere still gets appointments).
  const existingRxCount = await prisma.prescription.count();
  const existingApptCount = await prisma.appointment.count();
  const shouldSeedRx = existingRxCount === 0;
  const shouldSeedAppt = existingApptCount === 0;
  if (shouldSeedRx || shouldSeedAppt) {
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

      const visitDate = new Date(Date.now() - rx.daysAgo * 24 * 60 * 60 * 1000);

      // One completed appointment per demo visit — a prescription already
      // exists for it, so the consultation it came from must have happened.
      if (shouldSeedAppt) {
        await prisma.appointment.create({
          data: {
            patientId: patient.id,
            doctorId: doctor.id,
            date: visitDate,
            type: 'CONSULTATION',
            status: 'COMPLETED',
            amount: doctor.consultationFee,
            amountPaid: doctor.consultationFee,
            reasonForVisit: rx.diagnosis,
            notes: rx.notes ?? null,
            createdAt: visitDate,
            updatedAt: visitDate,
            createdById: userId,
          },
        });
        totalAppt++;
      }

      if (shouldSeedRx) {
        await prisma.prescription.create({
          data: {
            patientId: patient.id,
            doctorId: doctor.id,
            diagnosis: rx.diagnosis,
            notes: rx.notes ?? null,
            status: rx.status,
            createdAt: visitDate,
            updatedAt: visitDate,
            createdById: userId,
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
  }
  console.log(`Seeded ${totalAppt} demo appointments and ${totalRx} demo prescriptions with items.`);
}

// ─── Main ───────────────────────────────────────────────────

// ─── Prescription Templates ───────────────────────────────

const prescriptionTemplateData = [
  // ── 1. Classic — Traditional formal layout (default prescription template) ──
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
  // ── 2. Standard Diagnosis Report (default diagnosis template) ──
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
    const consultationFee = appt.amount || 500;
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

// ─── Appointment & prescription wipe (non-fresh refreshes) ──
// Wipes every appointment and prescription record so the demo data below is
// regenerated on every seed run instead of being skipped by the
// shouldSeedAppt/shouldSeedRx guards. Deletion order is FK-safe: children
// (dispensing, prescription items/history, payments, queue entries) before
// parents (prescriptions, bills, appointments). Vitals and bills NOT linked
// to an appointment (walk-in invoices) are left untouched.
async function wipeAppointmentsAndPrescriptions() {
  console.log('🧹 Wiping all appointment & prescription data...');
  await prisma.$transaction(async (tx) => {
    // Dispensing references prescriptions (Restrict) — wipe first.
    await tx.dispensing.deleteMany();

    // Payments tied to the appointments/bills being wiped.
    const apptBills = await tx.bill.findMany({
      where: { appointmentId: { not: null } },
      select: { id: true },
    });
    const apptBillIds = apptBills.map((b) => b.id);
    await tx.payment.deleteMany({
      where: {
        OR: [
          { appointmentId: { not: null } },
          ...(apptBillIds.length > 0 ? [{ billId: { in: apptBillIds } }] : []),
        ],
      },
    });

    // Queue entries are tied to appointments — wipe (SetNull would orphan them).
    await tx.queueEntry.deleteMany();

    // Prescription children, then the prescriptions themselves.
    await tx.prescriptionItem.deleteMany();
    await tx.prescriptionHistory.deleteMany();
    await tx.prescription.deleteMany();

    // Bills created from the wiped appointments (BillItems cascade).
    await tx.bill.deleteMany({ where: { appointmentId: { not: null } } });

    // Vitals recorded against the wiped appointments (unlinked vitals stay).
    await tx.patientVitals.deleteMany({ where: { appointmentId: { not: null } } });

    // AppointmentHistory cascades with appointment delete.
    await tx.appointment.deleteMany();
  });
  console.log('✅ Appointment & prescription data wiped.');
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
  // Demo doctor login links to Dr Rajesh Sharma (first doctorData entry, MCI-10001).
  const demoDoctor = doctors.find((d) => d.medicalRegistrationNo === 'MCI-10001') ?? doctors[0];
  await seedUsers(roles.developer.id, roles.superAdmin.id, roles.admin.id, roles.doctor.id, demoDoctor.id);

  await seedBloodGroups();

  await seedStarterPatients();
  // Wipe existing appointment & prescription data first so the demo rows below
  // are regenerated on every seed run (fresh mode already wiped via wipeAll).
  await wipeAppointmentsAndPrescriptions();
  // Demo appointments + prescriptions (each independently safe to rerun —
  // see the shouldSeedAppt/shouldSeedRx guards inside seedPatientsWithHistory).
  await seedPatientsWithHistory(doctors);
  // Patient allergy links + detailed records for the same PATIENT_DEMOS
  // patients above — self-contained skip-if-already-seeded guards.
  await seedPatientAllergies();

  console.log('\n📊 Skipping remaining demo transactional data (bills, accounting)...');
  console.log('   Patients and medicines are kept from wipe-data.ts.');
  console.log('   Run seedAccounting() separately if you need chart-of-accounts.');

  // Uncomment below to re-seed specific data:
  // await seedBills();
  // await seedOrders(doctors);
  // await seedDispensing();
  // await seedPrescriptionTemplates();
  // await seedAccounting();
  // await backfillMissingLedgers();
  // await seedAccountingDemoData();
  // await seedSidebarConfig();

  console.log('✅ Seed complete.');
}

async function seedAccounting() {
  // ── 1. Seed 5 Account Natures ──
  const natures = [
    { code: 'ASSET', name: 'Assets', normalBalance: 'DEBIT' },
    { code: 'LIABILITY', name: 'Liabilities', normalBalance: 'CREDIT' },
    { code: 'INCOME', name: 'Income', normalBalance: 'CREDIT' },
    { code: 'EXPENSE', name: 'Expenses', normalBalance: 'DEBIT' },
    { code: 'EQUITY', name: 'Equity', normalBalance: 'CREDIT' },
  ];

  const natureIdMap = new Map<string, string>();
  for (const n of natures) {
    const row = await prisma.accountNature.upsert({
      where: { code: n.code },
      update: { name: n.name, normalBalance: n.normalBalance },
      create: n,
    });
    natureIdMap.set(n.code, row.id);
  }
  console.log(`Seeded ${natures.length} account natures.`);

  // ── 2. Seed Tally-style primary Account Groups (hierarchical) ──
  interface GroupSeed {
    name: string;
    nature: string; // code
    parent?: string; // parent name within same nature
    isReserved?: boolean;
    affectsGrossProfit?: boolean;
  }

  const groupDefs: GroupSeed[] = [
    // Assets
    { name: 'Current Assets', nature: 'ASSET', isReserved: true },
    { name: 'Bank Accounts', nature: 'ASSET', parent: 'Current Assets', isReserved: true },
    { name: 'Cash-in-Hand', nature: 'ASSET', parent: 'Current Assets', isReserved: true },
    { name: 'Sundry Debtors', nature: 'ASSET', parent: 'Current Assets', isReserved: true },
    { name: 'Staff Accounts', nature: 'ASSET', parent: 'Current Assets', isReserved: true },
    { name: 'Inventory Asset', nature: 'ASSET', parent: 'Current Assets', isReserved: true },
    { name: 'Fixed Assets', nature: 'ASSET', isReserved: true },

    // Liabilities
    { name: 'Current Liabilities', nature: 'LIABILITY', isReserved: true },
    { name: 'Sundry Creditors', nature: 'LIABILITY', parent: 'Current Liabilities', isReserved: true },
    { name: 'Doctor Payables', nature: 'LIABILITY', parent: 'Current Liabilities', isReserved: true },
    { name: 'Duties & Taxes', nature: 'LIABILITY', parent: 'Current Liabilities', isReserved: true },
    { name: 'GST Payable', nature: 'LIABILITY', parent: 'Duties & Taxes', isReserved: true },
    { name: 'Long-term Liabilities', nature: 'LIABILITY', isReserved: true },

    // Income
    { name: 'Sales Accounts', nature: 'INCOME', isReserved: true, affectsGrossProfit: true },
    { name: 'Pharmacy Sales', nature: 'INCOME', parent: 'Sales Accounts', affectsGrossProfit: true },
    { name: 'Consultation Income', nature: 'INCOME', parent: 'Sales Accounts', affectsGrossProfit: true },
    { name: 'Lab Income', nature: 'INCOME', parent: 'Sales Accounts', affectsGrossProfit: true },
    { name: 'Other Income', nature: 'INCOME', isReserved: true },

    // Expenses
    { name: 'Purchase Accounts', nature: 'EXPENSE', isReserved: true, affectsGrossProfit: true },
    { name: 'Cost of Goods Sold', nature: 'EXPENSE', parent: 'Purchase Accounts', affectsGrossProfit: true },
    { name: 'Direct Expenses', nature: 'EXPENSE', isReserved: true, affectsGrossProfit: true },
    { name: 'Indirect Expenses', nature: 'EXPENSE', isReserved: true },

    // Equity
    { name: 'Capital Account', nature: 'EQUITY', isReserved: true },
    { name: 'Retained Earnings', nature: 'EQUITY', isReserved: true },
  ];

  // First pass: create all groups (parents first, then children)
  const groupIdMap = new Map<string, string>(); // name → id
  const deferred: GroupSeed[] = [];

  for (const g of groupDefs) {
    if (g.parent && !groupIdMap.has(g.parent)) {
      deferred.push(g);
      continue;
    }
    const natureId = natureIdMap.get(g.nature)!;
    const parentGroupId = g.parent ? groupIdMap.get(g.parent) ?? null : null;
    const row = await prisma.accountGroup.upsert({
      where: { name_natureId: { name: g.name, natureId } },
      update: { parentGroupId, isReserved: g.isReserved ?? false, affectsGrossProfit: g.affectsGrossProfit ?? false },
      create: {
        name: g.name,
        natureId,
        parentGroupId,
        isReserved: g.isReserved ?? false,
        affectsGrossProfit: g.affectsGrossProfit ?? false,
      },
    });
    groupIdMap.set(g.name, row.id);
  }

  // Second pass: deferred children
  for (const g of deferred) {
    const natureId = natureIdMap.get(g.nature)!;
    const parentGroupId = g.parent ? groupIdMap.get(g.parent) ?? null : null;
    const row = await prisma.accountGroup.upsert({
      where: { name_natureId: { name: g.name, natureId } },
      update: { parentGroupId, isReserved: g.isReserved ?? false, affectsGrossProfit: g.affectsGrossProfit ?? false },
      create: {
        name: g.name,
        natureId,
        parentGroupId,
        isReserved: g.isReserved ?? false,
        affectsGrossProfit: g.affectsGrossProfit ?? false,
      },
    });
    groupIdMap.set(g.name, row.id);
  }
  console.log(`Seeded ${groupDefs.length} account groups.`);

  // ── 3. Seed default Ledgers ──
  interface LedgerSeed {
    name: string;
    accountGroup: string;
    isCashAccount?: boolean;
    isBankAccount?: boolean;
    isBillWiseTracking?: boolean;
  }

  const ledgerDefs: LedgerSeed[] = [
    { name: 'Cash', accountGroup: 'Cash-in-Hand', isCashAccount: true },
    { name: 'Bank Account', accountGroup: 'Bank Accounts', isBankAccount: true },
    { name: 'Pharmacy Sales', accountGroup: 'Pharmacy Sales' },
    { name: 'Consultation Income', accountGroup: 'Consultation Income' },
    { name: 'Lab Income', accountGroup: 'Lab Income' },
    { name: 'GST Payable', accountGroup: 'GST Payable' },
    { name: 'Sundry Debtors', accountGroup: 'Sundry Debtors', isBillWiseTracking: true },
    { name: 'Sundry Creditors', accountGroup: 'Sundry Creditors', isBillWiseTracking: true },
    { name: 'Inventory Asset', accountGroup: 'Inventory Asset' },
    { name: 'Cost of Goods Sold', accountGroup: 'Cost of Goods Sold' },
    { name: 'Capital Account', accountGroup: 'Capital Account' },
    { name: 'Retained Earnings', accountGroup: 'Retained Earnings' },
  ];

  let ledgerCount = 0;
  for (const l of ledgerDefs) {
    const accountGroupId = groupIdMap.get(l.accountGroup);
    if (!accountGroupId) {
      console.warn(`⚠️  Skipping ledger "${l.name}" — group "${l.accountGroup}" not found.`);
      continue;
    }
    const existing = await prisma.ledger.findFirst({
      where: { name: l.name, accountGroupId },
    });
    if (!existing) {
      await prisma.ledger.create({
        data: {
          name: l.name,
          accountGroupId,
          isCashAccount: l.isCashAccount ?? false,
          isBankAccount: l.isBankAccount ?? false,
          isBillWiseTracking: l.isBillWiseTracking ?? false,
        },
      });
      ledgerCount++;
    }
  }
  console.log(`Seeded ${ledgerCount} default ledgers.`);

  // ── 4. Seed VoucherTypes ──
  const voucherTypes = [
    { name: 'Sales', code: 'SALES', affectsAccounting: true, affectsInventory: false, numberingPrefix: 'SAL', isSystemDefined: true },
    { name: 'Purchase', code: 'PURCHASE', affectsAccounting: true, affectsInventory: true, numberingPrefix: 'PUR', isSystemDefined: true },
    { name: 'Receipt', code: 'RECEIPT', affectsAccounting: true, affectsInventory: false, numberingPrefix: 'REC', isSystemDefined: true },
    { name: 'Payment', code: 'PAYMENT', affectsAccounting: true, affectsInventory: false, numberingPrefix: 'PAY', isSystemDefined: true },
    { name: 'Journal', code: 'JOURNAL', affectsAccounting: true, affectsInventory: false, numberingPrefix: 'JNL', isSystemDefined: true },
    { name: 'Contra', code: 'CONTRA', affectsAccounting: true, affectsInventory: false, numberingPrefix: 'CTR', isSystemDefined: true },
    { name: 'Stock Journal', code: 'STOCK_JOURNAL', affectsAccounting: false, affectsInventory: true, numberingPrefix: 'STK', isSystemDefined: true },
    { name: 'Credit Note', code: 'CREDIT_NOTE', affectsAccounting: true, affectsInventory: true, numberingPrefix: 'CRN', isSystemDefined: true },
    { name: 'Debit Note', code: 'DEBIT_NOTE', affectsAccounting: true, affectsInventory: true, numberingPrefix: 'DBN', isSystemDefined: true },
  ];

  const voucherTypeIdMap = new Map<string, string>();
  for (const vt of voucherTypes) {
    const row = await prisma.voucherType.upsert({
      where: { code: vt.code },
      update: { name: vt.name },
      create: vt,
    });
    voucherTypeIdMap.set(vt.code, row.id);
  }
  console.log(`Seeded ${voucherTypes.length} voucher types.`);

  // ── 5. Seed JournalTypes ──
  const journalTypes = [
    { code: 'GENERAL', name: 'General', requiresApproval: false },
    { code: 'OPENING', name: 'Opening Balance', requiresApproval: true },
    { code: 'CLOSING', name: 'Closing/Year-End', requiresApproval: true },
    { code: 'ADJUSTING', name: 'Adjusting Entry', requiresApproval: true },
    { code: 'SYSTEM_AUTO', name: 'System Auto-Generated', requiresApproval: false },
  ];

  const journalTypeIdMap = new Map<string, string>();
  for (const jt of journalTypes) {
    const row = await prisma.journalType.upsert({
      where: { code: jt.code },
      update: {},
      create: jt,
    });
    journalTypeIdMap.set(jt.code, row.id);
  }
  console.log(`Seeded ${journalTypes.length} journal types.`);

  // ── 6. Ensure a FinancialYear with isCurrent: true ──
  const currentFY = await prisma.financialYear.findFirst({ where: { isCurrent: true } });
  if (!currentFY) {
    const now = new Date();
    const fyStartYear = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
    const fyStart = new Date(fyStartYear, 3, 1); // April 1
    const fyEnd = new Date(fyStart.getFullYear() + 1, 2, 31); // March 31
    const fyName = `${fyStart.getFullYear()}-${fyEnd.getFullYear()}`;
    await prisma.financialYear.create({
      data: { name: fyName, startDate: fyStart, endDate: fyEnd, isCurrent: true },
    });
    console.log(`Seeded financial year: ${fyName}`);
  } else {
    console.log(`Financial year already exists: ${currentFY.name}`);
  }

  // ── 7. Add linkedPaymentMethod to existing payment-method ledgers ──
  // Map CASH to the Cash ledger, CARD/UPI to the Bank Account ledger
  const cashLedger = await prisma.ledger.findFirst({ where: { name: 'Cash' } });
  if (cashLedger && !cashLedger.linkedPaymentMethod) {
    await prisma.ledger.update({ where: { id: cashLedger.id }, data: { linkedPaymentMethod: 'CASH' } });
    console.log('Marked Cash ledger with linkedPaymentMethod = CASH');
  }
  const bankLedger = await prisma.ledger.findFirst({ where: { name: 'Bank Account' } });
  if (bankLedger) {
    // CARD and UPI are unique fields, so we can't set both on the same row.
    // We'll handle CARD/UPI resolution in code by mapping both to Bank Account.
    console.log('Bank Account ledger found — CARD/UPI will resolve to this ledger in code.');
  }
}

/**
 * Every Patient/Doctor/User must always have its own ledger (app-level invariant
 * enforced going forward in patients/doctors/users/auth services). This backfills
 * any row created before that wiring existed, or restored by a --fresh reseed.
 */
async function backfillMissingLedgers() {
  const sundryDebtors = await prisma.accountGroup.findFirst({ where: { name: 'Sundry Debtors' } });
  const doctorPayables = await prisma.accountGroup.findFirst({ where: { name: 'Doctor Payables' } });
  const staffAccounts = await prisma.accountGroup.findFirst({ where: { name: 'Staff Accounts' } });
  if (!sundryDebtors || !doctorPayables || !staffAccounts) {
    console.warn('⚠️  Skipping ledger backfill — required account groups not found.');
    return;
  }

  let patientCount = 0;
  const patients = await prisma.patient.findMany({ where: { deletedAt: null } });
  for (const p of patients) {
    const existing = await prisma.ledger.findFirst({ where: { patientId: p.id } });
    if (existing) continue;
    await prisma.ledger.create({
      data: {
        name: `${p.firstName} ${p.lastName}`.trim(),
        accountGroupId: sundryDebtors.id,
        openingBalance: 0,
        openingBalanceType: 'DEBIT',
        isBillWiseTracking: true,
        patientId: p.id,
      },
    });
    patientCount++;
  }

  let doctorCount = 0;
  const doctors = await prisma.doctor.findMany();
  for (const d of doctors) {
    const existing = await prisma.ledger.findFirst({ where: { doctorId: d.id } });
    if (existing) continue;
    const linkedUser = await prisma.user.findFirst({ where: { userableType: 'Doctor', userableId: d.id } });
    const name = linkedUser ? `${linkedUser.firstName} ${linkedUser.lastName}`.trim() : `Doctor (${d.medicalRegistrationNo})`;
    await prisma.ledger.create({
      data: {
        name,
        accountGroupId: doctorPayables.id,
        openingBalance: 0,
        openingBalanceType: 'CREDIT',
        isBillWiseTracking: true,
        doctorId: d.id,
      },
    });
    doctorCount++;
  }

  let userCount = 0;
  const users = await prisma.user.findMany();
  for (const u of users) {
    const existing = await prisma.ledger.findFirst({ where: { userId: u.id } });
    if (existing) continue;
    await prisma.ledger.create({
      data: {
        name: `${u.firstName} ${u.lastName}`.trim(),
        accountGroupId: staffAccounts.id,
        openingBalance: 0,
        openingBalanceType: 'DEBIT',
        isBillWiseTracking: false,
        userId: u.id,
      },
    });
    userCount++;
  }

  console.log(`Backfilled ledgers: ${patientCount} patient(s), ${doctorCount} doctor(s), ${userCount} user(s).`);
}

/**
 * Demo data to exercise the accounting engine end-to-end: one Sales voucher
 * (consultation bill) + a partial Receipt against it, so Voucher/Journal/
 * JournalLine/VoucherReference/Ledger.currentBalance can all be inspected
 * together in prisma studio. Idempotent — skips if the demo bill already exists.
 */
async function seedAccountingDemoData() {
  const existingDemo = await prisma.bill.findFirst({ where: { invoiceNo: 'DEMO-INV-0001' } });
  if (existingDemo) {
    console.log('Accounting demo data already seeded, skipping.');
    return;
  }

  const patient = await prisma.patient.findFirst({ where: { deletedAt: null }, orderBy: { createdAt: 'asc' } });
  const doctor = await prisma.doctor.findFirst({ orderBy: { createdAt: 'asc' } });
  if (!patient || !doctor) {
    console.warn('⚠️  Skipping accounting demo data — need at least one patient and one doctor seeded first.');
    return;
  }

  const fy = await prisma.financialYear.findFirst({ where: { isCurrent: true } });
  const salesType = await prisma.voucherType.findFirst({ where: { code: 'SALES' } });
  const receiptType = await prisma.voucherType.findFirst({ where: { code: 'RECEIPT' } });
  const generalJournalType = await prisma.journalType.findFirst({ where: { code: 'GENERAL' } });
  const consultationIncome = await prisma.ledger.findFirst({ where: { name: 'Consultation Income' } });
  const cashLedger = await prisma.ledger.findFirst({ where: { linkedPaymentMethod: 'CASH' } });
  const patientLedger = await prisma.ledger.findFirst({ where: { patientId: patient.id } });
  if (!fy || !salesType || !receiptType || !generalJournalType || !consultationIncome || !cashLedger || !patientLedger) {
    console.warn('⚠️  Skipping accounting demo data — required masters not found. Run seedAccounting()/backfillMissingLedgers() first.');
    return;
  }

  const consultationFee = doctor.consultationFee > 0 ? doctor.consultationFee : 500;

  // 1. Demo Bill (consultation) — mirrors what BillingService.create() would produce.
  const bill = await prisma.bill.create({
    data: {
      patientId: patient.id,
      invoiceNo: 'DEMO-INV-0001',
      subtotal: consultationFee,
      discount: 0,
      tax: 0,
      total: consultationFee,
      paymentMethod: 'CASH',
      status: 'PENDING',
      notes: 'Seed demo — consultation bill',
      items: {
        create: [
          {
            itemType: 'CONSULTATION',
            itemId: doctor.id,
            itemName: `Consultation — Dr. ${doctor.specialization ?? 'General'}`,
            quantity: 1,
            unitPrice: consultationFee,
            amount: consultationFee,
          },
        ],
      },
    },
  });

  // 2. Sales voucher + journal: Dr Patient Ledger, Cr Consultation Income.
  const salesVoucherCount = await prisma.voucher.count({ where: { voucherTypeId: salesType.id, financialYearId: fy.id } });
  const salesVoucher = await prisma.voucher.create({
    data: {
      voucherTypeId: salesType.id,
      voucherNumber: `${salesType.numberingPrefix}-${fy.id.slice(0, 8)}-${(salesVoucherCount + 1).toString().padStart(4, '0')}`,
      financialYearId: fy.id,
      partyLedgerId: patientLedger.id,
      totalAmount: consultationFee,
      status: 'POSTED',
      sourceModule: 'Bill',
      sourceId: bill.id,
      notes: `Sales voucher for ${bill.invoiceNo}`,
    },
  });
  const salesJournal = await prisma.journal.create({
    data: {
      voucherId: salesVoucher.id,
      journalTypeId: generalJournalType.id,
      isPosted: true,
      totalDebit: consultationFee,
      totalCredit: consultationFee,
      notes: `Sales journal for ${bill.invoiceNo}`,
    },
  });
  await prisma.journalLine.createMany({
    data: [
      { journalId: salesJournal.id, ledgerId: patientLedger.id, debitAmount: consultationFee, creditAmount: 0 },
      { journalId: salesJournal.id, ledgerId: consultationIncome.id, debitAmount: 0, creditAmount: consultationFee },
    ],
  });
  await prisma.ledger.update({ where: { id: patientLedger.id }, data: { currentBalance: { increment: consultationFee } } });
  await prisma.ledger.update({ where: { id: consultationIncome.id }, data: { currentBalance: { increment: consultationFee } } });

  // 3. Partial payment (60%) → Receipt voucher + journal + AGAINST_REF voucher reference.
  const paidAmount = Math.round(consultationFee * 0.6);
  const payment = await prisma.payment.create({
    data: {
      billId: bill.id,
      patientId: patient.id,
      amount: paidAmount,
      method: 'CASH',
      direction: 'PAYMENT',
      notes: 'Seed demo — partial payment',
    },
  });
  await prisma.bill.update({ where: { id: bill.id }, data: { paidAmount, status: 'PARTIALLY_PAID' } });

  const receiptVoucherCount = await prisma.voucher.count({ where: { voucherTypeId: receiptType.id, financialYearId: fy.id } });
  const receiptVoucher = await prisma.voucher.create({
    data: {
      voucherTypeId: receiptType.id,
      voucherNumber: `${receiptType.numberingPrefix}-${fy.id.slice(0, 8)}-${(receiptVoucherCount + 1).toString().padStart(4, '0')}`,
      financialYearId: fy.id,
      partyLedgerId: patientLedger.id,
      totalAmount: paidAmount,
      status: 'POSTED',
      sourceModule: 'Payment',
      sourceId: payment.id,
      notes: `Receipt for ${bill.invoiceNo}`,
    },
  });
  const receiptJournal = await prisma.journal.create({
    data: {
      voucherId: receiptVoucher.id,
      journalTypeId: generalJournalType.id,
      isPosted: true,
      totalDebit: paidAmount,
      totalCredit: paidAmount,
      notes: `Receipt journal for ${bill.invoiceNo}`,
    },
  });
  await prisma.journalLine.createMany({
    data: [
      { journalId: receiptJournal.id, ledgerId: cashLedger.id, debitAmount: paidAmount, creditAmount: 0 },
      { journalId: receiptJournal.id, ledgerId: patientLedger.id, debitAmount: 0, creditAmount: paidAmount },
    ],
  });
  await prisma.ledger.update({ where: { id: cashLedger.id }, data: { currentBalance: { increment: paidAmount } } });
  await prisma.ledger.update({ where: { id: patientLedger.id }, data: { currentBalance: { decrement: paidAmount } } });

  await prisma.voucherReference.create({
    data: {
      voucherId: receiptVoucher.id,
      referenceType: 'AGAINST_REF',
      referencedVoucherId: salesVoucher.id,
      ledgerId: patientLedger.id,
      amount: paidAmount,
    },
  });

  console.log(
    `Seeded accounting demo data: Bill ${bill.invoiceNo} (₹${consultationFee}) → ` +
      `Sales voucher ${salesVoucher.voucherNumber} + Receipt voucher ${receiptVoucher.voucherNumber} ` +
      `(₹${paidAmount} paid, ₹${consultationFee - paidAmount} outstanding on ${patientLedger.name}).`,
  );
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

  const doctorAsAdminId = roleMap.get('Doctor as Admin');
  const patientRoleId = roleMap.get('Patient');

  const allRoleIds = Array.from(roleMap.values());
  const clinicalRoles = [adminId, doctorId, receptionistId, nurseId, developerId].filter(Boolean);
  const frontDeskRoles = [adminId, receptionistId, developerId].filter(Boolean);
  const pharmacyRoles = [adminId, pharmacistId, developerId].filter(Boolean);

  // Doctor as Admin sees only Dashboard + Appointments in the sidebar
  const doctorAsAdminOnlyRoles = [adminId, doctorAsAdminId, developerId].filter(Boolean);

  const menuItems = [
    // Clinic group
    { label: 'Dashboard', path: '/dashboard', icon: 'LayoutDashboard', group: 'Clinic', sortOrder: 0, roleIds: allRoleIds },
    { label: 'Appointments', path: '/appointments', icon: 'CalendarClock', group: 'Clinic', sortOrder: 1, roleIds: [...frontDeskRoles, doctorId, nurseId].filter(Boolean) },
    { label: 'Appointments', path: '/doctor-admin/appointments', icon: 'CalendarClock', group: 'Clinic', sortOrder: 1, roleIds: [doctorAsAdminId].filter(Boolean) },
    { label: 'Prescriptions', path: '/doctor-admin/prescriptions', icon: 'ClipboardList', group: 'Clinic', sortOrder: 2, roleIds: [doctorAsAdminId].filter(Boolean) },
    { label: 'Patients', path: '/patients', icon: 'Users', group: 'Clinic', sortOrder: 2, roleIds: frontDeskRoles },
    { label: 'Doctors', path: '/doctors', icon: 'UserCog', group: 'Clinic', sortOrder: 3, roleIds: frontDeskRoles },
    { label: 'Prescriptions', path: '/prescriptions', icon: 'ClipboardList', group: 'Clinic', sortOrder: 4, roleIds: clinicalRoles },
    { label: 'Diagnoses', path: '/diagnoses', icon: 'Stethoscope', group: 'Clinic', sortOrder: 5, roleIds: clinicalRoles },

    // OPD Reports group
    { label: 'Daily OPD Summary', path: '/reports/daily-opd-summary', icon: 'Activity', group: 'OPD Reports', sortOrder: 0, roleIds: [adminId, doctorId, receptionistId, developerId].filter(Boolean) },
    { label: 'Doctor-wise OPD', path: '/reports/doctor-wise-opd', icon: 'Stethoscope', group: 'OPD Reports', sortOrder: 1, roleIds: [adminId, doctorId, developerId].filter(Boolean) },
    { label: 'Revenue / Collection', path: '/reports/revenue-collection', icon: 'Wallet', group: 'OPD Reports', sortOrder: 2, roleIds: [adminId, developerId].filter(Boolean) },
    { label: 'Outstanding Payments', path: '/reports/outstanding-payments', icon: 'AlertCircle', group: 'OPD Reports', sortOrder: 3, roleIds: [adminId, developerId].filter(Boolean) },

    // Pharmacy & Billing group
    { label: 'Medicine Catalog', path: '/medicine-catalog', icon: 'Pill', group: 'Pharmacy & Billing', sortOrder: 0, roleIds: pharmacyRoles },
    { label: 'Billing', path: '/billing', icon: 'Receipt', group: 'Pharmacy & Billing', sortOrder: 1, roleIds: pharmacyRoles },
    { label: 'Dispensing', path: '/dispensing', icon: 'Package', group: 'Pharmacy & Billing', sortOrder: 2, roleIds: pharmacyRoles },
    { label: 'Stock Inquiry', path: '/stock-inquiry', icon: 'Search', group: 'Pharmacy & Billing', sortOrder: 3, roleIds: pharmacyRoles },
    { label: 'Purchase Entry', path: '/stock-purchase', icon: 'Truck', group: 'Pharmacy & Billing', sortOrder: 4, roleIds: pharmacyRoles },

    // Organisation group
    { label: 'Overview', path: '/organisation', icon: 'Building2', group: 'Organisation', sortOrder: 0, roleIds: [adminId, developerId].filter(Boolean) },
    { label: 'Rx Templates', path: '/organisation/prescription-templates', icon: 'FileText', group: 'Organisation', sortOrder: 1, roleIds: [adminId, doctorId, developerId].filter(Boolean) },
    { label: 'Shifts', path: '/shifts', icon: 'Clock', group: 'Organisation', sortOrder: 2, roleIds: [adminId, developerId].filter(Boolean) },
    { label: 'Addresses', path: '/addresses', icon: 'MapPin', group: 'Organisation', sortOrder: 3, roleIds: [adminId, developerId].filter(Boolean) },
    { label: 'Users', path: '/organisation/users', icon: 'UserCog', group: 'Organisation', sortOrder: 4, roleIds: [adminId, developerId].filter(Boolean) },
    { label: 'Sidebar Config', path: '/organisation/sidebar-config', icon: 'Settings', group: 'Organisation', sortOrder: 5, roleIds: [adminId, developerId].filter(Boolean) },
    { label: 'Departments', path: '/organisation/departments', icon: 'Building2', group: 'Organisation', sortOrder: 6, roleIds: [adminId, developerId].filter(Boolean) },
    { label: 'Designations', path: '/organisation/designations', icon: 'UserCog', group: 'Organisation', sortOrder: 7, roleIds: [adminId, developerId].filter(Boolean) },
    { label: 'Financial Years', path: '/organisation/financial-years', icon: 'CalendarClock', group: 'Organisation', sortOrder: 8, roleIds: [adminId, developerId].filter(Boolean) },

    // Accounting group
    { label: 'Chart of Accounts', path: '/accounting', icon: 'BookOpen', group: 'Accounting', sortOrder: 0, roleIds: [adminId, developerId].filter(Boolean) },
    { label: 'Ledgers', path: '/accounting/ledgers', icon: 'BookMarked', group: 'Accounting', sortOrder: 1, roleIds: [adminId, developerId].filter(Boolean) },
    { label: 'Vouchers', path: '/accounting/vouchers', icon: 'Receipt', group: 'Accounting', sortOrder: 2, roleIds: [adminId, developerId].filter(Boolean) },

    // Access Control group
    { label: 'Roles & Permissions', path: '/organisation/roles', icon: 'ShieldCheck', group: 'Access Control', sortOrder: 0, roleIds: [adminId, developerId].filter(Boolean) },

    // Developer group
    { label: 'Overview', path: '/developer', icon: 'Cpu', group: 'Developer', sortOrder: 0, roleIds: [developerId].filter(Boolean) },
    { label: 'Modules', path: '/developer/modules', icon: 'Box', group: 'Developer', sortOrder: 1, roleIds: [developerId].filter(Boolean) },
    { label: 'Features', path: '/developer/features', icon: 'Zap', group: 'Developer', sortOrder: 2, roleIds: [developerId].filter(Boolean) },

    // Patient Portal group
    { label: 'Dashboard', path: '/patient', icon: 'LayoutDashboard', group: 'Patient Portal', sortOrder: 0, roleIds: [patientRoleId].filter(Boolean) },
    { label: 'Appointments', path: '/patient/appointments', icon: 'CalendarClock', group: 'Patient Portal', sortOrder: 1, roleIds: [patientRoleId].filter(Boolean) },
    { label: 'Prescriptions', path: '/patient/prescriptions', icon: 'ClipboardList', group: 'Patient Portal', sortOrder: 2, roleIds: [patientRoleId].filter(Boolean) },
    { label: 'Lab Reports', path: '/patient/lab-orders', icon: 'FlaskConical', group: 'Patient Portal', sortOrder: 3, roleIds: [patientRoleId].filter(Boolean) },
    { label: 'Bills', path: '/patient/bills', icon: 'Receipt', group: 'Patient Portal', sortOrder: 4, roleIds: [patientRoleId].filter(Boolean) },

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
