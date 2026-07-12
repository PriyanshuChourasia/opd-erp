-- Link a Bill back to the Appointment it was invoiced from (one invoice per appointment)
ALTER TABLE "Bill" ADD COLUMN "appointmentId" TEXT;

CREATE UNIQUE INDEX "Bill_appointmentId_key" ON "Bill"("appointmentId");

ALTER TABLE "Bill" ADD CONSTRAINT "Bill_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
