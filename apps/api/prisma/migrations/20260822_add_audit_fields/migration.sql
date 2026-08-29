-- AlterTable: Add createdById and updatedById columns to all tables

-- Role
ALTER TABLE "Role" ADD COLUMN "createdById" TEXT;
ALTER TABLE "Role" ADD COLUMN "updatedById" TEXT;

-- Permission
ALTER TABLE "Permission" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Permission" ADD COLUMN "createdById" TEXT;
ALTER TABLE "Permission" ADD COLUMN "updatedById" TEXT;

-- RefreshToken
ALTER TABLE "RefreshToken" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "RefreshToken" ADD COLUMN "createdById" TEXT;
ALTER TABLE "RefreshToken" ADD COLUMN "updatedById" TEXT;

-- Allergy
ALTER TABLE "Allergy" ADD COLUMN "createdById" TEXT;
ALTER TABLE "Allergy" ADD COLUMN "updatedById" TEXT;

-- PatientAllergy
ALTER TABLE "PatientAllergy" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "PatientAllergy" ADD COLUMN "createdById" TEXT;
ALTER TABLE "PatientAllergy" ADD COLUMN "updatedById" TEXT;

-- Diagnosis
ALTER TABLE "Diagnosis" ADD COLUMN "createdById" TEXT;
ALTER TABLE "Diagnosis" ADD COLUMN "updatedById" TEXT;

-- Patient
ALTER TABLE "Patient" ADD COLUMN "createdById" TEXT;
ALTER TABLE "Patient" ADD COLUMN "updatedById" TEXT;

-- Doctor
ALTER TABLE "Doctor" ADD COLUMN "createdById" TEXT;
ALTER TABLE "Doctor" ADD COLUMN "updatedById" TEXT;

-- QueueEntry
ALTER TABLE "QueueEntry" ADD COLUMN "createdById" TEXT;
ALTER TABLE "QueueEntry" ADD COLUMN "updatedById" TEXT;

-- Appointment
ALTER TABLE "Appointment" ADD COLUMN "updatedById" TEXT;

-- Medicine
ALTER TABLE "Medicine" ADD COLUMN "createdById" TEXT;
ALTER TABLE "Medicine" ADD COLUMN "updatedById" TEXT;

-- Prescription
ALTER TABLE "Prescription" ADD COLUMN "createdById" TEXT;
ALTER TABLE "Prescription" ADD COLUMN "updatedById" TEXT;

-- PrescriptionItem
ALTER TABLE "PrescriptionItem" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "PrescriptionItem" ADD COLUMN "createdById" TEXT;
ALTER TABLE "PrescriptionItem" ADD COLUMN "updatedById" TEXT;

-- LabOrder
ALTER TABLE "LabOrder" ADD COLUMN "createdById" TEXT;
ALTER TABLE "LabOrder" ADD COLUMN "updatedById" TEXT;

-- RadiologyOrder
ALTER TABLE "RadiologyOrder" ADD COLUMN "createdById" TEXT;
ALTER TABLE "RadiologyOrder" ADD COLUMN "updatedById" TEXT;

-- ProcedureOrder
ALTER TABLE "ProcedureOrder" ADD COLUMN "createdById" TEXT;
ALTER TABLE "ProcedureOrder" ADD COLUMN "updatedById" TEXT;

-- Bill
ALTER TABLE "Bill" ADD COLUMN "createdById" TEXT;
ALTER TABLE "Bill" ADD COLUMN "updatedById" TEXT;

-- BillItem
ALTER TABLE "BillItem" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "BillItem" ADD COLUMN "createdById" TEXT;
ALTER TABLE "BillItem" ADD COLUMN "updatedById" TEXT;

-- Dispensing
ALTER TABLE "Dispensing" ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Dispensing" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Dispensing" ADD COLUMN "createdById" TEXT;
ALTER TABLE "Dispensing" ADD COLUMN "updatedById" TEXT;

-- Shift
ALTER TABLE "Shift" ADD COLUMN "createdById" TEXT;
ALTER TABLE "Shift" ADD COLUMN "updatedById" TEXT;

