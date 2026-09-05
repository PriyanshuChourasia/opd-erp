-- AlterTable: Add soft-delete fields to remaining business modules
ALTER TABLE "Appointment" ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "Appointment" ADD COLUMN "deletedById" TEXT;

ALTER TABLE "Prescription" ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "Prescription" ADD COLUMN "deletedById" TEXT;

ALTER TABLE "Bill" ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "Bill" ADD COLUMN "deletedById" TEXT;

ALTER TABLE "Diagnosis" ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "Diagnosis" ADD COLUMN "deletedById" TEXT;

ALTER TABLE "DiagnosisSystem" ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "DiagnosisSystem" ADD COLUMN "deletedById" TEXT;

ALTER TABLE "Dispensing" ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "Dispensing" ADD COLUMN "deletedById" TEXT;

ALTER TABLE "LabOrder" ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "LabOrder" ADD COLUMN "deletedById" TEXT;

ALTER TABLE "ProcedureOrder" ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "ProcedureOrder" ADD COLUMN "deletedById" TEXT;

ALTER TABLE "RadiologyOrder" ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "RadiologyOrder" ADD COLUMN "deletedById" TEXT;

ALTER TABLE "EmployeeSchedule" ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "EmployeeSchedule" ADD COLUMN "deletedById" TEXT;
