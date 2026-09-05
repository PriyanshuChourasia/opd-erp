-- AlterTable
ALTER TABLE "Patient" ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "Patient" ADD COLUMN "deletedById" TEXT;

-- CreateIndex
CREATE INDEX "Patient_deletedAt_idx" ON "Patient"("deletedAt");
