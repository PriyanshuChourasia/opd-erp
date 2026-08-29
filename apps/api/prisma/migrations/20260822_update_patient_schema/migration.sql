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

-- Split old full name into firstName/lastName (first word = firstName, remainder = lastName)
UPDATE "Patient" SET
  "firstName" = split_part(trim("firstName_old"), ' ', 1),
  "lastName" = NULLIF(trim(substring(trim("firstName_old") from length(split_part(trim("firstName_old"), ' ', 1)) + 1)), '');

-- Fall back to a placeholder where no last name could be derived
UPDATE "Patient" SET "lastName" = 'Unknown' WHERE "lastName" IS NULL;

-- Backfill patientCode for pre-existing rows so the NOT NULL/unique constraints below hold
UPDATE "Patient" SET "patientCode" = 'LEGACY-' || substring(id from 1 for 8) WHERE "patientCode" IS NULL;

-- Drop old name column
ALTER TABLE "Patient" DROP COLUMN "firstName_old";

-- Make firstName, lastName and patientCode required (they should have data now)
ALTER TABLE "Patient" ALTER COLUMN "firstName" SET NOT NULL;
ALTER TABLE "Patient" ALTER COLUMN "lastName" SET NOT NULL;
ALTER TABLE "Patient" ALTER COLUMN "patientCode" SET NOT NULL;

-- Make contactNo required (it was already unique)
ALTER TABLE "Patient" ALTER COLUMN "contactNo" SET NOT NULL;

-- Add unique constraint for patientCode
ALTER TABLE "Patient" ADD CONSTRAINT "Patient_patientCode_key" UNIQUE ("patientCode");

-- Add indexes
CREATE INDEX "Patient_patientCode_idx" ON "Patient"("patientCode");
CREATE INDEX "Patient_firstName_idx" ON "Patient"("firstName");
CREATE INDEX "Patient_lastName_idx" ON "Patient"("lastName");
