import { BadRequestException, NotFoundException } from '@nestjs/common';
import { StockService } from './stock.service';

interface MockTx {
  stockItem: { findUnique: jest.Mock; create: jest.Mock };
  stockBatch: { findMany: jest.Mock; update: jest.Mock; create: jest.Mock; findFirst: jest.Mock };
  stockLedgerEntry: { create: jest.Mock; findFirst: jest.Mock };
  medicine: { findUnique: jest.Mock; update: jest.Mock };
}

function mockTx(overrides: {
  batches?: Array<{ id: string; currentQty: number; purchaseRate: number; expiryDate: Date | null; batchNo: string | null }>;
  lastEntry?: { runningBalanceQty: number; runningBalanceValue: number } | null;
  medicine?: Record<string, unknown>;
  existingBatch?: Record<string, unknown> | null;
} = {}): MockTx & Parameters<StockService['processStockOut']>[0] {
  const tx: MockTx = {
    stockItem: {
      findUnique: jest.fn().mockResolvedValue({ id: 'si-1', medicineId: 'med-1', valuationMethod: 'FIFO' }),
      create: jest.fn().mockResolvedValue({ id: 'si-new', medicineId: 'med-1' }),
    },
    stockBatch: {
      findMany: jest.fn().mockResolvedValue(overrides.batches ?? []),
      update: jest.fn().mockResolvedValue({}),
      create: jest.fn().mockResolvedValue({ id: 'batch-new', batchNo: 'B001' }),
      findFirst: jest.fn().mockResolvedValue(overrides.existingBatch ?? null),
    },
    stockLedgerEntry: {
      create: jest.fn().mockResolvedValue({ id: 'sle-1' }),
      findFirst: jest.fn().mockResolvedValue(overrides.lastEntry ?? null),
    },
    medicine: {
      findUnique: jest.fn().mockResolvedValue(overrides.medicine ?? { id: 'med-1', name: 'Paracetamol' }),
      update: jest.fn().mockResolvedValue({}),
    },
  };
  return tx as MockTx & Parameters<StockService['processStockOut']>[0];
}

