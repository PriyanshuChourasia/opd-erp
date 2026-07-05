"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const patients = [
    { name: 'Aarav Sharma', phone: '9810000001', gender: 'MALE', bloodGroup: 'B+' },
    { name: 'Priya Verma', phone: '9810000002', gender: 'FEMALE', bloodGroup: 'O+' },
    { name: 'Rohan Mehta', phone: '9810000003', gender: 'MALE', bloodGroup: 'A+' },
    { name: 'Ananya Iyer', phone: '9810000004', gender: 'FEMALE', bloodGroup: 'AB+' },
    { name: 'Vikram Singh', phone: '9810000005', gender: 'MALE', bloodGroup: 'O-' },
];
async function main() {
    for (const patient of patients) {
        await prisma.patient.upsert({
            where: { phone: patient.phone },
            update: {},
            create: patient,
        });
    }
    console.log(`Seeded ${patients.length} patients.`);
}
main()
    .catch((err) => {
    console.error(err);
    process.exit(1);
})
    .finally(() => prisma.$disconnect());
//# sourceMappingURL=seed.js.map