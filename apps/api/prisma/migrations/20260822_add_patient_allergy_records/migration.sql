-- CreateTable: Create PatientAllergyRecord table

CREATE TABLE "PatientAllergyRecord" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "allergen" TEXT NOT NULL,
    "allergyType" TEXT,
    "reaction" TEXT,
    "severity" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT,
    "updatedById" TEXT,

    CONSTRAINT "PatientAllergyRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndexes
CREATE INDEX "PatientAllergyRecord_patientId_idx" ON "PatientAllergyRecord"("patientId");
CREATE INDEX "PatientAllergyRecord_patientId_status_idx" ON "PatientAllergyRecord"("patientId", "status");
CREATE INDEX "PatientAllergyRecord_createdById_idx" ON "PatientAllergyRecord"("createdById");
CREATE INDEX "PatientAllergyRecord_updatedById_idx" ON "PatientAllergyRecord"("updatedById");

-- AddForeignKey
ALTER TABLE "PatientAllergyRecord" ADD CONSTRAINT "PatientAllergyRecord_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientAllergyRecord" ADD CONSTRAINT "PatientAllergyRecord_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientAllergyRecord" ADD CONSTRAINT "PatientAllergyRecord_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
