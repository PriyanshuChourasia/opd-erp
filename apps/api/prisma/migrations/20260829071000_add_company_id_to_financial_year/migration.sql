-- AlterTable
ALTER TABLE "FinancialYear" ADD COLUMN "companyId" TEXT;

-- CreateIndex
CREATE INDEX "FinancialYear_companyId_idx" ON "FinancialYear"("companyId");

-- AddForeignKey
ALTER TABLE "FinancialYear" ADD CONSTRAINT "FinancialYear_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;
