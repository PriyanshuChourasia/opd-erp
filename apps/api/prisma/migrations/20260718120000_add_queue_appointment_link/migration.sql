-- Link a QueueEntry back to the Appointment it originated from (or was paired with), so a completed queue entry can surface its invoice
ALTER TABLE "QueueEntry" ADD COLUMN "appointmentId" TEXT;

CREATE UNIQUE INDEX "QueueEntry_appointmentId_key" ON "QueueEntry"("appointmentId");

ALTER TABLE "QueueEntry" ADD CONSTRAINT "QueueEntry_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
