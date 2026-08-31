"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
function uuid() {
    return crypto.randomUUID();
}
function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
function randomDate(start, end) {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}
function randomItem(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}
const DOCTOR_ID = 'c95d58c6-c888-440e-8e4f-d84f4ea1487c';
const APPOINTMENT_TYPES = ['CONSULTATION', 'FOLLOW_UP', 'WALK_IN'];
const APPOINTMENT_STATUSES = ['COMPLETED', 'COMPLETED', 'COMPLETED', 'COMPLETED', 'COMPLETED', 'CANCELLED', 'NO_SHOW', 'SCHEDULED', 'CHECKED_IN'];
const PAYMENT_METHODS = ['CASH', 'CASH', 'CASH', 'UPI', 'CARD'];
const BILL_STATUSES = ['PAID', 'PAID', 'PAID', 'PARTIAL', 'PENDING'];
const DIAGNOSES = [
    'Upper Respiratory Tract Infection', 'Hypertension', 'Type 2 Diabetes Mellitus',
    'Gastroesophageal Reflux Disease', 'Migraine', 'Acute Bronchitis',
    'Allergic Rhinitis', 'Low Back Pain', 'Iron Deficiency Anemia',
    'Urinary Tract Infection', 'Dyslipidemia', 'Hypothyroidism',
    'Pharyngitis', 'Conjunctivitis', 'Dermatitis',
    'Seasonal Fever', 'Joint Pain', 'Chest Infection',
    'Insomnia', 'Vertigo',
];
const MEDICINES = [
    { id: '714fdcce-3a10-445d-bc4c-615a7cf20b89', name: 'Paracetamol' },
    { id: '68ffa958-a7ff-4db0-ab6c-3045084c7275', name: 'Ibuprofen' },
    { id: 'c7b9a1bd-f58c-4a30-aaaf-da33c945cdb0', name: 'Amoxicillin' },
    { id: 'c1f4a9ef-e1ae-46c8-ae09-b185a65bba9f', name: 'Azithromycin' },
    { id: '309b8012-3a59-45d9-8da8-5ec1cd444f6b', name: 'Cefixime' },
    { id: '75e19560-2c4a-422c-87c2-b48381debbe7', name: 'Levofloxacin' },
    { id: '454f01e9-dd27-4598-bffb-883c35bba12c', name: 'Metronidazole' },
    { id: '0e90efd9-22ef-477f-ab73-3995d402df81', name: 'Omeprazole' },
    { id: 'a5a5b41b-6903-4c78-be98-0bcf9e826e6e', name: 'Pantoprazole' },
    { id: '97ef1746-8c11-4c1d-934d-87f87ae00a9d', name: 'Cetirizine' },
    { id: '648da3fa-4f47-40e1-bd3b-5161634c1761', name: 'Metformin' },
    { id: 'a15b8aaa-13e0-4341-bb6a-1fe36fc7ef8d', name: 'Vitamin B12' },
    { id: '796afbc9-6881-4fc9-a871-183a1342cc61', name: 'Calcium + Vitamin D3' },
    { id: '9655e298-1b02-4d62-ba57-cba6b0a218a9', name: 'Vitamin B Complex' },
];
const DOSAGES = ['500mg', '250mg', '100mg', '10mg', '20mg', '400mg', '1g', '5ml', '15ml'];
const DURATIONS = ['5 days', '7 days', '10 days', '14 days', '21 days', '30 days'];
const INSTRUCTIONS = [
    'After meals', 'Before meals', 'Twice daily', 'Once daily at night',
    'After breakfast and dinner', 'With water', 'As needed for pain',
    'Before sleeping', 'Empty stomach',
];
async function main() {
    console.log('🌱 Seeding demo data...');
    const patients = await prisma.patient.findMany({
        where: { deletedAt: null },
        select: { id: true, firstName: true, lastName: true, isFollowUp: true },
    });
    console.log(`  Found ${patients.length} existing patients`);
    if (patients.length === 0) {
        console.error('❌ No patients found. Create patients first.');
        return;
    }
    console.log('  Creating doctors...');
    const extraDoctors = [];
    const doctorData = [
        { spec: 'Cardiology', regNo: 'MCI-10002', fee: 800, firstName: 'Anil', lastName: 'Gupta' },
        { spec: 'Dermatology', regNo: 'MCI-10003', fee: 600, firstName: 'Sneha', lastName: 'Rao' },
        { spec: 'Pediatrics', regNo: 'MCI-10004', fee: 700, firstName: 'Rajesh', lastName: 'Kumar' },
    ];
    for (const d of doctorData) {
        const existing = await prisma.doctor.findUnique({ where: { medicalRegistrationNo: d.regNo } });
        if (existing) {
            extraDoctors.push({ id: existing.id, name: `Dr. ${d.firstName} ${d.lastName}` });
            continue;
        }
        const doctorId = uuid();
        await prisma.$transaction(async (tx) => {
            const doctor = await tx.doctor.create({
                data: {
                    id: doctorId,
                    qualification: 'MBBS, MD',
                    specialization: d.spec,
                    medicalRegistrationNo: d.regNo,
                    consultationFee: d.fee,
                    isActive: true,
                },
            });
            const doctorRole = await tx.role.findFirst({ where: { name: 'Doctor' } });
            if (doctorRole) {
                await tx.user.create({
                    data: {
                        username: d.firstName.toLowerCase() + d.lastName.toLowerCase(),
                        firstName: d.firstName,
                        lastName: d.lastName,
                        email: `${d.firstName.toLowerCase()}.${d.lastName.toLowerCase()}@clinic.com`,
                        password: '$2a$10$placeholder',
                        roleId: doctorRole.id,
                        userableType: 'Doctor',
                        userableId: doctorId,
                    },
                });
            }
            extraDoctors.push({ id: doctorId, name: `Dr. ${d.firstName} ${d.lastName}` });
        });
        console.log(`    Created Dr. ${d.firstName} ${d.lastName} (${d.spec})`);
    }
    const allDoctors = [
        { id: DOCTOR_ID, name: 'Dr. Vikram Mehta' },
        ...extraDoctors,
    ];
    console.log(`  Total doctors: ${allDoctors.length}`);
    const today = new Date();
    const twoMonthsAgo = new Date(today);
    twoMonthsAgo.setMonth(today.getMonth() - 2);
    const receptionistUser = await prisma.user.findFirst({ where: { email: 'receptionist@clinic.com' } });
    const adminUser = await prisma.user.findFirst({ where: { email: 'admin@clinic.com' } });
    const createdByUserId = receptionistUser?.id ?? adminUser?.id ?? null;
    const appointmentCount = 70;
    console.log(`  Creating ${appointmentCount} appointments...`);
    const appointmentPatients = patients.slice(0, Math.min(20, patients.length));
    const appointmentIds = [];
    for (let i = 0; i < appointmentCount; i++) {
        const patient = randomItem(appointmentPatients);
        const doctor = randomItem(allDoctors);
        const date = randomDate(twoMonthsAgo, today);
        date.setHours(randomInt(9, 16), randomInt(0, 5) * 10, 0, 0);
        date.setMilliseconds(0);
        const type = randomItem(APPOINTMENT_TYPES);
        const status = randomItem(APPOINTMENT_STATUSES);
        const tokenNum = `T${String(i + 1).padStart(4, '0')}`;
        const amount = randomItem([0, 200, 300, 500, 700, 800, 1000]);
        const registrationFee = i < 10 ? 100 : 0;
        const apptId = uuid();
        appointmentIds.push(apptId);
        await prisma.appointment.create({
            data: {
                id: apptId,
                patientId: patient.id,
                doctorId: doctor.id,
                date,
                type,
                status,
                tokenNumber: tokenNum,
                amount,
                registrationFee,
                reasonForVisit: randomItem([
                    'Fever and cold', 'Routine checkup', 'Follow-up visit',
                    'Persistent cough', 'Back pain', 'Skin rash',
                    'Stomach ache', 'Headache', 'Blood sugar check',
                    'BP check', 'Joint pain', 'Eye irritation',
                ]),
                notes: randomItem([
                    null, null, null,
                    'Patient advised rest', 'Follow up in 2 weeks',
                    'Referred for lab tests', 'Prescribed medication',
                ]),
                createdAt: date,
                createdById: createdByUserId,
            },
        });
        await prisma.queueEntry.create({
            data: {
                id: uuid(),
                tokenNumber: tokenNum,
                patientId: patient.id,
                doctorId: doctor.id,
                status: status === 'COMPLETED' ? 'COMPLETED' : status === 'CANCELLED' ? 'CANCELLED' : 'WAITING',
                queueDate: date,
                appointmentId: apptId,
                createdAt: date,
                createdById: createdByUserId,
            },
        });
        if (status === 'COMPLETED' || status === 'SCHEDULED') {
            const billStatus = randomItem(BILL_STATUSES);
            const billTotal = amount + (registrationFee > 0 ? registrationFee : 0);
            const paidAmount = billStatus === 'PAID' ? billTotal
                : billStatus === 'PARTIAL' ? Math.floor(billTotal * 0.5)
                    : 0;
            const invoiceNo = `INV-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}-${String(i + 1).padStart(4, '0')}`;
            await prisma.bill.create({
                data: {
                    id: uuid(),
                    patientId: patient.id,
                    appointmentId: apptId,
                    invoiceNo,
                    subtotal: billTotal,
                    discount: 0,
                    tax: 0,
                    total: billTotal,
                    paidAmount,
                    paymentMethod: randomItem(PAYMENT_METHODS),
                    status: billStatus,
                    referenceNumber: billStatus !== 'CASH' ? `TXN-${randomInt(100000, 999999)}` : null,
                    createdAt: date,
                    createdById: createdByUserId,
                },
            });
        }
        if (status === 'COMPLETED') {
            const temp = randomInt(97, 102) + Math.random() * 0.9;
            await prisma.patientVitals.create({
                data: {
                    id: uuid(),
                    patientId: patient.id,
                    heightCm: randomInt(145, 185) + Math.random(),
                    weightKg: randomInt(45, 95) + Math.random(),
                    bmi: randomInt(18, 32) + Math.random(),
                    temperatureC: Math.round(temp * 10) / 10,
                    pulseBpm: randomInt(60, 100),
                    systolicBp: randomInt(110, 150),
                    diastolicBp: randomInt(70, 95),
                    spo2Percent: randomInt(94, 100) + Math.random(),
                    respiratoryRate: randomInt(14, 22),
                    recordedAt: date,
                    appointmentId: apptId,
                    medicalStatus: randomItem([
                        null, null, null,
                        'Stable', 'Mild fever', 'Elevated BP',
                        'Normal', 'Underweight',
                    ]),
                    createdAt: date,
                    createdById: createdByUserId,
                },
            });
        }
        if (status === 'COMPLETED') {
            const prescriptionId = uuid();
            const diagnosis = randomItem(DIAGNOSES);
            const numMeds = randomInt(1, 4);
            const meds = [];
            for (let m = 0; m < numMeds; m++) {
                const med = randomItem(MEDICINES);
                if (!meds.find((x) => x.id === med.id))
                    meds.push(med);
            }
            await prisma.prescription.create({
                data: {
                    id: prescriptionId,
                    patientId: patient.id,
                    doctorId: doctor.id,
                    diagnosis,
                    notes: randomItem([
                        null, null,
                        'Follow up after course completion',
                        'Avoid spicy food', 'Take rest for 3 days',
                        'Drink plenty of water',
                    ]),
                    status: 'ACTIVE',
                    version: 1,
                    createdAt: date,
                    createdById: createdByUserId,
                },
            });
            for (const med of meds) {
                await prisma.prescriptionItem.create({
                    data: {
                        id: uuid(),
                        prescriptionId,
                        medicineId: med.id,
                        medicineName: med.name,
                        dosage: randomItem(DOSAGES),
                        duration: randomItem(DURATIONS),
                        instructions: randomItem(INSTRUCTIONS),
                        quantity: randomInt(1, 3),
                        refills: randomInt(0, 2),
                        createdAt: date,
                        createdById: createdByUserId,
                    },
                });
            }
        }
    }
    console.log(`  Created ${appointmentCount} appointments with bills, vitals, and prescriptions`);
    console.log('  Date range: ' + twoMonthsAgo.toISOString().slice(0, 10) + ' to ' + today.toISOString().slice(0, 10));
    const counts = await Promise.all([
        prisma.appointment.count({ where: { deletedAt: null } }),
        prisma.bill.count({ where: { deletedAt: null } }),
        prisma.prescription.count({ where: { deletedAt: null } }),
        prisma.prescriptionItem.count(),
        prisma.patientVitals.count({ where: { deletedAt: null } }),
        prisma.queueEntry.count(),
        prisma.doctor.count({ where: { deletedAt: null, isActive: true } }),
    ]);
    console.log('\n📊 Final counts:');
    console.log(`  Appointments: ${counts[0]}`);
    console.log(`  Bills: ${counts[1]}`);
    console.log(`  Prescriptions: ${counts[2]}`);
    console.log(`  Prescription Items: ${counts[3]}`);
    console.log(`  Patient Vitals: ${counts[4]}`);
    console.log(`  Queue Entries: ${counts[5]}`);
    console.log(`  Active Doctors: ${counts[6]}`);
    console.log('\n✅ Demo data seeded successfully!');
}
main()
    .catch((e) => {
    console.error('❌ Error seeding demo data:', e);
    process.exit(1);
})
    .finally(() => prisma.$disconnect());
//# sourceMappingURL=seed-demo-data.js.map