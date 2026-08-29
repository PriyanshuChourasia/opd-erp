-- AlterTable
ALTER TABLE "Organisation" ADD COLUMN     "discountEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "maxDiscountPercent" INTEGER NOT NULL DEFAULT 50,
ADD COLUMN     "defaultDiscountType" TEXT NOT NULL DEFAULT 'percent';