-- EmployeeSchedule
ALTER TABLE "EmployeeSchedule" ADD COLUMN "createdById" TEXT;
ALTER TABLE "EmployeeSchedule" ADD COLUMN "updatedById" TEXT;

-- Address
ALTER TABLE "Address" ADD COLUMN "createdById" TEXT;
ALTER TABLE "Address" ADD COLUMN "updatedById" TEXT;

-- Document
ALTER TABLE "Document" ADD COLUMN "createdById" TEXT;
ALTER TABLE "Document" ADD COLUMN "updatedById" TEXT;

-- Organisation
ALTER TABLE "Organisation" ADD COLUMN "createdById" TEXT;
ALTER TABLE "Organisation" ADD COLUMN "updatedById" TEXT;

-- AddIndexes
CREATE INDEX "Role_createdById_idx" ON "Role"("createdById");
CREATE INDEX "Role_updatedById_idx" ON "Role"("updatedById");
CREATE INDEX "Permission_createdById_idx" ON "Permission"("createdById");
CREATE INDEX "Permission_updatedById_idx" ON "Permission"("updatedById");
CREATE INDEX "RefreshToken_createdById_idx" ON "RefreshToken"("createdById");
CREATE INDEX "RefreshToken_updatedById_idx" ON "RefreshToken"("updatedById");
CREATE INDEX "Allergy_createdById_idx" ON "Allergy"("createdById");
CREATE INDEX "Allergy_updatedById_idx" ON "Allergy"("updatedById");
CREATE INDEX "PatientAllergy_createdById_idx" ON "PatientAllergy"("createdById");
CREATE INDEX "PatientAllergy_updatedById_idx" ON "PatientAllergy"("updatedById");
CREATE INDEX "Diagnosis_createdById_idx" ON "Diagnosis"("createdById");
CREATE INDEX "Diagnosis_updatedById_idx" ON "Diagnosis"("updatedById");
CREATE INDEX "Patient_createdById_idx" ON "Patient"("createdById");
CREATE INDEX "Patient_updatedById_idx" ON "Patient"("updatedById");
CREATE INDEX "Doctor_createdById_idx" ON "Doctor"("createdById");
CREATE INDEX "Doctor_updatedById_idx" ON "Doctor"("updatedById");
CREATE INDEX "QueueEntry_createdById_idx" ON "QueueEntry"("createdById");
CREATE INDEX "QueueEntry_updatedById_idx" ON "QueueEntry"("updatedById");
CREATE INDEX "Appointment_updatedById_idx" ON "Appointment"("updatedById");
CREATE INDEX "Medicine_createdById_idx" ON "Medicine"("createdById");
CREATE INDEX "Medicine_updatedById_idx" ON "Medicine"("updatedById");
CREATE INDEX "Prescription_createdById_idx" ON "Prescription"("createdById");
CREATE INDEX "Prescription_updatedById_idx" ON "Prescription"("updatedById");
CREATE INDEX "PrescriptionItem_createdById_idx" ON "PrescriptionItem"("createdById");
CREATE INDEX "PrescriptionItem_updatedById_idx" ON "PrescriptionItem"("updatedById");
CREATE INDEX "LabOrder_createdById_idx" ON "LabOrder"("createdById");
CREATE INDEX "LabOrder_updatedById_idx" ON "LabOrder"("updatedById");
CREATE INDEX "RadiologyOrder_createdById_idx" ON "RadiologyOrder"("createdById");
CREATE INDEX "RadiologyOrder_updatedById_idx" ON "RadiologyOrder"("updatedById");
CREATE INDEX "ProcedureOrder_createdById_idx" ON "ProcedureOrder"("createdById");
CREATE INDEX "ProcedureOrder_updatedById_idx" ON "ProcedureOrder"("updatedById");
CREATE INDEX "Bill_createdById_idx" ON "Bill"("createdById");
CREATE INDEX "Bill_updatedById_idx" ON "Bill"("updatedById");
CREATE INDEX "BillItem_createdById_idx" ON "BillItem"("createdById");
CREATE INDEX "BillItem_updatedById_idx" ON "BillItem"("updatedById");
CREATE INDEX "Dispensing_createdById_idx" ON "Dispensing"("createdById");
CREATE INDEX "Dispensing_updatedById_idx" ON "Dispensing"("updatedById");
CREATE INDEX "Shift_createdById_idx" ON "Shift"("createdById");
CREATE INDEX "Shift_updatedById_idx" ON "Shift"("updatedById");
CREATE INDEX "EmployeeSchedule_createdById_idx" ON "EmployeeSchedule"("createdById");
CREATE INDEX "EmployeeSchedule_updatedById_idx" ON "EmployeeSchedule"("updatedById");
CREATE INDEX "Address_createdById_idx" ON "Address"("createdById");
CREATE INDEX "Address_updatedById_idx" ON "Address"("updatedById");
CREATE INDEX "Document_createdById_idx" ON "Document"("createdById");
CREATE INDEX "Document_updatedById_idx" ON "Document"("updatedById");
CREATE INDEX "Organisation_createdById_idx" ON "Organisation"("createdById");
CREATE INDEX "Organisation_updatedById_idx" ON "Organisation"("updatedById");

