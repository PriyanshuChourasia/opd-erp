import { BadRequestException } from '@nestjs/common';
import { AccountingService, PostJournalInput } from './accounting.service';

/** Minimal mock for PrismaClient inside a $transaction callback. */
function mockTx() {
  const journalCreate = jest.fn().mockResolvedValue({ id: 'journal-1' });
  const journalLineCreate = jest.fn().mockResolvedValue({ id: 'line-1' });
  const ledgerFindUniqueOrThrow = jest.fn();
  const ledgerUpdate = jest.fn().mockResolvedValue({});

  return {
    journal: { create: journalCreate },
    journalLine: { create: journalLineCreate },
    ledger: {
      findUniqueOrThrow: ledgerFindUniqueOrThrow,
      update: ledgerUpdate,
    },
    voucherType: { findFirst: jest.fn() },
    journalType: { findFirst: jest.fn() },
    voucher: { count: jest.fn() },
    financialYear: { findFirst: jest.fn() },
    // Helpers for assertions
    _journalCreate: journalCreate,
    _journalLineCreate: journalLineCreate,
    _ledgerFindUniqueOrThrow: ledgerFindUniqueOrThrow,
    _ledgerUpdate: ledgerUpdate,
  } as unknown as Parameters<AccountingService['postJournal']>[0];
}

