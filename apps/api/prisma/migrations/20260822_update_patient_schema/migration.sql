-- AlterTable: Update Patient table with new field structure

-- Add new columns
ALTER TABLE "Patient" ADD COLUMN "patientCode" TEXT;
ALTER TABLE "Patient" ADD COLUMN "firstName" TEXT;
ALTER TABLE "Patient" ADD COLUMN "middleName" TEXT;
ALTER TABLE "Patient" ADD COLUMN "lastName" TEXT;
ALTER TABLE "Patient" ADD COLUMN "altContactNo" TEXT;

-- Rename columns
ALTER TABLE "Patient" RENAME COLUMN "name" TO "firstName_old";
ALTER TABLE "Patient" RENAME COLUMN "phone" TO "contactNo";

-- Copy data from old name field to firstName (assuming name contains first name or full name)
UPDATE "Patient" SET "firstName" = "firstName_old";

-- Drop old name column
ALTER TABLE "Patient" DROP COLUMN "firstName_old";

-- Make firstName and lastName required (they should have data now)
ALTER TABLE "Patient" ALTER COLUMN "firstName" SET NOT NULL;
ALTER TABLE "Patient" ALTER COLUMN "lastName" SET NOT NULL;

-- Make contactNo required (it was already unique)
ALTER TABLE "Patient" ALTER COLUMN "contactNo" SET NOT NULL;

-- Add unique constraint for patientCode
ALTER TABLE "Patient" ADD CONSTRAINT "Patient_patientCode_key" UNIQUE ("patientCode");

-- Add indexes
CREATE INDEX "Patient_patientCode_idx" ON "Patient"("patientCode");
CREATE INDEX "Patient_firstName_idx" ON "Patient"("firstName");
CREATE INDEX "Patient_lastName_idx" ON "Patient"("lastName");
