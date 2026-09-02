import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface StockMovementInput {
  medicineId: string;
  quantity: number; // positive for in, negative for out
  rate: number;    // in paise — purchase rate or cost price
  batchNo?: string;
  expiryDate?: Date;
  mrp?: number;    // in paise
  movementType: string; // SALE | PURCHASE | OPENING | ADJUSTMENT | TRANSFER | RETURN
  voucherId?: string;
  notes?: string;
  createdById?: string;
}

export interface ResolvedBatch {
  batchId: string;
  quantity: number;
  rate: number;
}

@Injectable()
export class StockService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Ensure a StockItem exists for a medicine. Creates one if missing.
   */
  async ensureStockItem(tx: PrismaService, medicineId: string) {
    const existing = await tx.stockItem.findUnique({ where: { medicineId } });
    if (existing) return existing;

    const medicine = await tx.medicine.findUnique({ where: { id: medicineId } });
    if (!medicine) throw new NotFoundException(`Medicine ${medicineId} not found`);

    return tx.stockItem.create({
      data: {
        medicineId,
        valuationMethod: 'FIFO',
        reorderLevel: 0,
      },
    });
  }

  /**
   * Process a stock-out (sale) using FEFO — First Expiry, First Out.
   * Returns the resolved batches and decrements them.
   * Also updates medicine.currentStock.
   */
  async processStockOut(
    tx: PrismaService,
    input: StockMovementInput,
  ): Promise<ResolvedBatch[]> {
    if (input.quantity >= 0) {
      throw new BadRequestException('processStockOut requires a negative quantity');
    }

    const stockItem = await this.ensureStockItem(tx, input.medicineId);
    const absQty = Math.abs(input.quantity);

    // Find batches ordered by FEFO: earliest expiry first, then by batch ID for determinism
    const batches = await tx.stockBatch.findMany({
      where: {
        stockItemId: stockItem.id,
        currentQty: { gt: 0 },
      },
      orderBy: [
        { expiryDate: 'asc' },  // FEFO: earliest expiry first
        { id: 'asc' },          // deterministic tiebreak
      ],
    });

    if (batches.length === 0) {
      throw new BadRequestException(
        `No stock available for medicine ${input.medicineId}. Cannot process sale.`,
      );
    }

    // Calculate total available
    const totalAvailable = batches.reduce(
      (sum, b) => sum + Number(b.currentQty),
      0,
    );

    if (absQty > totalAvailable) {
      throw new BadRequestException(
        `Insufficient stock for medicine ${input.medicineId}. ` +
        `Requested: ${absQty}, Available: ${totalAvailable}`,
      );
    }

    // Resolve batches using FEFO
    const resolved: ResolvedBatch[] = [];
    let remaining = absQty;

    for (const batch of batches) {
      if (remaining <= 0) break;

      const batchQty = Number(batch.currentQty);
      const takeQty = Math.min(remaining, batchQty);

      // Decrement batch
      await tx.stockBatch.update({
        where: { id: batch.id },
        data: { currentQty: { decrement: takeQty } },
      });

      // Create stock ledger entry
      const value = Math.round(takeQty * batch.purchaseRate);
      await tx.stockLedgerEntry.create({
        data: {
          stockItemId: stockItem.id,
          batchId: batch.id,
          quantity: -takeQty, // negative for out
          rate: batch.purchaseRate,
          value: -value,
          runningBalanceQty: batchQty - takeQty,
          runningBalanceValue: Math.round((batchQty - takeQty) * batch.purchaseRate),
          movementType: input.movementType,
          voucherId: input.voucherId ?? null,
          notes: input.notes ?? null,
        },
      });

      resolved.push({
        batchId: batch.id,
        quantity: takeQty,
        rate: batch.purchaseRate,
      });

      remaining -= takeQty;
    }

    // Update medicine.currentStock (Decimal)
    await tx.medicine.update({
      where: { id: input.medicineId },
      data: { currentStock: { decrement: absQty } },
    });

    return resolved;
  }

  /**
   * Process a stock-in (purchase/return) — creates or increments a batch.
   */
  async processStockIn(
    tx: PrismaService,
    input: StockMovementInput,
  ): Promise<{ batchId: string; quantity: number; rate: number }> {
    if (input.quantity <= 0) {
      throw new BadRequestException('processStockIn requires a positive quantity');
    }

    const stockItem = await this.ensureStockItem(tx, input.medicineId);

    // Find existing batch by batchNo if provided, otherwise create new
    let batch;
    if (input.batchNo) {
      batch = await tx.stockBatch.findFirst({
        where: {
          stockItemId: stockItem.id,
          batchNo: input.batchNo,
        },
      });
    }

    if (batch) {
      // Increment existing batch
      const batchId = batch.id;
      batch = await tx.stockBatch.update({
        where: { id: batchId },
        data: {
          currentQty: { increment: input.quantity },
          purchaseRate: input.rate ?? batch.purchaseRate,
          mrp: input.mrp ?? batch.mrp,
          expiryDate: input.expiryDate ?? batch.expiryDate,
        },
      });
      batch.id = batchId; // preserve ID after update
    } else {
      // Create new batch
      batch = await tx.stockBatch.create({
        data: {
          stockItemId: stockItem.id,
          batchNo: input.batchNo ?? null,
          expiryDate: input.expiryDate ?? null,
          purchaseRate: input.rate ?? 0,
          mrp: input.mrp ?? 0,
          currentQty: input.quantity,
        },
      });
    }

    // Get current running balance for this stock item
    const lastEntry = await tx.stockLedgerEntry.findFirst({
      where: { stockItemId: stockItem.id },
      orderBy: { createdAt: 'desc' },
    });
    const prevQty = lastEntry ? Number(lastEntry.runningBalanceQty) : 0;
    const prevValue = lastEntry ? lastEntry.runningBalanceValue : 0;

    const value = Math.round(input.quantity * (input.rate ?? 0));

    // Create stock ledger entry
    await tx.stockLedgerEntry.create({
      data: {
        stockItemId: stockItem.id,
        batchId: batch.id,
        quantity: input.quantity,
        rate: input.rate ?? 0,
        value,
        runningBalanceQty: prevQty + input.quantity,
        runningBalanceValue: prevValue + value,
        movementType: input.movementType,
        voucherId: input.voucherId ?? null,
        notes: input.notes ?? null,
      },
    });

    // Update medicine.currentStock
    await tx.medicine.update({
      where: { id: input.medicineId },
      data: { currentStock: { increment: input.quantity } },
    });

    return {
      batchId: batch.id,
      quantity: input.quantity,
      rate: input.rate ?? 0,
    };
  }

  /**
   * Get current stock summary for a medicine.
   */
  async getStockSummary(medicineId: string) {
    const stockItem = await this.prisma.stockItem.findUnique({
      where: { medicineId },
      include: {
        batches: {
          where: { currentQty: { gt: 0 } },
          orderBy: { expiryDate: 'asc' },
        },
      },
    });

    if (!stockItem) return null;

    const totalQty = stockItem.batches.reduce(
      (sum, b) => sum + Number(b.currentQty),
      0,
    );
    const totalValue = stockItem.batches.reduce(
      (sum, b) => sum + Math.round(Number(b.currentQty) * b.purchaseRate),
      0,
    );

    return {
      stockItemId: stockItem.id,
      medicineId,
      valuationMethod: stockItem.valuationMethod,
      totalQty,
      totalValue,
      batches: stockItem.batches.map((b) => ({
        batchId: b.id,
        batchNo: b.batchNo,
        expiryDate: b.expiryDate,
        purchaseRate: b.purchaseRate,
        mrp: b.mrp,
        currentQty: Number(b.currentQty),
      })),
    };
  }
}
