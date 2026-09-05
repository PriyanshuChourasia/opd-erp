import { Injectable, BadRequestException } from '@nestjs/common';

/** The client type Prisma provides inside $transaction callback. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TransactionClient = any;

export interface JournalLineInput {
  ledgerId: string;
  debitAmount: number;  // in paise
  creditAmount: number; // in paise
}

export interface PostJournalInput {
  voucherId?: string;
  journalTypeId: string;
  lines: JournalLineInput[];
  notes?: string;
  reversalOfJournalId?: string;
  createdById?: string;
}

@Injectable()
export class AccountingService {
  constructor() {}

  /**
   * Post a balanced journal with ledger balance updates — the core double-entry engine.
   * Must be called inside a Prisma interactive transaction (pass tx client as `tx`).
   * Enforces: sum(debit) === sum(credit), exactly one of debit/credit > 0 per line,
   * and updates ledger.currentBalance for each affected ledger.
   */
  async postJournal(
    tx: TransactionClient,
    input: PostJournalInput,
  ) {
    // 1. Validate balance invariant
    const totalDebit = input.lines.reduce((sum, l) => sum + l.debitAmount, 0);
    const totalCredit = input.lines.reduce((sum, l) => sum + l.creditAmount, 0);

    if (totalDebit !== totalCredit) {
      throw new BadRequestException(
        `Journal is not balanced: debit=${totalDebit}, credit=${totalCredit}`,
      );
    }

    if (totalDebit === 0) {
      throw new BadRequestException('Journal must have at least one non-zero line.');
    }

    // Validate each line has exactly one of debit/credit > 0
    for (let i = 0; i < input.lines.length; i++) {
      const line = input.lines[i];
      if (line.debitAmount < 0 || line.creditAmount < 0) {
        throw new BadRequestException(
          `Line ${i + 1}: debit and credit amounts must be non-negative.`,
        );
      }
      if (line.debitAmount > 0 && line.creditAmount > 0) {
        throw new BadRequestException(
          `Line ${i + 1}: only one of debit/credit may be > 0.`,
        );
      }
      if (line.debitAmount === 0 && line.creditAmount === 0) {
        throw new BadRequestException(
          `Line ${i + 1}: at least one of debit/credit must be > 0.`,
        );
      }
    }

    // 2. Create journal header
    const journal = await tx.journal.create({
      data: {
        voucherId: input.voucherId ?? null,
        journalTypeId: input.journalTypeId,
        isPosted: true,
        totalDebit,
        totalCredit,
        reversalOfJournalId: input.reversalOfJournalId ?? null,
        notes: input.notes ?? null,
        createdById: input.createdById ?? null,
      },
    });

    // 3. Create journal lines and update ledger balances
    for (const line of input.lines) {
      await tx.journalLine.create({
        data: {
          journalId: journal.id,
          ledgerId: line.ledgerId,
          debitAmount: line.debitAmount,
          creditAmount: line.creditAmount,
        },
      });

      // Update ledger.currentBalance based on the account group's normal balance
      const ledger = await tx.ledger.findUniqueOrThrow({
        where: { id: line.ledgerId },
        include: { accountGroup: { include: { nature: true } } },
      });

      const normalBalance = ledger.accountGroup.nature.normalBalance;
      // DEBIT nature: balance += debit - credit
      // CREDIT nature: balance += credit - debit
      const delta =
        normalBalance === 'DEBIT'
          ? line.debitAmount - line.creditAmount
          : line.creditAmount - line.debitAmount;

      await tx.ledger.update({
        where: { id: line.ledgerId },
        data: { currentBalance: { increment: delta } },
      });
    }

    return journal;
  }

  /**
   * Create a Voucher and a balanced journal inside a single transaction.
   * Returns both the voucher and journal.
   */
  async createVoucherAndJournal(
    tx: TransactionClient,
    input: {
      voucherTypeId: string;
      voucherNumber: string;
      voucherDate: Date;
      financialYearId: string;
      partyLedgerId?: string;
      totalAmount: number;
      status?: string;
      sourceModule?: string;
      sourceId?: string;
      journalTypeId: string;
      journalLines: JournalLineInput[];
      notes?: string;
      createdById?: string;
    },
  ) {
    // 1. Create voucher
    const voucher = await tx.voucher.create({
      data: {
        voucherTypeId: input.voucherTypeId,
        voucherNumber: input.voucherNumber,
        voucherDate: input.voucherDate,
        financialYearId: input.financialYearId,
        partyLedgerId: input.partyLedgerId ?? null,
        totalAmount: input.totalAmount,
        status: input.status ?? 'POSTED',
        sourceModule: input.sourceModule ?? null,
        sourceId: input.sourceId ?? null,
        createdById: input.createdById ?? null,
      },
    });

    // 2. Create journal under this voucher
    const journal = await this.postJournal(tx, {
      voucherId: voucher.id,
      journalTypeId: input.journalTypeId,
      lines: input.journalLines,
      notes: input.notes,
      createdById: input.createdById,
    });

    return { voucher, journal };
  }

  /**
   * Ledger names are unique per account group (`@@unique([accountGroupId,
   * name])` on Ledger) — that constraint is intentional and stays: reports
   * and lookups need each party's ledger to resolve to a single unambiguous
   * name within a group. But the display names ledgers get created from
   * (patient/doctor/user names) are NOT unique — two patients can share a
   * name — so creating a second party's ledger under a name already taken
   * by someone else's ledger in the same group would otherwise 409 on the
   * very first payment/voucher for whichever party's ledger gets created
   * second. Disambiguate with a short suffix instead of letting that reach
   * the DB as a conflict.
   */
  private async disambiguateLedgerName(
    tx: TransactionClient,
    accountGroupId: string,
    name: string,
    ownerId: string,
  ): Promise<string> {
    const taken = await tx.ledger.findFirst({ where: { accountGroupId, name } });
    return taken ? `${name} (${ownerId.slice(0, 8)})` : name;
  }

  /**
   * Find or create a ledger for a patient under the Sundry Debtors group.
   * Safe to call inside a transaction.
   */
  async resolveOrCreatePatientLedger(
    tx: TransactionClient,
    patientId: string,
    patientName: string,
    createdById?: string,
  ) {
    // Check for existing patient ledger
    const existing = await tx.ledger.findFirst({
      where: { patientId },
    });
    if (existing) return existing;

    // Find the Sundry Debtors group
    const sundryDebtorsGroup = await tx.accountGroup.findFirst({
      where: { name: 'Sundry Debtors' },
    });
    if (!sundryDebtorsGroup) {
      throw new BadRequestException('Sundry Debtors account group not found. Run seed.');
    }

    const name = await this.disambiguateLedgerName(tx, sundryDebtorsGroup.id, patientName, patientId);
    return tx.ledger.create({
      data: {
        name,
        accountGroupId: sundryDebtorsGroup.id,
        openingBalance: 0,
        openingBalanceType: 'DEBIT',
        isBillWiseTracking: true,
        patientId,
        createdById: createdById ?? null,
      },
    });
  }

  /**
   * Find or create a ledger for a doctor under the Doctor Payables group
   * (a liability — what the clinic owes the doctor for consultation fee share).
   * Safe to call inside a transaction.
   */
  async resolveOrCreateDoctorLedger(
    tx: TransactionClient,
    doctorId: string,
    doctorName: string,
    createdById?: string,
  ) {
    const existing = await tx.ledger.findFirst({
      where: { doctorId },
    });
    if (existing) return existing;

    const doctorPayablesGroup = await tx.accountGroup.findFirst({
      where: { name: 'Doctor Payables' },
    });
    if (!doctorPayablesGroup) {
      throw new BadRequestException('Doctor Payables account group not found. Run seed.');
    }

    const name = await this.disambiguateLedgerName(tx, doctorPayablesGroup.id, doctorName, doctorId);
    return tx.ledger.create({
      data: {
        name,
        accountGroupId: doctorPayablesGroup.id,
        openingBalance: 0,
        openingBalanceType: 'CREDIT',
        isBillWiseTracking: true,
        doctorId,
        createdById: createdById ?? null,
      },
    });
  }

  /**
   * Find or create a ledger for a staff user under the Staff Accounts group
   * (an asset — cash advances/reimbursements tracked per employee).
   * Safe to call inside a transaction.
   */
  async resolveOrCreateUserLedger(
    tx: TransactionClient,
    userId: string,
    userName: string,
    createdById?: string,
  ) {
    const existing = await tx.ledger.findFirst({
      where: { userId },
    });
    if (existing) return existing;

    const staffAccountsGroup = await tx.accountGroup.findFirst({
      where: { name: 'Staff Accounts' },
    });
    if (!staffAccountsGroup) {
      throw new BadRequestException('Staff Accounts account group not found. Run seed.');
    }

    const name = await this.disambiguateLedgerName(tx, staffAccountsGroup.id, userName, userId);
    return tx.ledger.create({
      data: {
        name,
        accountGroupId: staffAccountsGroup.id,
        openingBalance: 0,
        openingBalanceType: 'DEBIT',
        isBillWiseTracking: false,
        userId,
        createdById: createdById ?? null,
      },
    });
  }

  /**
   * Resolve the ledger for a payment method (CASH → Cash ledger, CARD/UPI → Bank Account ledger).
   * Throws if the ledger is not seeded.
   */
  async resolveMethodLedger(
    tx: TransactionClient,
    method: 'CASH' | 'CARD' | 'UPI',
  ) {
    let ledger;

    if (method === 'CASH') {
      ledger = await tx.ledger.findFirst({
        where: { linkedPaymentMethod: 'CASH' },
      });
    } else {
      // CARD and UPI both resolve to Bank Account ledger
      ledger = await tx.ledger.findFirst({
        where: { isBankAccount: true },
      });
    }

    if (!ledger) {
      throw new BadRequestException(
        `No ledger found for payment method "${method}". Ensure payment-method ledgers are seeded.`,
      );
    }

    return ledger;
  }

  /**
   * Generate the next voucher number for a given voucher type and financial year.
   * Pattern: PREFIX-YY-NNNN (e.g. RCT-27-0001)
   * The 2-digit year is derived from FinancialYear.name (e.g. "2026-2027" → "27").
   */
  async nextVoucherNumber(
    tx: TransactionClient,
    voucherTypeId: string,
    financialYearId: string,
  ) {
    const voucherType = await tx.voucherType.findUniqueOrThrow({
      where: { id: voucherTypeId },
    });

    const fy = await tx.financialYear.findUniqueOrThrow({
      where: { id: financialYearId },
    });

    const count = await tx.voucher.count({
      where: { voucherTypeId, financialYearId },
    });

    const seq = (count + 1).toString().padStart(4, '0');

    // Extract 2-digit year from FY name like "2026-2027" → take end year "2027" → "27"
    const fyNameParts = fy.name.split('-');
    const endYear = fyNameParts.length >= 2 ? fyNameParts[1] : fyNameParts[0];
    const shortYear = endYear.slice(-2);

    return `${voucherType.numberingPrefix}-${shortYear}-${seq}`;
  }

  /**
   * Get the current financial year (isCurrent: true). Throws if none found.
   */
  async getCurrentFinancialYear(tx: TransactionClient) {
    const fy = await tx.financialYear.findFirst({
      where: { isCurrent: true },
    });
    if (!fy) {
      throw new BadRequestException(
        'No current financial year found. Ensure a FinancialYear with isCurrent=true is seeded.',
      );
    }
    return fy;
  }
}
