-- DropForeignKey
ALTER TABLE "DoctorSchedule" DROP CONSTRAINT "DoctorSchedule_doctorId_fkey";

-- DropIndex
DROP INDEX "Doctor_email_key";

-- DropIndex
DROP INDEX "Doctor_licenseNumber_key";

-- AlterTable
-- medicalRegistrationNo has no default, so existing rows (from before this redesign)
-- need a placeholder backfilled before the NOT NULL constraint can be applied.
ALTER TABLE "Doctor" DROP COLUMN "email",
DROP COLUMN "licenseNumber",
DROP COLUMN "name",
DROP COLUMN "phone",
ADD COLUMN     "consultationFee" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "consultationMode" TEXT NOT NULL DEFAULT 'OFFLINE',
ADD COLUMN     "degreeCertificateUrl" TEXT,
ADD COLUMN     "governmentIdUrl" TEXT,
ADD COLUMN     "medicalCouncil" TEXT,
ADD COLUMN     "medicalRegistrationNo" TEXT,
ADD COLUMN     "qualification" TEXT,
ADD COLUMN     "registrationCertificateUrl" TEXT,
ADD COLUMN     "registrationYear" INTEGER,
ADD COLUMN     "signature" TEXT,
ADD COLUMN     "verificationStatus" TEXT NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "yearsOfExperience" INTEGER;

UPDATE "Doctor" SET "medicalRegistrationNo" = 'LEGACY-' || "id" WHERE "medicalRegistrationNo" IS NULL;

ALTER TABLE "Doctor" ALTER COLUMN "medicalRegistrationNo" SET NOT NULL;

-- AlterTable
-- firstName/lastName have no default either; backfill from the legacy single "name" column
-- before dropping it and enforcing NOT NULL.
ALTER TABLE "User" ADD COLUMN     "countryCode" TEXT NOT NULL DEFAULT '+91',
ADD COLUMN     "dateOfBirth" TIMESTAMP(3),
ADD COLUMN     "firstName" TEXT,
ADD COLUMN     "gender" TEXT,
ADD COLUMN     "lastName" TEXT,
ADD COLUMN     "middleName" TEXT,
ADD COLUMN     "mobileNumber" TEXT,
ADD COLUMN     "profilePhotoUrl" TEXT,
ADD COLUMN     "qualification" TEXT,
ADD COLUMN     "userableId" TEXT,
ADD COLUMN     "userableType" TEXT;

UPDATE "User" SET
  "firstName" = COALESCE(NULLIF(split_part("name", ' ', 1), ''), 'User'),
  "lastName" = COALESCE(NULLIF(substr("name", length(split_part("name", ' ', 1)) + 2), ''), '-')
WHERE "firstName" IS NULL;

ALTER TABLE "User" ALTER COLUMN "firstName" SET NOT NULL;
ALTER TABLE "User" ALTER COLUMN "lastName" SET NOT NULL;
ALTER TABLE "User" DROP COLUMN "name";

-- DropTable
DROP TABLE "DoctorSchedule";

-- CreateTable
CREATE TABLE "Shift" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "breakStartTime" TEXT,
    "breakEndTime" TEXT,
    "isOvernight" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Shift_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployeeSchedule" (
    "id" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "shiftId" TEXT,
    "employeeSchedulableType" TEXT NOT NULL,
    "employeeSchedulableId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmployeeSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Address" (
    "id" TEXT NOT NULL,
    "addressType" TEXT NOT NULL,
    "addressLine1" TEXT NOT NULL,
    "addressLine2" TEXT,
    "landmark" TEXT,
    "city" TEXT,
    "district" TEXT,
    "state" TEXT,
    "country" TEXT NOT NULL DEFAULT 'India',
    "postalCode" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "addressableType" TEXT NOT NULL,
    "addressableId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Address_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Shift_code_key" ON "Shift"("code");

-- CreateIndex
CREATE INDEX "emp_sched_type_id_dow" ON "EmployeeSchedule"("employeeSchedulableType", "employeeSchedulableId", "dayOfWeek");

-- CreateIndex
CREATE INDEX "emp_sched_type_id" ON "EmployeeSchedule"("employeeSchedulableType", "employeeSchedulableId");

-- CreateIndex
CREATE INDEX "Address_addressableType_addressableId_idx" ON "Address"("addressableType", "addressableId");

-- CreateIndex
CREATE INDEX "Address_addressableType_addressableId_isPrimary_idx" ON "Address"("addressableType", "addressableId", "isPrimary");

-- CreateIndex
CREATE UNIQUE INDEX "Doctor_medicalRegistrationNo_key" ON "Doctor"("medicalRegistrationNo");

-- CreateIndex
CREATE INDEX "Doctor_verificationStatus_idx" ON "Doctor"("verificationStatus");

-- CreateIndex
CREATE INDEX "Doctor_specialization_idx" ON "Doctor"("specialization");

-- CreateIndex
CREATE INDEX "User_userableType_userableId_idx" ON "User"("userableType", "userableId");

-- AddForeignKey
ALTER TABLE "EmployeeSchedule" ADD CONSTRAINT "EmployeeSchedule_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "Shift"("id") ON DELETE SET NULL ON UPDATE CASCADE;

