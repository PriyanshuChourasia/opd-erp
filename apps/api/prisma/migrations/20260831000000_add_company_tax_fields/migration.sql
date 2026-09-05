-- AlterTable
ALTER TABLE "Company" ADD COLUMN     "gstNumber" TEXT,
ADD COLUMN     "panNumber" TEXT,
ADD COLUMN     "drugLicenseNumber" TEXT,
ADD COLUMN     "drugLicenseExpiry" TIMESTAMP(3),
ADD COLUMN     "taxRegistrationNumber" TEXT;