-- AddForeignKeys
ALTER TABLE "Role" ADD CONSTRAINT "Role_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Role" ADD CONSTRAINT "Role_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Permission" ADD CONSTRAINT "Permission_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Permission" ADD CONSTRAINT "Permission_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Allergy" ADD CONSTRAINT "Allergy_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Allergy" ADD CONSTRAINT "Allergy_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PatientAllergy" ADD CONSTRAINT "PatientAllergy_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PatientAllergy" ADD CONSTRAINT "PatientAllergy_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Diagnosis" ADD CONSTRAINT "Diagnosis_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Diagnosis" ADD CONSTRAINT "Diagnosis_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Patient" ADD CONSTRAINT "Patient_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Patient" ADD CONSTRAINT "Patient_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Doctor" ADD CONSTRAINT "Doctor_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Doctor" ADD CONSTRAINT "Doctor_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "QueueEntry" ADD CONSTRAINT "QueueEntry_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "QueueEntry" ADD CONSTRAINT "QueueEntry_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Medicine" ADD CONSTRAINT "Medicine_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Medicine" ADD CONSTRAINT "Medicine_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Prescription" ADD CONSTRAINT "Prescription_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Prescription" ADD CONSTRAINT "Prescription_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PrescriptionItem" ADD CONSTRAINT "PrescriptionItem_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PrescriptionItem" ADD CONSTRAINT "PrescriptionItem_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "LabOrder" ADD CONSTRAINT "LabOrder_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "LabOrder" ADD CONSTRAINT "LabOrder_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "RadiologyOrder" ADD CONSTRAINT "RadiologyOrder_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "RadiologyOrder" ADD CONSTRAINT "RadiologyOrder_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ProcedureOrder" ADD CONSTRAINT "ProcedureOrder_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ProcedureOrder" ADD CONSTRAINT "ProcedureOrder_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Bill" ADD CONSTRAINT "Bill_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Bill" ADD CONSTRAINT "Bill_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "BillItem" ADD CONSTRAINT "BillItem_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "BillItem" ADD CONSTRAINT "BillItem_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Dispensing" ADD CONSTRAINT "Dispensing_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Dispensing" ADD CONSTRAINT "Dispensing_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Shift" ADD CONSTRAINT "Shift_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Shift" ADD CONSTRAINT "Shift_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "EmployeeSchedule" ADD CONSTRAINT "EmployeeSchedule_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "EmployeeSchedule" ADD CONSTRAINT "EmployeeSchedule_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Address" ADD CONSTRAINT "Address_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Address" ADD CONSTRAINT "Address_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Document" ADD CONSTRAINT "Document_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Document" ADD CONSTRAINT "Document_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Organisation" ADD CONSTRAINT "Organisation_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Organisation" ADD CONSTRAINT "Organisation_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
