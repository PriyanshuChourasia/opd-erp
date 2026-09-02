import { BadRequestException } from '@nestjs/common';
import { AccountingService } from '../accounting/accounting.service';

/** The client type Prisma provides inside $transaction callback. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TransactionClient = any;

/**
 * Bridge between BillingService and AccountingService.
 * Provides helper functions for creating vouchers, journals, and references
 * when payments and refunds are processed.
 */
export class AccountingBridge {
  constructor(private readonly accountingService: AccountingService) {}

  /**
   * Create a RECEIPT voucher + journal + voucher reference for a payment.
   * Called inside BillingService's existing Prisma transaction.
   */
  async createReceiptVoucher(
    tx: TransactionClient,
    input: {
      paymentId: string;
      patientId: string;
      patientName: string;
      amount: number;
      billId: string;
      createdById?: string;
    },
  ) {
    const fy = await this.accountingService.getCurrentFinancialYear(tx);
    const receiptVoucherType = await tx.voucherType.findFirst({
      where: { code: 'RECEIPT' },
    });
    if (!receiptVoucherType) {
      throw new BadRequestException('RECEIPT voucher type not found. Run seed.');
    }

    const generalJournalType = await tx.journalType.findFirst({
      where: { code: 'GENERAL' },
    });
    if (!generalJournalType) {
      throw new BadRequestException('GENERAL journal type not found. Run seed.');
    }

    const patientLedger = await this.accountingService.resolveOrCreatePatientLedger(
      tx,
      input.patientId,
      input.patientName,
      input.createdById,
    );

    const methodLedger = await this.accountingService.resolveMethodLedger(tx, 'CASH');
    const voucherNumber = await this.accountingService.nextVoucherNumber(
      tx,
      receiptVoucherType.id,
      fy.id,
    );

    // Create voucher + journal (Dr Cash, Cr Patient)
    const { voucher, journal } = await this.accountingService.createVoucherAndJournal(tx, {
      voucherTypeId: receiptVoucherType.id,
      voucherNumber,
      voucherDate: new Date(),
      financialYearId: fy.id,
      partyLedgerId: patientLedger.id,
      totalAmount: input.amount,
      status: 'POSTED',
      sourceModule: 'Payment',
      sourceId: input.paymentId,
      journalTypeId: generalJournalType.id,
      journalLines: [
        { ledgerId: methodLedger.id, debitAmount: input.amount, creditAmount: 0 },
        { ledgerId: patientLedger.id, debitAmount: 0, creditAmount: input.amount },
      ],
      notes: `Receipt for payment ${input.paymentId}`,
      createdById: input.createdById,
    });

    // Try to find the bill's Sales voucher for AGAINST_REF
    const salesVoucher = await tx.voucher.findFirst({
      where: {
        sourceModule: 'Bill',
        sourceId: input.billId,
      },
    });

    // Create voucher reference
    await tx.voucherReference.create({
      data: {
        voucherId: voucher.id,
        referenceType: salesVoucher ? 'AGAINST_REF' : 'ON_ACCOUNT',
        referencedVoucherId: salesVoucher?.id ?? null,
        ledgerId: patientLedger.id,
        amount: input.amount,
      },
    });

    return { voucher, journal };
  }

  /**
   * Create a PAYMENT voucher + journal + voucher reference for a refund.
   * Called inside BillingService's existing Prisma transaction.
   */
  async createRefundVoucher(
    tx: TransactionClient,
    input: {
      paymentId: string;
      patientId: string;
      patientName: string;
      amount: number;
      billId: string;
      createdById?: string;
    },
  ) {
    const fy = await this.accountingService.getCurrentFinancialYear(tx);
    const paymentVoucherType = await tx.voucherType.findFirst({
      where: { code: 'PAYMENT' },
    });
    if (!paymentVoucherType) {
      throw new BadRequestException('PAYMENT voucher type not found. Run seed.');
    }

    const generalJournalType = await tx.journalType.findFirst({
      where: { code: 'GENERAL' },
    });
    if (!generalJournalType) {
      throw new BadRequestException('GENERAL journal type not found. Run seed.');
    }

    const patientLedger = await this.accountingService.resolveOrCreatePatientLedger(
      tx,
      input.patientId,
      input.patientName,
      input.createdById,
    );

    const methodLedger = await this.accountingService.resolveMethodLedger(tx, 'CASH');
    const voucherNumber = await this.accountingService.nextVoucherNumber(
      tx,
      paymentVoucherType.id,
      fy.id,
    );

    // Create voucher + journal (Dr Patient, Cr Cash) — reverse of receipt
    const { voucher, journal } = await this.accountingService.createVoucherAndJournal(tx, {
      voucherTypeId: paymentVoucherType.id,
      voucherNumber,
      voucherDate: new Date(),
      financialYearId: fy.id,
      partyLedgerId: patientLedger.id,
      totalAmount: input.amount,
      status: 'POSTED',
      sourceModule: 'Payment',
      sourceId: input.paymentId,
      journalTypeId: generalJournalType.id,
      journalLines: [
        { ledgerId: patientLedger.id, debitAmount: input.amount, creditAmount: 0 },
        { ledgerId: methodLedger.id, debitAmount: 0, creditAmount: input.amount },
      ],
      notes: `Refund for payment ${input.paymentId}`,
      createdById: input.createdById,
    });

    // Try to find original Receipt voucher for AGAINST_REF
    const originalReceiptVoucher = await tx.voucher.findFirst({
      where: {
        sourceModule: 'Payment',
        voucherType: { code: 'RECEIPT' },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Create voucher reference
    await tx.voucherReference.create({
      data: {
        voucherId: voucher.id,
        referenceType: originalReceiptVoucher ? 'AGAINST_REF' : 'ON_ACCOUNT',
        referencedVoucherId: originalReceiptVoucher?.id ?? null,
        ledgerId: patientLedger.id,
        amount: input.amount,
      },
    });

    return { voucher, journal };
  }
}
