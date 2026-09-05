-- AlterTable
ALTER TABLE "Bill" ADD COLUMN     "financialYearId" TEXT;

-- AlterTable
ALTER TABLE "Company" ADD COLUMN     "cinNumber" TEXT,
ADD COLUMN     "tokenNumberFormat" TEXT NOT NULL DEFAULT 'SEQUENTIAL',
ADD COLUMN     "tokenNumberPadding" INTEGER NOT NULL DEFAULT 4,
ADD COLUMN     "tokenNumberPrefix" TEXT,
ADD COLUMN     "tokenNumberResetPolicy" TEXT NOT NULL DEFAULT 'DAILY';

-- CreateIndex
CREATE INDEX "Bill_financialYearId_idx" ON "Bill"("financialYearId");

-- AddForeignKey
ALTER TABLE "Bill" ADD CONSTRAINT "Bill_financialYearId_fkey" FOREIGN KEY ("financialYearId") REFERENCES "FinancialYear"("id") ON DELETE SET NULL ON UPDATE CASCADE;