describe('StockService', () => {
  let service: StockService;

  beforeEach(() => {
    service = new StockService(null as never);
    jest.clearAllMocks();
  });

  describe('processStockOut (FEFO)', () => {
    it('should throw when quantity is positive', async () => {
      const tx = mockTx();
      await expect(
        service.processStockOut(tx as never, {
          medicineId: 'med-1',
          quantity: 5,
          rate: 1000,
          movementType: 'SALE',
        }),
      ).rejects.toThrow('processStockOut requires a negative quantity');
    });

    it('should throw when no batches have stock', async () => {
      const tx = mockTx({ batches: [] });
      await expect(
        service.processStockOut(tx as never, {
          medicineId: 'med-1',
          quantity: -10,
          rate: 1000,
          movementType: 'SALE',
        }),
      ).rejects.toThrow('No stock available for medicine med-1');
    });

    it('should throw when insufficient stock', async () => {
      const tx = mockTx({
        batches: [
          { id: 'b1', currentQty: 5, purchaseRate: 1000, expiryDate: null, batchNo: 'B001' },
        ],
      });
      await expect(
        service.processStockOut(tx as never, {
          medicineId: 'med-1',
          quantity: -10,
          rate: 1000,
          movementType: 'SALE',
        }),
      ).rejects.toThrow('Insufficient stock for medicine med-1. Requested: 10, Available: 5');
    });

    it('should use FEFO: pick earliest expiry batch first', async () => {
      // Mock returns batches in FEFO order (earliest expiry first), as Prisma orderBy would
      const tx = mockTx({
        batches: [
          { id: 'b-early', currentQty: 10, purchaseRate: 1000, expiryDate: new Date('2026-06-01'), batchNo: 'EARLY' },
          { id: 'b-late', currentQty: 10, purchaseRate: 800, expiryDate: new Date('2027-01-01'), batchNo: 'LATE' },
        ],
      });

      const result = await service.processStockOut(tx as never, {
        medicineId: 'med-1',
        quantity: -5,
        rate: 1000,
        movementType: 'SALE',
      });

      expect(result).toEqual([
        { batchId: 'b-early', quantity: 5, rate: 1000 },
      ]);
      expect(tx.stockBatch.update).toHaveBeenCalledWith({
        where: { id: 'b-early' },
        data: { currentQty: { decrement: 5 } },
      });
    });

    it('should span multiple batches when one is not enough', async () => {
      const tx = mockTx({
        batches: [
          { id: 'b1', currentQty: 3, purchaseRate: 1000, expiryDate: new Date('2026-06-01'), batchNo: 'B1' },
          { id: 'b2', currentQty: 10, purchaseRate: 1200, expiryDate: new Date('2027-01-01'), batchNo: 'B2' },
        ],
      });

      const result = await service.processStockOut(tx as never, {
        medicineId: 'med-1',
        quantity: -8,
        rate: 1000,
        movementType: 'SALE',
      });

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ batchId: 'b1', quantity: 3, rate: 1000 });
      expect(result[1]).toEqual({ batchId: 'b2', quantity: 5, rate: 1200 });
      expect(tx.stockBatch.update).toHaveBeenCalledTimes(2);
      expect(tx.stockLedgerEntry.create).toHaveBeenCalledTimes(2);
    });

    it('should create negative stock ledger entries for sales', async () => {
      const tx = mockTx({
        batches: [
          { id: 'b1', currentQty: 20, purchaseRate: 1000, expiryDate: null, batchNo: 'B1' },
        ],
      });

      await service.processStockOut(tx as never, {
        medicineId: 'med-1',
        quantity: -5,
        rate: 1000,
        movementType: 'SALE',
        voucherId: 'v-1',
      });

      expect(tx.stockLedgerEntry.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          stockItemId: 'si-1',
          batchId: 'b1',
          quantity: -5,
          rate: 1000,
          value: -5000,
          movementType: 'SALE',
          voucherId: 'v-1',
        }),
      });
    });

    it('should decrement medicine.currentStock', async () => {
      const tx = mockTx({
        batches: [
          { id: 'b1', currentQty: 20, purchaseRate: 1000, expiryDate: null, batchNo: 'B1' },
        ],
      });

      await service.processStockOut(tx as never, {
        medicineId: 'med-1',
        quantity: -5,
        rate: 1000,
        movementType: 'SALE',
      });

      expect(tx.medicine.update).toHaveBeenCalledWith({
        where: { id: 'med-1' },
        data: { currentStock: { decrement: 5 } },
      });
    });
  });

  describe('processStockIn', () => {
    it('should throw when quantity is not positive', async () => {
      const tx = mockTx();
      await expect(
        service.processStockIn(tx as never, {
          medicineId: 'med-1',
          quantity: 0,
          rate: 1000,
          movementType: 'PURCHASE',
        }),
      ).rejects.toThrow('processStockIn requires a positive quantity');
    });

    it('should create a new batch when batchNo does not exist', async () => {
      const tx = mockTx();

      const result = await service.processStockIn(tx as never, {
        medicineId: 'med-1',
        quantity: 100,
        rate: 1000,
        batchNo: 'NEW-BATCH',
        movementType: 'PURCHASE',
        voucherId: 'v-1',
      });

      expect(result).toEqual({ batchId: 'batch-new', quantity: 100, rate: 1000 });
      expect(tx.stockLedgerEntry.create).toHaveBeenCalled();
      expect(tx.medicine.update).toHaveBeenCalledWith({
        where: { id: 'med-1' },
        data: { currentStock: { increment: 100 } },
      });
    });

    it('should increment existing batch when batchNo matches', async () => {
      const tx = mockTx({
        existingBatch: { id: 'existing-batch', currentQty: 50, purchaseRate: 900 },
      });

      const result = await service.processStockIn(tx as never, {
        medicineId: 'med-1',
        quantity: 25,
        rate: 1000,
        batchNo: 'EXISTING',
        movementType: 'PURCHASE',
      });

      expect(result.batchId).toBe('existing-batch');
      expect(result.quantity).toBe(25);
    });

    it('should create stock ledger entry with correct running balance', async () => {
      const tx = mockTx({
        lastEntry: { runningBalanceQty: 50, runningBalanceValue: 50000 },
      });

      await service.processStockIn(tx as never, {
        medicineId: 'med-1',
        quantity: 30,
        rate: 1000,
        movementType: 'PURCHASE',
      });

      expect(tx.stockLedgerEntry.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          quantity: 30,
          rate: 1000,
          value: 30000,
          runningBalanceQty: 80,
          runningBalanceValue: 80000,
          movementType: 'PURCHASE',
        }),
      });
    });
  });
});
