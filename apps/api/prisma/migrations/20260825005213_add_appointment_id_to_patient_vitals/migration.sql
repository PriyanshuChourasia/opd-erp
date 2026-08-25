-- AlterTable
ALTER TABLE "PatientVitals" ADD COLUMN     "appointmentId" TEXT;

-- CreateIndex
CREATE INDEX "PatientVitals_appointmentId_idx" ON "PatientVitals"("appointmentId");

-- AddForeignKey
ALTER TABLE "PatientVitals" ADD CONSTRAINT "PatientVitals_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
