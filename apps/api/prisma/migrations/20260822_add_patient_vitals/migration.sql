-- CreateTable: Create PatientVitals table (immutable — no update/delete)

CREATE TABLE "PatientVitals" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "heightCm" DOUBLE PRECISION,
    "weightKg" DOUBLE PRECISION,
    "bmi" DOUBLE PRECISION,
    "temperatureC" DOUBLE PRECISION,
    "pulseBpm" INTEGER,
    "systolicBp" INTEGER,
    "diastolicBp" INTEGER,
    "spo2Percent" DOUBLE PRECISION,
    "respiratoryRate" INTEGER,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT,

    CONSTRAINT "PatientVitals_pkey" PRIMARY KEY ("id")
);

-- CreateIndexes
CREATE INDEX "PatientVitals_patientId_idx" ON "PatientVitals"("patientId");
CREATE INDEX "PatientVitals_patientId_createdAt_idx" ON "PatientVitals"("patientId", "createdAt");
CREATE INDEX "PatientVitals_createdById_idx" ON "PatientVitals"("createdById");

-- AddForeignKey
ALTER TABLE "PatientVitals" ADD CONSTRAINT "PatientVitals_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientVitals" ADD CONSTRAINT "PatientVitals_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
