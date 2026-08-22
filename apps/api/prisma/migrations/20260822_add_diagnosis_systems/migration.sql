-- CreateTable: DiagnosisSystem
CREATE TABLE "DiagnosisSystem" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "version" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT,
    "updatedById" TEXT,

    CONSTRAINT "DiagnosisSystem_pkey" PRIMARY KEY ("id")
);

-- CreateIndexes for DiagnosisSystem
CREATE UNIQUE INDEX "DiagnosisSystem_code_key" ON "DiagnosisSystem"("code");
CREATE INDEX "DiagnosisSystem_code_idx" ON "DiagnosisSystem"("code");
CREATE INDEX "DiagnosisSystem_createdById_idx" ON "DiagnosisSystem"("createdById");
CREATE INDEX "DiagnosisSystem_updatedById_idx" ON "DiagnosisSystem"("updatedById");

-- Add foreign keys for DiagnosisSystem
ALTER TABLE "DiagnosisSystem" ADD CONSTRAINT "DiagnosisSystem_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "DiagnosisSystem" ADD CONSTRAINT "DiagnosisSystem_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AlterTable: Update Diagnosis model
-- Add new columns
ALTER TABLE "Diagnosis" ADD COLUMN "diagnosisSystemId" TEXT;
ALTER TABLE "Diagnosis" ADD COLUMN "code" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Diagnosis" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'ACTIVE';

-- Migrate data: set code = icdCode (or name if no icdCode)
UPDATE "Diagnosis" SET "code" = COALESCE("icdCode", "name") WHERE "code" = '';

-- Migrate data: set status from isActive
UPDATE "Diagnosis" SET "status" = CASE WHEN "isActive" = true THEN 'ACTIVE' ELSE 'INACTIVE' END;

-- Drop old columns
ALTER TABLE "Diagnosis" DROP COLUMN "icdCode";
ALTER TABLE "Diagnosis" DROP COLUMN "isActive";

-- Add indexes for new columns
CREATE INDEX "Diagnosis_diagnosisSystemId_idx" ON "Diagnosis"("diagnosisSystemId");
CREATE INDEX "Diagnosis_code_idx" ON "Diagnosis"("code");

-- Add foreign key for diagnosisSystemId
ALTER TABLE "Diagnosis" ADD CONSTRAINT "Diagnosis_diagnosisSystemId_fkey" FOREIGN KEY ("diagnosisSystemId") REFERENCES "DiagnosisSystem"("id") ON DELETE SET NULL ON UPDATE CASCADE;
