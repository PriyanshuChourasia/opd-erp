-- AlterTable
ALTER TABLE "Payment" ALTER COLUMN "method" DROP DEFAULT,
ALTER COLUMN "direction" DROP DEFAULT;

-- CreateTable
CREATE TABLE "AccountNature" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "normalBalance" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AccountNature_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccountGroup" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "natureId" TEXT NOT NULL,
    "parentGroupId" TEXT,
    "isReserved" BOOLEAN NOT NULL DEFAULT false,
    "affectsGrossProfit" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT,
    "updatedById" TEXT,

    CONSTRAINT "AccountGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ledger" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "accountGroupId" TEXT NOT NULL,
    "openingBalance" INTEGER NOT NULL DEFAULT 0,
    "openingBalanceType" TEXT,
    "currentBalance" INTEGER NOT NULL DEFAULT 0,
    "isBillWiseTracking" BOOLEAN NOT NULL DEFAULT false,
    "isCashAccount" BOOLEAN NOT NULL DEFAULT false,
    "isBankAccount" BOOLEAN NOT NULL DEFAULT false,
    "linkedPaymentMethod" TEXT,
    "patientId" TEXT,
    "doctorId" TEXT,
    "userId" TEXT,
    "companyId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT,
    "updatedById" TEXT,
    "deletedAt" TIMESTAMP(3),
    "deletedById" TEXT,

    CONSTRAINT "Ledger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VoucherType" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "affectsAccounting" BOOLEAN NOT NULL DEFAULT true,
    "affectsInventory" BOOLEAN NOT NULL DEFAULT false,
    "numberingPrefix" TEXT NOT NULL,
    "isSystemDefined" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VoucherType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Voucher" (
    "id" TEXT NOT NULL,
    "voucherTypeId" TEXT NOT NULL,
    "voucherNumber" TEXT NOT NULL,
    "voucherDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "financialYearId" TEXT NOT NULL,
    "partyLedgerId" TEXT,
    "totalAmount" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'POSTED',
    "sourceModule" TEXT,
    "sourceId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT,
    "updatedById" TEXT,
    "deletedAt" TIMESTAMP(3),
    "deletedById" TEXT,

    CONSTRAINT "Voucher_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JournalType" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "requiresApproval" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JournalType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Journal" (
    "id" TEXT NOT NULL,
    "voucherId" TEXT,
    "journalTypeId" TEXT NOT NULL,
    "isPosted" BOOLEAN NOT NULL DEFAULT false,
    "totalDebit" INTEGER NOT NULL DEFAULT 0,
    "totalCredit" INTEGER NOT NULL DEFAULT 0,
    "reversalOfJournalId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT,
    "updatedById" TEXT,
    "deletedAt" TIMESTAMP(3),
    "deletedById" TEXT,

    CONSTRAINT "Journal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JournalLine" (
    "id" TEXT NOT NULL,
    "journalId" TEXT NOT NULL,
    "ledgerId" TEXT NOT NULL,
    "debitAmount" INTEGER NOT NULL DEFAULT 0,
    "creditAmount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JournalLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VoucherReference" (
    "id" TEXT NOT NULL,
    "voucherId" TEXT NOT NULL,
    "referenceType" TEXT NOT NULL,
    "referencedVoucherId" TEXT,
    "ledgerId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "dueDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VoucherReference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockItem" (
    "id" TEXT NOT NULL,
    "medicineId" TEXT NOT NULL,
    "valuationMethod" TEXT NOT NULL DEFAULT 'FIFO',
    "reorderLevel" INTEGER NOT NULL DEFAULT 0,
    "hsnCode" TEXT,
    "gstRate" INTEGER NOT NULL DEFAULT 0,
    "stockLedgerAccountId" TEXT,
    "salesAccountId" TEXT,
    "purchaseAccountId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StockItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockBatch" (
    "id" TEXT NOT NULL,
    "stockItemId" TEXT NOT NULL,
    "batchNo" TEXT,
    "expiryDate" TIMESTAMP(3),
    "purchaseRate" INTEGER NOT NULL DEFAULT 0,
    "mrp" INTEGER NOT NULL DEFAULT 0,
    "currentQty" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StockBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockLedgerEntry" (
    "id" TEXT NOT NULL,
    "voucherId" TEXT,
    "stockItemId" TEXT NOT NULL,
    "batchId" TEXT,
    "quantity" DECIMAL(12,2) NOT NULL,
    "rate" INTEGER NOT NULL DEFAULT 0,
    "value" INTEGER NOT NULL DEFAULT 0,
    "runningBalanceQty" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "runningBalanceValue" INTEGER NOT NULL DEFAULT 0,
    "movementType" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StockLedgerEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AccountNature_code_key" ON "AccountNature"("code");

-- CreateIndex
CREATE INDEX "AccountGroup_natureId_idx" ON "AccountGroup"("natureId");

-- CreateIndex
CREATE INDEX "AccountGroup_parentGroupId_idx" ON "AccountGroup"("parentGroupId");

-- CreateIndex
CREATE INDEX "AccountGroup_createdById_idx" ON "AccountGroup"("createdById");

-- CreateIndex
CREATE INDEX "AccountGroup_updatedById_idx" ON "AccountGroup"("updatedById");

-- CreateIndex
CREATE UNIQUE INDEX "AccountGroup_name_natureId_key" ON "AccountGroup"("name", "natureId");

-- CreateIndex
CREATE UNIQUE INDEX "Ledger_linkedPaymentMethod_key" ON "Ledger"("linkedPaymentMethod");

-- CreateIndex
CREATE INDEX "Ledger_accountGroupId_idx" ON "Ledger"("accountGroupId");

-- CreateIndex
CREATE INDEX "Ledger_patientId_idx" ON "Ledger"("patientId");

-- CreateIndex
CREATE INDEX "Ledger_doctorId_idx" ON "Ledger"("doctorId");

-- CreateIndex
CREATE INDEX "Ledger_userId_idx" ON "Ledger"("userId");

-- CreateIndex
CREATE INDEX "Ledger_companyId_idx" ON "Ledger"("companyId");

-- CreateIndex
CREATE INDEX "Ledger_createdById_idx" ON "Ledger"("createdById");

-- CreateIndex
CREATE INDEX "Ledger_updatedById_idx" ON "Ledger"("updatedById");

-- CreateIndex
CREATE INDEX "Ledger_isActive_idx" ON "Ledger"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "Ledger_accountGroupId_name_key" ON "Ledger"("accountGroupId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "VoucherType_name_key" ON "VoucherType"("name");

-- CreateIndex
CREATE UNIQUE INDEX "VoucherType_code_key" ON "VoucherType"("code");

-- CreateIndex
CREATE INDEX "Voucher_voucherTypeId_idx" ON "Voucher"("voucherTypeId");

-- CreateIndex
CREATE INDEX "Voucher_financialYearId_idx" ON "Voucher"("financialYearId");

-- CreateIndex
CREATE INDEX "Voucher_partyLedgerId_idx" ON "Voucher"("partyLedgerId");

-- CreateIndex
CREATE INDEX "Voucher_sourceModule_sourceId_idx" ON "Voucher"("sourceModule", "sourceId");

-- CreateIndex
CREATE INDEX "Voucher_createdById_idx" ON "Voucher"("createdById");

-- CreateIndex
CREATE INDEX "Voucher_updatedById_idx" ON "Voucher"("updatedById");

-- CreateIndex
CREATE UNIQUE INDEX "Voucher_voucherTypeId_voucherNumber_financialYearId_key" ON "Voucher"("voucherTypeId", "voucherNumber", "financialYearId");

-- CreateIndex
CREATE UNIQUE INDEX "JournalType_code_key" ON "JournalType"("code");

-- CreateIndex
CREATE INDEX "Journal_voucherId_idx" ON "Journal"("voucherId");

-- CreateIndex
CREATE INDEX "Journal_journalTypeId_idx" ON "Journal"("journalTypeId");

-- CreateIndex
CREATE INDEX "Journal_reversalOfJournalId_idx" ON "Journal"("reversalOfJournalId");

-- CreateIndex
CREATE INDEX "Journal_createdById_idx" ON "Journal"("createdById");

-- CreateIndex
CREATE INDEX "Journal_updatedById_idx" ON "Journal"("updatedById");

-- CreateIndex
CREATE INDEX "JournalLine_journalId_idx" ON "JournalLine"("journalId");

-- CreateIndex
CREATE INDEX "JournalLine_ledgerId_idx" ON "JournalLine"("ledgerId");

-- CreateIndex
CREATE INDEX "VoucherReference_voucherId_idx" ON "VoucherReference"("voucherId");

-- CreateIndex
CREATE INDEX "VoucherReference_referencedVoucherId_idx" ON "VoucherReference"("referencedVoucherId");

-- CreateIndex
CREATE INDEX "VoucherReference_ledgerId_idx" ON "VoucherReference"("ledgerId");

-- CreateIndex
CREATE UNIQUE INDEX "StockItem_medicineId_key" ON "StockItem"("medicineId");

-- CreateIndex
CREATE INDEX "StockItem_medicineId_idx" ON "StockItem"("medicineId");

-- CreateIndex
CREATE INDEX "StockBatch_stockItemId_idx" ON "StockBatch"("stockItemId");

-- CreateIndex
CREATE INDEX "StockBatch_expiryDate_idx" ON "StockBatch"("expiryDate");

-- CreateIndex
CREATE INDEX "StockLedgerEntry_stockItemId_idx" ON "StockLedgerEntry"("stockItemId");

-- CreateIndex
CREATE INDEX "StockLedgerEntry_batchId_idx" ON "StockLedgerEntry"("batchId");

-- CreateIndex
CREATE INDEX "StockLedgerEntry_voucherId_idx" ON "StockLedgerEntry"("voucherId");

-- CreateIndex
CREATE INDEX "StockLedgerEntry_movementType_idx" ON "StockLedgerEntry"("movementType");

-- AddForeignKey
ALTER TABLE "AccountGroup" ADD CONSTRAINT "AccountGroup_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountGroup" ADD CONSTRAINT "AccountGroup_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountGroup" ADD CONSTRAINT "AccountGroup_natureId_fkey" FOREIGN KEY ("natureId") REFERENCES "AccountNature"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountGroup" ADD CONSTRAINT "AccountGroup_parentGroupId_fkey" FOREIGN KEY ("parentGroupId") REFERENCES "AccountGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ledger" ADD CONSTRAINT "Ledger_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ledger" ADD CONSTRAINT "Ledger_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ledger" ADD CONSTRAINT "Ledger_accountGroupId_fkey" FOREIGN KEY ("accountGroupId") REFERENCES "AccountGroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ledger" ADD CONSTRAINT "Ledger_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ledger" ADD CONSTRAINT "Ledger_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "Doctor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ledger" ADD CONSTRAINT "Ledger_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ledger" ADD CONSTRAINT "Ledger_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ledger" ADD CONSTRAINT "Ledger_deletedById_fkey" FOREIGN KEY ("deletedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Voucher" ADD CONSTRAINT "Voucher_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Voucher" ADD CONSTRAINT "Voucher_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Voucher" ADD CONSTRAINT "Voucher_voucherTypeId_fkey" FOREIGN KEY ("voucherTypeId") REFERENCES "VoucherType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Voucher" ADD CONSTRAINT "Voucher_financialYearId_fkey" FOREIGN KEY ("financialYearId") REFERENCES "FinancialYear"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Voucher" ADD CONSTRAINT "Voucher_partyLedgerId_fkey" FOREIGN KEY ("partyLedgerId") REFERENCES "Ledger"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Voucher" ADD CONSTRAINT "Voucher_deletedById_fkey" FOREIGN KEY ("deletedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Journal" ADD CONSTRAINT "Journal_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Journal" ADD CONSTRAINT "Journal_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Journal" ADD CONSTRAINT "Journal_voucherId_fkey" FOREIGN KEY ("voucherId") REFERENCES "Voucher"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Journal" ADD CONSTRAINT "Journal_journalTypeId_fkey" FOREIGN KEY ("journalTypeId") REFERENCES "JournalType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Journal" ADD CONSTRAINT "Journal_reversalOfJournalId_fkey" FOREIGN KEY ("reversalOfJournalId") REFERENCES "Journal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Journal" ADD CONSTRAINT "Journal_deletedById_fkey" FOREIGN KEY ("deletedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JournalLine" ADD CONSTRAINT "JournalLine_journalId_fkey" FOREIGN KEY ("journalId") REFERENCES "Journal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JournalLine" ADD CONSTRAINT "JournalLine_ledgerId_fkey" FOREIGN KEY ("ledgerId") REFERENCES "Ledger"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VoucherReference" ADD CONSTRAINT "VoucherReference_voucherId_fkey" FOREIGN KEY ("voucherId") REFERENCES "Voucher"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VoucherReference" ADD CONSTRAINT "VoucherReference_referencedVoucherId_fkey" FOREIGN KEY ("referencedVoucherId") REFERENCES "Voucher"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VoucherReference" ADD CONSTRAINT "VoucherReference_ledgerId_fkey" FOREIGN KEY ("ledgerId") REFERENCES "Ledger"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockItem" ADD CONSTRAINT "StockItem_medicineId_fkey" FOREIGN KEY ("medicineId") REFERENCES "Medicine"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockBatch" ADD CONSTRAINT "StockBatch_stockItemId_fkey" FOREIGN KEY ("stockItemId") REFERENCES "StockItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockLedgerEntry" ADD CONSTRAINT "StockLedgerEntry_stockItemId_fkey" FOREIGN KEY ("stockItemId") REFERENCES "StockItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockLedgerEntry" ADD CONSTRAINT "StockLedgerEntry_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "StockBatch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

