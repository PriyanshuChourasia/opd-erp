-- Add version column to Prescription (default 1 for existing records)
ALTER TABLE "Prescription" ADD COLUMN "version" INTEGER NOT NULL DEFAULT 1;

-- Create PrescriptionHistory table for tracking all prescription changes
CREATE TABLE "PrescriptionHistory" (
    "id" TEXT NOT NULL,
    "prescriptionId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "diagnosis" TEXT,
    "notes" TEXT,
    "status" TEXT NOT NULL,
    "items" JSONB NOT NULL,
    "changeType" TEXT NOT NULL DEFAULT 'UPDATE',
    "changeReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT,

    CONSTRAINT "PrescriptionHistory_pkey" PRIMARY KEY ("id")
);

-- Create indexes
CREATE INDEX "PrescriptionHistory_prescriptionId_idx" ON "PrescriptionHistory"("prescriptionId");
CREATE INDEX "PrescriptionHistory_prescriptionId_version_idx" ON "PrescriptionHistory"("prescriptionId", "version");
CREATE INDEX "PrescriptionHistory_createdById_idx" ON "PrescriptionHistory"("createdById");

-- Add foreign key constraint
ALTER TABLE "PrescriptionHistory" ADD CONSTRAINT "PrescriptionHistory_prescriptionId_fkey"
    FOREIGN KEY ("prescriptionId") REFERENCES "Prescription"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PrescriptionHistory" ADD CONSTRAINT "PrescriptionHistory_createdById_fkey"
    FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Seed history for existing prescriptions (version 1, CREATE type)
INSERT INTO "PrescriptionHistory" ("id", "prescriptionId", "version", "diagnosis", "notes", "status", "items", "changeType", "createdAt", "createdById")
SELECT
    gen_random_uuid()::text,
    p."id",
    1,
    p."diagnosis",
    p."notes",
    p."status",
    COALESCE(
        (SELECT jsonb_agg(jsonb_build_object(
            'medicineId', pi."medicineId",
            'medicineName', pi."medicineName",
            'dosage', pi."dosage",
            'duration', pi."duration",
            'instructions', pi."instructions",
            'quantity', pi."quantity",
            'refills', pi."refills"
        )) FROM "PrescriptionItem" pi WHERE pi."prescriptionId" = p."id"),
        '[]'::jsonb
    ),
    'CREATE',
    p."createdAt",
    p."createdById"
FROM "Prescription" p;
