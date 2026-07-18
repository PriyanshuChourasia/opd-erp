-- AlterTable: tokenNumber Int -> String for Appointment
-- USING clause ensures existing integer values are cast to text
ALTER TABLE "Appointment" ALTER COLUMN "tokenNumber" TYPE TEXT USING "tokenNumber"::text;

-- AlterTable: tokenNumber Int -> String for QueueEntry
-- Drop the unique constraint first since it involves tokenNumber
DROP INDEX IF EXISTS "QueueEntry_doctorId_queueDate_tokenNumber_key";
ALTER TABLE "QueueEntry" ALTER COLUMN "tokenNumber" TYPE TEXT USING "tokenNumber"::text;
CREATE UNIQUE INDEX "QueueEntry_doctorId_queueDate_tokenNumber_key" ON "QueueEntry"("doctorId", "queueDate", "tokenNumber");
