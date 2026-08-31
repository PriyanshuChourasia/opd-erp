-- AlterTable
ALTER TABLE "Appointment" ADD COLUMN     "otherFee" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "otherFeeLabel" TEXT;