describe('AccountingService', () => {
  let service: AccountingService;

  beforeEach(() => {
    service = new AccountingService();
    jest.clearAllMocks();
  });

  describe('postJournal()', () => {
    const baseInput: PostJournalInput = {
      journalTypeId: 'jt-1',
      lines: [
        { ledgerId: 'ledger-dr', debitAmount: 1000, creditAmount: 0 },
        { ledgerId: 'ledger-cr', debitAmount: 0, creditAmount: 1000 },
      ],
    };

    // ── Balance Invariant Tests ──────────────────────────────

    it('should throw BadRequestException when debits ≠ credits', async () => {
      const tx = mockTx();
      const unbalancedInput: PostJournalInput = {
        journalTypeId: 'jt-1',
        lines: [
          { ledgerId: 'ledger-dr', debitAmount: 1000, creditAmount: 0 },
          { ledgerId: 'ledger-cr', debitAmount: 0, creditAmount: 500 },
        ],
      };

      await expect(service.postJournal(tx as never, unbalancedInput)).rejects.toThrow(BadRequestException);
      await expect(service.postJournal(tx as never, unbalancedInput)).rejects.toThrow(
        'Journal is not balanced: debit=1000, credit=500',
      );
    });

    it('should throw when all amounts are zero', async () => {
      const tx = mockTx();
      const zeroInput: PostJournalInput = {
        journalTypeId: 'jt-1',
        lines: [
          { ledgerId: 'ledger-dr', debitAmount: 0, creditAmount: 0 },
          { ledgerId: 'ledger-cr', debitAmount: 0, creditAmount: 0 },
        ],
      };

      await expect(service.postJournal(tx as never, zeroInput)).rejects.toThrow(
        'Journal must have at least one non-zero line.',
      );
    });

    it('should throw when a line has both debit and credit > 0', async () => {
      const tx = mockTx();
      const invalidInput: PostJournalInput = {
        journalTypeId: 'jt-1',
        lines: [
          { ledgerId: 'ledger-1', debitAmount: 500, creditAmount: 500 },
        ],
      };

      await expect(service.postJournal(tx as never, invalidInput)).rejects.toThrow(
        'Line 1: only one of debit/credit may be > 0.',
      );
    });

    it('should throw when a line has negative amounts', async () => {
      const tx = mockTx();
      // Balanced (totalDebit=100, totalCredit=100) but line 1 has a negative debit
      const negativeInput: PostJournalInput = {
        journalTypeId: 'jt-1',
        lines: [
          { ledgerId: 'ledger-1', debitAmount: -100, creditAmount: 0 },
          { ledgerId: 'ledger-2', debitAmount: 200, creditAmount: 100 },
        ],
      };

      await expect(service.postJournal(tx as never, negativeInput)).rejects.toThrow(
        'Line 1: debit and credit amounts must be non-negative.',
      );
    });

    // ── Journal Creation Tests ───────────────────────────────

    it('should create journal header with correct totals', async () => {
      const tx = mockTx();
      (tx as never as { ledger: { findUniqueOrThrow: jest.Mock } }).ledger.findUniqueOrThrow
        .mockResolvedValueOnce({ id: 'ledger-dr', accountGroup: { nature: { normalBalance: 'DEBIT' } } })
        .mockResolvedValueOnce({ id: 'ledger-cr', accountGroup: { nature: { normalBalance: 'CREDIT' } } });

      const result = await service.postJournal(tx as never, baseInput);

      expect(result).toEqual({ id: 'journal-1' });
      expect((tx as never as { journal: { create: jest.Mock } }).journal.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          journalTypeId: 'jt-1',
          isPosted: true,
          totalDebit: 1000,
          totalCredit: 1000,
        }),
      });
    });

    it('should create the correct number of journal lines', async () => {
      const tx = mockTx();
      (tx as never as { ledger: { findUniqueOrThrow: jest.Mock } }).ledger.findUniqueOrThrow
        .mockResolvedValue({ id: 'any', accountGroup: { nature: { normalBalance: 'DEBIT' } } });

      await service.postJournal(tx as never, baseInput);

      expect((tx as never as { journalLine: { create: jest.Mock } }).journalLine.create).toHaveBeenCalledTimes(2);
    });

    // ── Ledger Balance Update Tests ──────────────────────────

    it('should update DEBIT-nature ledger: balance += (debit - credit)', async () => {
      const tx = mockTx();
      // DEBIT nature ledger receiving a debit: delta = 1000 - 0 = +1000
      (tx as never as { ledger: { findUniqueOrThrow: jest.Mock } }).ledger.findUniqueOrThrow
        .mockResolvedValueOnce({ id: 'ledger-dr', accountGroup: { nature: { normalBalance: 'DEBIT' } } })
        .mockResolvedValueOnce({ id: 'ledger-cr', accountGroup: { nature: { normalBalance: 'CREDIT' } } });

      await service.postJournal(tx as never, baseInput);

      expect((tx as never as { ledger: { update: jest.Mock } }).ledger.update).toHaveBeenCalledWith({
        where: { id: 'ledger-dr' },
        data: { currentBalance: { increment: 1000 } },
      });
    });

    it('should update CREDIT-nature ledger: balance += (credit - debit)', async () => {
      const tx = mockTx();
      // CREDIT nature ledger receiving a credit: delta = 1000 - 0 = +1000
      (tx as never as { ledger: { findUniqueOrThrow: jest.Mock } }).ledger.findUniqueOrThrow
        .mockResolvedValueOnce({ id: 'ledger-dr', accountGroup: { nature: { normalBalance: 'DEBIT' } } })
        .mockResolvedValueOnce({ id: 'ledger-cr', accountGroup: { nature: { normalBalance: 'CREDIT' } } });

      await service.postJournal(tx as never, baseInput);

      expect((tx as never as { ledger: { update: jest.Mock } }).ledger.update).toHaveBeenCalledWith({
        where: { id: 'ledger-cr' },
        data: { currentBalance: { increment: 1000 } },
      });
    });

    it('should correctly compute deltas for a mixed-nature journal', async () => {
      const tx = mockTx();
      // All CREDIT nature ledgers — credits increase, debits decrease
      (tx as never as { ledger: { findUniqueOrThrow: jest.Mock } }).ledger.findUniqueOrThrow
        .mockResolvedValue({ id: 'any', accountGroup: { nature: { normalBalance: 'CREDIT' } } });

      const creditInput: PostJournalInput = {
        journalTypeId: 'jt-1',
        lines: [
          { ledgerId: 'ledger-1', debitAmount: 0, creditAmount: 2000 },  // CREDIT nature: delta = +2000
          { ledgerId: 'ledger-2', debitAmount: 2000, creditAmount: 0 },  // CREDIT nature: delta = -2000
        ],
      };

      await service.postJournal(tx as never, creditInput);

      expect((tx as never as { ledger: { update: jest.Mock } }).ledger.update).toHaveBeenCalledWith({
        where: { id: 'ledger-1' },
        data: { currentBalance: { increment: 2000 } },
      });
      expect((tx as never as { ledger: { update: jest.Mock } }).ledger.update).toHaveBeenCalledWith({
        where: { id: 'ledger-2' },
        data: { currentBalance: { increment: -2000 } },
      });
    });

    it('should correctly compute deltas for a three-line balanced journal', async () => {
      const tx = mockTx();
      (tx as never as { ledger: { findUniqueOrThrow: jest.Mock } }).ledger.findUniqueOrThrow
        .mockResolvedValue({ id: 'any', accountGroup: { nature: { normalBalance: 'DEBIT' } } });

      const threeLineInput: PostJournalInput = {
        journalTypeId: 'jt-1',
        lines: [
          { ledgerId: 'ledger-dr', debitAmount: 5000, creditAmount: 0 },   // DEBIT: delta = +5000
          { ledgerId: 'ledger-cr1', debitAmount: 0, creditAmount: 3000 },  // DEBIT: delta = -3000
          { ledgerId: 'ledger-cr2', debitAmount: 0, creditAmount: 2000 },  // DEBIT: delta = -2000
        ],
      };

      const result = await service.postJournal(tx as never, threeLineInput);

      expect(result).toEqual({ id: 'journal-1' });
      expect((tx as never as { journal: { create: jest.Mock } }).journal.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ totalDebit: 5000, totalCredit: 5000 }),
      });
      expect((tx as never as { journalLine: { create: jest.Mock } }).journalLine.create).toHaveBeenCalledTimes(3);
      expect((tx as never as { ledger: { update: jest.Mock } }).ledger.update).toHaveBeenCalledTimes(3);

      expect((tx as never as { ledger: { update: jest.Mock } }).ledger.update).toHaveBeenCalledWith({
        where: { id: 'ledger-dr' },
        data: { currentBalance: { increment: 5000 } },
      });
      expect((tx as never as { ledger: { update: jest.Mock } }).ledger.update).toHaveBeenCalledWith({
        where: { id: 'ledger-cr1' },
        data: { currentBalance: { increment: -3000 } },
      });
      expect((tx as never as { ledger: { update: jest.Mock } }).ledger.update).toHaveBeenCalledWith({
        where: { id: 'ledger-cr2' },
        data: { currentBalance: { increment: -2000 } },
      });
    });

    // ── Journal Metadata Tests ───────────────────────────────

    it('should include reversalOfJournalId when reversing', async () => {
      const tx = mockTx();
      (tx as never as { ledger: { findUniqueOrThrow: jest.Mock } }).ledger.findUniqueOrThrow
        .mockResolvedValue({ id: 'any', accountGroup: { nature: { normalBalance: 'DEBIT' } } });

      const reversalInput: PostJournalInput = {
        journalTypeId: 'jt-1',
        reversalOfJournalId: 'original-journal',
        lines: [
          { ledgerId: 'ledger-cr', debitAmount: 0, creditAmount: 1000 },
          { ledgerId: 'ledger-dr', debitAmount: 1000, creditAmount: 0 },
        ],
      };

      await service.postJournal(tx as never, reversalInput);

      expect((tx as never as { journal: { create: jest.Mock } }).journal.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ reversalOfJournalId: 'original-journal' }),
      });
    });

    it('should include notes when provided', async () => {
      const tx = mockTx();
      (tx as never as { ledger: { findUniqueOrThrow: jest.Mock } }).ledger.findUniqueOrThrow
        .mockResolvedValue({ id: 'any', accountGroup: { nature: { normalBalance: 'DEBIT' } } });

      const inputWithNotes: PostJournalInput = {
        journalTypeId: 'jt-1',
        notes: 'Test journal entry',
        lines: [
          { ledgerId: 'ledger-dr', debitAmount: 500, creditAmount: 0 },
          { ledgerId: 'ledger-cr', debitAmount: 0, creditAmount: 500 },
        ],
      };

      await service.postJournal(tx as never, inputWithNotes);

      expect((tx as never as { journal: { create: jest.Mock } }).journal.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ notes: 'Test journal entry' }),
      });
    });
  });
});
