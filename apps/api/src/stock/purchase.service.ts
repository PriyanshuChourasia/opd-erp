import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StockService } from './stock.service';
import { AccountingService } from '../accounting/accounting.service';
import { CreatePurchaseDto } from './dto/create-purchase.dto';

@Injectable()
export class PurchaseService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stockService: StockService,
    private readonly accountingService: AccountingService,
  ) {}

  /**
   * Record a purchase from a supplier:
   * 1. Create Purchase Voucher + journal (Dr Inventory Asset, Cr Supplier/Sundry Creditors)
   * 2. Stock-in each medicine batch
   */
  async createPurchase(dto: CreatePurchaseDto, userId?: string) {
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('Purchase must have at least one item');
    }

    const result = await this.prisma.$transaction(async (tx) => {
      // 1. Calculate totals
      const totalAmount = dto.items.reduce(
        (sum, item) => sum + item.quantity * item.purchaseRate,
        0,
      );
      const tax = dto.tax ?? 0;
      const grandTotal = totalAmount + tax;

      // 2. Resolve ledgers
      const fy = await this.accountingService.getCurrentFinancialYear(tx);
      const purchaseVoucherType = await tx.voucherType.findFirst({ where: { code: 'PURCHASE' } });
      if (!purchaseVoucherType) throw new BadRequestException('PURCHASE voucher type not found. Run seed.');

      const generalJournalType = await tx.journalType.findFirst({ where: { code: 'GENERAL' } });
      if (!generalJournalType) throw new BadRequestException('GENERAL journal type not found. Run seed.');

      const inventoryLedger = await tx.ledger.findFirst({ where: { name: 'Inventory Asset' } });
      if (!inventoryLedger) throw new BadRequestException('Inventory Asset ledger not found. Run seed.');

      // Supplier ledger: use provided or default to Sundry Creditors
      let supplierLedger;
      if (dto.supplierLedgerId) {
        supplierLedger = await tx.ledger.findUnique({ where: { id: dto.supplierLedgerId } });
        if (!supplierLedger) throw new BadRequestException(`Supplier ledger ${dto.supplierLedgerId} not found.`);
      } else {
        supplierLedger = await tx.ledger.findFirst({ where: { name: 'Sundry Creditors' } });
        if (!supplierLedger) throw new BadRequestException('Sundry Creditors ledger not found. Run seed.');
      }

      // 3. Create Purchase voucher
      const voucherNumber = await this.accountingService.nextVoucherNumber(tx, purchaseVoucherType.id, fy.id);
      const { voucher } = await this.accountingService.createVoucherAndJournal(tx, {
        voucherTypeId: purchaseVoucherType.id,
        voucherNumber,
        voucherDate: dto.purchaseDate ? new Date(dto.purchaseDate) : new Date(),
        financialYearId: fy.id,
        partyLedgerId: supplierLedger.id,
        totalAmount: grandTotal,
        status: 'POSTED',
        sourceModule: 'Purchase',
        sourceId: undefined,
        journalTypeId: generalJournalType.id,
        journalLines: [
          // Dr Inventory Asset
          { ledgerId: inventoryLedger.id, debitAmount: totalAmount, creditAmount: 0 },
          // Cr Supplier
          { ledgerId: supplierLedger.id, debitAmount: 0, creditAmount: totalAmount },
          // Tax line if applicable
          ...(tax > 0 ? [{ ledgerId: inventoryLedger.id, debitAmount: tax, creditAmount: 0 }] : []),
        ],
        notes: dto.notes ?? `Purchase from ${dto.supplierName ?? 'supplier'}`,
        createdById: userId,
      });

      // 4. Stock-in each item
      const stockResults: { batchId: string; quantity: number; rate: number }[] = [];
      for (const item of dto.items) {
        const result = await this.stockService.processStockIn(tx as PrismaService, {
          medicineId: item.medicineId,
          quantity: item.quantity,
          rate: item.purchaseRate,
          batchNo: item.batchNo,
          expiryDate: item.expiryDate ? new Date(item.expiryDate) : undefined,
          mrp: item.mrp,
          movementType: 'PURCHASE',
          voucherId: voucher.id,
          notes: `Purchase voucher ${voucher.id}`,
          createdById: userId,
        });
        stockResults.push(result);
      }

      return {
        voucherId: voucher.id,
        voucherNumber: voucher.voucherNumber,
        totalAmount: grandTotal,
        items: stockResults,
      };
    });

    return result;
  }
}
