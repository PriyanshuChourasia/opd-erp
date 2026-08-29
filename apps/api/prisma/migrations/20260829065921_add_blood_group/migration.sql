-- AlterTable
ALTER TABLE "Patient" ADD COLUMN     "bloodGroupId" TEXT;

-- CreateTable
CREATE TABLE "BloodGroup" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT,
    "updatedById" TEXT,

    CONSTRAINT "BloodGroup_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BloodGroup_name_key" ON "BloodGroup"("name");

-- CreateIndex
CREATE INDEX "BloodGroup_createdById_idx" ON "BloodGroup"("createdById");

-- CreateIndex
CREATE INDEX "BloodGroup_updatedById_idx" ON "BloodGroup"("updatedById");

-- AddForeignKey
ALTER TABLE "BloodGroup" ADD CONSTRAINT "BloodGroup_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BloodGroup" ADD CONSTRAINT "BloodGroup_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Patient" ADD CONSTRAINT "Patient_bloodGroupId_fkey" FOREIGN KEY ("bloodGroupId") REFERENCES "BloodGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;
