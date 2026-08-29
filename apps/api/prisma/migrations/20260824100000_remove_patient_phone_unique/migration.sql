-- Drop the unique constraint and unique index on Patient.contactNo to allow duplicate phone numbers
ALTER TABLE "Patient" DROP CONSTRAINT IF EXISTS "Patient_contactNo_key";
DROP INDEX IF EXISTS "Patient_contactNo_key";

-- Recreate the index for search performance (without uniqueness)
CREATE INDEX IF NOT EXISTS "Patient_contactNo_idx" ON "Patient"("contactNo");
