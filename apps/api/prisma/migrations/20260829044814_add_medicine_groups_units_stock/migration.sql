/*
  Warnings:

  - You are about to drop the `FinancialYear` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "FinancialYear" DROP CONSTRAINT "FinancialYear_createdById_fkey";

-- DropForeignKey
ALTER TABLE "FinancialYear" DROP CONSTRAINT "FinancialYear_organisationId_fkey";

-- DropForeignKey
ALTER TABLE "FinancialYear" DROP CONSTRAINT "FinancialYear_updatedById_fkey";

-- DropIndex
DROP INDEX "Allergy_createdById_idx";

-- DropIndex
DROP INDEX "Allergy_updatedById_idx";

-- DropIndex
DROP INDEX "Diagnosis_name_key";

-- DropIndex
DROP INDEX "Doctor_createdById_idx";

-- DropIndex
DROP INDEX "Doctor_updatedById_idx";

-- DropIndex
DROP INDEX "Medicine_createdById_idx";

-- DropIndex
DROP INDEX "Medicine_updatedById_idx";

-- DropIndex
DROP INDEX "Organisation_createdById_idx";

-- DropIndex
DROP INDEX "Organisation_updatedById_idx";

-- DropIndex
DROP INDEX "Patient_contactNo_idx";

-- DropIndex
DROP INDEX "Patient_createdById_idx";

-- DropIndex
DROP INDEX "Patient_phone_key";

-- DropIndex
DROP INDEX "Patient_updatedById_idx";

-- DropIndex
DROP INDEX "PatientAllergy_createdById_idx";

-- DropIndex
DROP INDEX "PatientAllergy_updatedById_idx";

-- DropIndex
DROP INDEX "Permission_createdById_idx";

-- DropIndex
DROP INDEX "Permission_updatedById_idx";

-- DropIndex
DROP INDEX "PrescriptionTemplate_createdById_idx";

-- DropIndex
DROP INDEX "PrescriptionTemplate_updatedById_idx";

-- DropIndex
DROP INDEX "QueueEntry_createdById_idx";

-- DropIndex
DROP INDEX "QueueEntry_updatedById_idx";

-- DropIndex
DROP INDEX "RefreshToken_createdById_idx";

-- DropIndex
DROP INDEX "RefreshToken_updatedById_idx";

-- DropIndex
DROP INDEX "Role_createdById_idx";

-- DropIndex
DROP INDEX "Role_updatedById_idx";

-- DropIndex
DROP INDEX "Shift_createdById_idx";

-- DropIndex
DROP INDEX "Shift_updatedById_idx";

-- AlterTable
ALTER TABLE "BillItem" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Diagnosis" ALTER COLUMN "code" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Dispensing" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Medicine" ADD COLUMN     "alias" TEXT,
ADD COLUMN     "currentStock" DECIMAL(12,2) DEFAULT 0,
ADD COLUMN     "groupId" TEXT,
ADD COLUMN     "openingStock" DECIMAL(12,2) DEFAULT 0,
ADD COLUMN     "unitId" TEXT;

-- AlterTable
ALTER TABLE "PatientAllergy" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Permission" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "PrescriptionItem" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "RefreshToken" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- DropTable
DROP TABLE "FinancialYear";

-- CreateTable
CREATE TABLE "MedicineGroup" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT,
    "updatedById" TEXT,

    CONSTRAINT "MedicineGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Unit" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "symbol" TEXT,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT,
    "updatedById" TEXT,

    CONSTRAINT "Unit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MedicineGroup_name_key" ON "MedicineGroup"("name");

-- CreateIndex
CREATE INDEX "MedicineGroup_createdById_idx" ON "MedicineGroup"("createdById");

-- CreateIndex
CREATE INDEX "MedicineGroup_updatedById_idx" ON "MedicineGroup"("updatedById");

-- CreateIndex
CREATE UNIQUE INDEX "Unit_name_key" ON "Unit"("name");

-- CreateIndex
CREATE INDEX "Unit_createdById_idx" ON "Unit"("createdById");

-- CreateIndex
CREATE INDEX "Unit_updatedById_idx" ON "Unit"("updatedById");

-- CreateIndex
CREATE INDEX "Medicine_alias_idx" ON "Medicine"("alias");

-- CreateIndex
CREATE INDEX "Medicine_groupId_idx" ON "Medicine"("groupId");

-- CreateIndex
CREATE INDEX "Medicine_unitId_idx" ON "Medicine"("unitId");

-- AddForeignKey
ALTER TABLE "MedicineGroup" ADD CONSTRAINT "MedicineGroup_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicineGroup" ADD CONSTRAINT "MedicineGroup_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Unit" ADD CONSTRAINT "Unit_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Unit" ADD CONSTRAINT "Unit_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Medicine" ADD CONSTRAINT "Medicine_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "MedicineGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Medicine" ADD CONSTRAINT "Medicine_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE SET NULL ON UPDATE CASCADE;
