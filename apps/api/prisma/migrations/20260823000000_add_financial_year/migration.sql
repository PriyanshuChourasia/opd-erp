-- CreateTable
CREATE TABLE "FinancialYear" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT,
    "updatedById" TEXT,

    CONSTRAINT "FinancialYear_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FinancialYear_organisationId_idx" ON "FinancialYear"("organisationId");

-- CreateIndex
CREATE INDEX "FinancialYear_isActive_idx" ON "FinancialYear"("isActive");

-- CreateIndex
CREATE INDEX "FinancialYear_startDate_endDate_idx" ON "FinancialYear"("startDate", "endDate");

-- CreateIndex
CREATE INDEX "FinancialYear_createdById_idx" ON "FinancialYear"("createdById");

-- CreateIndex
CREATE INDEX "FinancialYear_updatedById_idx" ON "FinancialYear"("updatedById");

-- AddForeignKey
ALTER TABLE "FinancialYear" ADD CONSTRAINT "FinancialYear_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancialYear" ADD CONSTRAINT "FinancialYear_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancialYear" ADD CONSTRAINT "FinancialYear_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
