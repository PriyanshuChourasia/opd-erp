import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { paginate } from '../common/utils/paginate';
import { getDoctorNameMap } from '../common/utils/doctor-names';
import { resolveDiscount } from '../common/utils/discount';
import type { IBaseService, IPaginatable } from '../common/interfaces/base-service.interface';
import type { PaginatedResult } from '../common/interfaces/paginated-result.interface';
import { PrismaClient, type Bill } from '@prisma/client';

/** The client type Prisma provides inside $transaction callback. */
type TransactionClient = Parameters<Parameters<PrismaClient['$transaction']>[0]>[0];
import { applyCreatedAtRange } from '../common/dto/date-range-query.dto';
import { CreateBillDto } from './dto/create-bill.dto';
import { UpdateBillStatusDto } from './dto/update-bill-status.dto';
import { FindBillsQueryDto } from './dto/find-bills-query.dto';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { CreateRefundDto } from './dto/create-refund.dto';
import { AccountingService } from '../accounting/accounting.service';
import { StockService } from '../stock/stock.service';

interface WithAppointmentDoctor {
  appointment: ({ doctorId: string } & Record<string, unknown>) | null;
}

/** Attaches the doctor's display name onto a bill's linked appointment, if any. */
async function withDoctorName<T extends WithAppointmentDoctor>(prisma: PrismaService, bill: T): Promise<T> {
  if (!bill.appointment) return bill;
  const nameMap = await getDoctorNameMap(prisma, [bill.appointment.doctorId]);
  return { ...bill, appointment: { ...bill.appointment, doctorName: nameMap.get(bill.appointment.doctorId) ?? null } };
}

async function withDoctorNames<T extends WithAppointmentDoctor>(prisma: PrismaService, bills: T[]): Promise<T[]> {
  const doctorIds = bills.filter((b) => b.appointment).map((b) => b.appointment!.doctorId);
  const nameMap = await getDoctorNameMap(prisma, doctorIds);
  return bills.map((b) => (b.appointment ? { ...b, appointment: { ...b.appointment, doctorName: nameMap.get(b.appointment.doctorId) ?? null } } : b));
}

interface WithBillItems {
  id: string;
  items: { itemType: string; itemId: string | null }[];
}

/**
 * Read-only enrichment for the invoice: for MEDICINE items, resolve the
 * exact batch/expiry that was actually sold on the bill's SALES voucher
 * (from the stock ledger) plus the medicine's HSN code from its StockItem.
 * Leaves items untouched when no stock movement exists (e.g. walk-in
 * charges, seeded bills without stock). This does not modify any stock or
 * accounting state — it only reads it.
 */
async function withItemBatchDetails<T extends WithBillItems>(prisma: PrismaService, bill: T): Promise<T> {
  const medicineItems = bill.items.filter((i) => i.itemType === 'MEDICINE' && i.itemId);
  if (medicineItems.length === 0) return bill;

  const voucher = await prisma.voucher.findFirst({
    where: { sourceModule: 'Bill', sourceId: bill.id },
  });
  if (!voucher) return bill;

  const entries = await prisma.stockLedgerEntry.findMany({
    where: { voucherId: voucher.id, movementType: 'SALE' },
    include: {
      stockItem: { select: { medicineId: true, hsnCode: true } },
      batch: { select: { batchNo: true, expiryDate: true } },
    },
  });
  if (entries.length === 0) return bill;

  const detailByMedicine = new Map<string, { batchNos: string[]; expiryDates: string[]; hsnCode: string | null }>();
  for (const entry of entries) {
    const medicineId = entry.stockItem.medicineId;
    let detail = detailByMedicine.get(medicineId);
    if (!detail) {
      detail = { batchNos: [], expiryDates: [], hsnCode: entry.stockItem.hsnCode ?? null };
      detailByMedicine.set(medicineId, detail);
    }
    if (entry.batch?.batchNo && !detail.batchNos.includes(entry.batch.batchNo)) {
      detail.batchNos.push(entry.batch.batchNo);
    }
    if (entry.batch?.expiryDate) {
      const iso = entry.batch.expiryDate.toISOString();
      if (!detail.expiryDates.includes(iso)) detail.expiryDates.push(iso);
    }
  }

  return {
    ...bill,
    items: bill.items.map((item) => {
      if (item.itemType !== 'MEDICINE' || !item.itemId) return item;
      const detail = detailByMedicine.get(item.itemId);
      if (!detail) return item;
      return {
        ...item,
        batchNo: detail.batchNos.length > 0 ? detail.batchNos.join(', ') : null,
        expiryDate: detail.expiryDates.length > 0 ? detail.expiryDates.join(', ') : null,
        hsnCode: detail.hsnCode,
      };
    }),
  };
}

/**
 * Generates invoice numbers using the database's auto-increment by
 * counting existing bills + 1, prefixed with year-month.
 */
async function generateInvoiceNo(prisma: PrismaService, financialYearId: string): Promise<string> {
  const fy = await prisma.financialYear.findUniqueOrThrow({ where: { id: financialYearId } });
  // Extract 2-digit year from FY name like "2026-2027" → "27"
  const fyNameParts = fy.name.split('-');
  const endYear = fyNameParts.length >= 2 ? fyNameParts[1] : fyNameParts[0];
  const shortYear = endYear.slice(-2);
  const count = await prisma.bill.count({ where: { financialYearId } });
  return `INV-${shortYear}-${(count + 1).toString().padStart(5, '0')}`;
}

/**
 * Invoice generation, payment tracking, and refund processing.
 *
 * # SOLID
 * - **Single Responsibility** — only billing lifecycle.
 * - **Open/Closed** — new payment methods or discount strategies can be added
 *   without modifying core CRUD.
 */
@Injectable()
export class BillingService
  implements IBaseService<Bill, CreateBillDto, UpdateBillStatusDto>, IPaginatable<Bill, FindBillsQueryDto>
{
  constructor(
    private readonly prisma: PrismaService,
    private readonly accountingService: AccountingService,
    private readonly stockService: StockService,
  ) {}

  async create(dto: CreateBillDto, userId?: string) {
    if (dto.appointmentId) {
      const appointment = await this.prisma.appointment.findUnique({
        where: { id: dto.appointmentId },
        include: { bill: true },
      });
      if (!appointment) throw new NotFoundException(`Appointment ${dto.appointmentId} not found`);
      if (appointment.bill) throw new ConflictException(`Appointment ${dto.appointmentId} is already invoiced (${appointment.bill.invoiceNo})`);
    }

    const items = dto.items.map((item) => ({
      itemType: item.itemType,
      itemId: item.itemId,
      itemName: item.itemName,
      quantity: item.quantity ?? 1,
      unitPrice: item.unitPrice,
      amount: (item.quantity ?? 1) * item.unitPrice,
    }));

    const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
    const { discount, discountRuleId } = await resolveDiscount(this.prisma, dto.discountRuleId, subtotal);
    const tax = dto.tax ?? 0;
    const total = subtotal - discount + tax;

    return this.prisma.$transaction(async (tx) => {
      // 0. Resolve current financial year
      const fy = await this.accountingService.getCurrentFinancialYear(tx);

      // 1. Create the bill with items
      const bill = await tx.bill.create({
        data: {
          patientId: dto.patientId,
          appointmentId: dto.appointmentId,
          invoiceNo: await generateInvoiceNo(tx as PrismaService, fy.id),
          financialYearId: fy.id,
          subtotal,
          discount,
          discountRuleId,
          tax,
          total,
          paymentMethod: dto.paymentMethod ?? 'CASH',
          notes: dto.notes,
          createdById: userId ?? null,
          items: { create: items },
        },
        include: { items: true, patient: true },
      });

      // 2. Create Sales voucher + journal for the bill
      await this.createSalesVoucher(tx, bill, userId);

      return bill;
    });
  }

  async findAll(query: FindBillsQueryDto): Promise<PaginatedResult<Bill>> {
    const where: Record<string, unknown> = { deletedAt: null };
    if (query.patientId) where.patientId = query.patientId;
    if (query.financialYearId) where.financialYearId = query.financialYearId;
    applyCreatedAtRange(where, query);
    const result = await paginate(
      () => this.prisma.bill.count({ where }),
      ({ skip, take }) =>
        this.prisma.bill.findMany({
          where,
          include: { items: true, patient: true, appointment: { select: { id: true, doctorId: true, type: true, date: true } } },
          orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
          skip,
          take,
        }),
      query,
    );
    return { ...result, data: await withDoctorNames(this.prisma, result.data) };
  }

  async findOne(id: string) {
    const bill = await this.prisma.bill.findUnique({
      where: { id, deletedAt: null },
      include: { items: true, patient: true, appointment: { select: { id: true, doctorId: true, type: true, date: true } } },
    });
    if (!bill) throw new NotFoundException(`Bill ${id} not found`);
    return withDoctorName(this.prisma, await withItemBatchDetails(this.prisma, bill));
  }

  async update(id: string, dto: UpdateBillStatusDto, userId?: string) {
    await this.findOne(id);
    return this.prisma.bill.update({
      where: { id },
      data: { status: dto.status, updatedById: userId ?? null },
      include: { items: true, patient: true },
    });
  }

  async remove(id: string, deletedById?: string) {
    await this.findOne(id);
    return this.prisma.bill.update({
      where: { id },
      data: { deletedAt: new Date(), deletedById: deletedById ?? null },
    });
  }

  // ─── Payment Ledger ──────────────────────────────────────────

  /**
   * Record a payment installment against an existing invoice.
   * Writes a ledger row, syncs Bill.paidAmount, and recomputes Bill.status.
   */
  async addPayment(billId: string, dto: CreatePaymentDto, userId?: string) {
    const bill = await this.prisma.bill.findUnique({
      where: { id: billId, deletedAt: null },
    });
    if (!bill) throw new NotFoundException(`Bill ${billId} not found`);
    if (!bill.patientId) throw new BadRequestException(`Bill ${billId} has no linked patient`);
    const patientId = bill.patientId; // narrowed from string | null

    const payment = await this.prisma.$transaction(async (tx) => {
      // 1. Write the ledger row
      const row = await tx.payment.create({
        data: {
          billId,
          appointmentId: bill.appointmentId,
          patientId,
          amount: dto.amount,
          method: dto.method,
          direction: 'PAYMENT',
          referenceNumber: dto.referenceNumber ?? null,
          notes: dto.notes ?? null,
          collectedById: userId ?? null,
        },
      });

      // 2. Recompute paidAmount from ledger sum (PAYMENT rows only, for this bill)
      const sum = await tx.payment.aggregate({
        where: { billId, direction: 'PAYMENT' },
        _sum: { amount: true },
      });
      const totalPaid = sum._sum.amount ?? 0;

      // 3. Derive status from paid vs total
      const status = totalPaid >= bill.total ? 'PAID' : 'PARTIALLY_PAID';

      await tx.bill.update({
        where: { id: billId },
        data: { paidAmount: totalPaid, status, updatedById: userId ?? null },
      });

      // 4. If this bill is linked to an appointment, sync appointment.amountPaid too
      if (bill.appointmentId) {
        const apptSum = await tx.payment.aggregate({
          where: { appointmentId: bill.appointmentId, direction: 'PAYMENT' },
          _sum: { amount: true },
        });
        await tx.appointment.update({
          where: { id: bill.appointmentId },
          data: { amountPaid: apptSum._sum.amount ?? 0 },
        });
      }

      // 5. Create accounting voucher + journal (RECEIPT) inside the same tx
      await this.createReceiptVoucher(tx, row.id, patientId, dto.amount, billId, userId);

      return row;
    });

    return payment;
  }

  /**
   * List all payment/refund ledger rows for a bill.
   */
  async getPayments(billId: string) {
    await this.findOne(billId);
    return this.prisma.payment.findMany({
      where: { billId },
      orderBy: { createdAt: 'asc' },
      include: {
        collectedBy: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }

  // ─── Receipt ──────────────────────────────────────────────────

  /**
   * Fetch the receipt data for a specific payment — the merged payload
   * needed to render a formal receipt document (Apollo 24|7 layout).
   */
  async getReceipt(billId: string, paymentId: string) {
    const bill = await this.prisma.bill.findUnique({
      where: { id: billId, deletedAt: null },
      include: {
        items: true,
        patient: true,
        appointment: {
          include: {
            doctor: true,
          },
        },
      },
    });
    if (!bill) throw new NotFoundException(`Bill ${billId} not found`);

    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
    });
    if (!payment) throw new NotFoundException(`Payment ${paymentId} not found`);
    if (payment.billId !== billId) throw new BadRequestException('Payment does not belong to this bill');

    // Find the RECEIPT voucher for this payment
    const voucher = await this.prisma.voucher.findFirst({
      where: { sourceModule: 'Payment', sourceId: paymentId },
    });

    // Fetch company details
    const company = await this.prisma.company.findFirst();

    // Fetch patient address (if any)
    const patientAddress = bill.patientId
      ? await this.prisma.address.findFirst({
          where: { addressableType: 'Patient', addressableId: bill.patientId, isPrimary: true },
        })
      : null;

    // Resolve doctor name
    let doctorName: string | null = null;
    let doctorSpecialization: string | null = null;
    if (bill.appointment?.doctor) {
      const doctorUser = await this.prisma.user.findFirst({
        where: { userableType: 'Doctor', userableId: bill.appointment.doctor.id },
      });
      doctorName = doctorUser ? `${doctorUser.firstName} ${doctorUser.lastName}` : null;
      doctorSpecialization = bill.appointment.doctor.specialization ?? null;
    }

    return {
      receipt: {
        voucherNumber: voucher?.voucherNumber ?? null,
        voucherDate: voucher?.voucherDate ?? payment.createdAt,
        amount: payment.amount,
        method: payment.method,
        referenceNumber: payment.referenceNumber,
      },
      bill: {
        invoiceNo: bill.invoiceNo,
        subtotal: bill.subtotal,
        discount: bill.discount,
        tax: bill.tax,
        total: bill.total,
        items: bill.items,
        appointmentId: bill.appointmentId,
      },
      patient: bill.patient
        ? {
            name: `${bill.patient.firstName} ${bill.patient.lastName}`,
            patientCode: bill.patient.patientCode,
            contactNo: bill.patient.contactNo,
            email: bill.patient.email,
          }
        : null,
      address: patientAddress
        ? {
            line1: patientAddress.addressLine1,
            line2: patientAddress.addressLine2,
            city: patientAddress.city,
            state: patientAddress.state,
            postalCode: patientAddress.postalCode,
          }
        : null,
      doctor: doctorName
        ? { name: doctorName, specialization: doctorSpecialization }
        : null,
      company: company
        ? {
            name: company.name,
            address: company.address,
            phone: company.phone,
            email: company.email,
            website: company.website,
            gstNumber: company.gstNumber,
            panNumber: company.panNumber,
            cinNumber: company.cinNumber,
          }
        : null,
    };
  }

  // ─── Refund ──────────────────────────────────────────────────

  /**
   * Record a refund against a bill. Writes a REFUND-direction ledger row,
   * caps at the total amount already paid, and recomputes bill status.
   */
  async refund(billId: string, dto: CreateRefundDto, userId?: string) {
    const bill = await this.prisma.bill.findUnique({
      where: { id: billId, deletedAt: null },
    });
    if (!bill) throw new NotFoundException(`Bill ${billId} not found`);
    if (!bill.patientId) throw new BadRequestException(`Bill ${billId} has no linked patient`);
    const patientId = bill.patientId;

    // Sum of all PAYMENT rows for this bill (total received)
    const paidSum = await this.prisma.payment.aggregate({
      where: { billId, direction: 'PAYMENT' },
      _sum: { amount: true },
    });
    const totalPaid = paidSum._sum.amount ?? 0;

    // Sum of all REFUND rows for this bill (total already refunded)
    const refundSum = await this.prisma.payment.aggregate({
      where: { billId, direction: 'REFUND' },
      _sum: { amount: true },
    });
    const totalRefunded = refundSum._sum.amount ?? 0;

    const netPaid = totalPaid - totalRefunded;
    if (dto.amount > netPaid) {
      throw new BadRequestException(
        `Refund amount ₹${dto.amount} exceeds net paid amount ₹${netPaid} ` +
        `(total paid: ₹${totalPaid}, already refunded: ₹${totalRefunded})`,
      );
    }

    const payment = await this.prisma.$transaction(async (tx) => {
      // 1. Write the REFUND ledger row
      const row = await tx.payment.create({
        data: {
          billId,
          appointmentId: bill.appointmentId,
          patientId,
          amount: dto.amount,
          method: dto.method ?? 'CASH',
          direction: 'REFUND',
          referenceNumber: dto.referenceNumber ?? null,
          notes: dto.reason,
          collectedById: userId ?? null,
        },
      });

      // 2. Recompute paidAmount and status
      const newNetPaid = netPaid - dto.amount;
      let status: string;
      if (newNetPaid <= 0) {
        status = 'REFUNDED';
      } else if (newNetPaid < bill.total) {
        status = 'PARTIALLY_PAID';
      } else {
        status = 'PAID';
      }

      await tx.bill.update({
        where: { id: billId },
        data: { paidAmount: newNetPaid, status, updatedById: userId ?? null },
      });

      // 3. Sync appointment.amountPaid if linked
      if (bill.appointmentId) {
        const apptPaySum = await tx.payment.aggregate({
          where: { appointmentId: bill.appointmentId, direction: 'PAYMENT' },
          _sum: { amount: true },
        });
        const apptRefundSum = await tx.payment.aggregate({
          where: { appointmentId: bill.appointmentId, direction: 'REFUND' },
          _sum: { amount: true },
        });
        const apptNetPaid = (apptPaySum._sum.amount ?? 0) - (apptRefundSum._sum.amount ?? 0);
        await tx.appointment.update({
          where: { id: bill.appointmentId },
          data: { amountPaid: apptNetPaid },
        });
      }

      // 4. Create accounting voucher + journal (PAYMENT voucher type — outbound refund)
      await this.createRefundVoucher(tx, row.id, patientId, dto.amount, billId, userId);

      return row;
    });

    return payment;
  }

  // ─── Accounting Helpers ──────────────────────────────────────

  /**
   * Create a RECEIPT voucher + journal + voucher reference for a payment.
   */
  private async createReceiptVoucher(
    tx: TransactionClient,
    paymentId: string,
    patientId: string,
    amount: number,
    billId: string,
    createdById?: string,
  ) {
    const fy = await this.accountingService.getCurrentFinancialYear(tx);
    const receiptVoucherType = await tx.voucherType.findFirst({ where: { code: 'RECEIPT' } });
    if (!receiptVoucherType) throw new BadRequestException('RECEIPT voucher type not found. Run seed.');

    const generalJournalType = await tx.journalType.findFirst({ where: { code: 'GENERAL' } });
    if (!generalJournalType) throw new BadRequestException('GENERAL journal type not found. Run seed.');

    const patient = await tx.patient.findUniqueOrThrow({ where: { id: patientId } });
    const patientLedger = await this.accountingService.resolveOrCreatePatientLedger(
      tx, patientId, `${patient.firstName} ${patient.lastName}`.trim(), createdById,
    );
    const methodLedger = await this.accountingService.resolveMethodLedger(tx, 'CASH');
    const voucherNumber = await this.accountingService.nextVoucherNumber(tx, receiptVoucherType.id, fy.id);

    const { voucher } = await this.accountingService.createVoucherAndJournal(tx, {
      voucherTypeId: receiptVoucherType.id,
      voucherNumber,
      voucherDate: new Date(),
      financialYearId: fy.id,
      partyLedgerId: patientLedger.id,
      totalAmount: amount,
      status: 'POSTED',
      sourceModule: 'Payment',
      sourceId: paymentId,
      journalTypeId: generalJournalType.id,
      journalLines: [
        { ledgerId: methodLedger.id, debitAmount: amount, creditAmount: 0 },
        { ledgerId: patientLedger.id, debitAmount: 0, creditAmount: amount },
      ],
      notes: `Receipt for payment ${paymentId}`,
      createdById,
    });

    // Try to find the bill's Sales voucher for AGAINST_REF
    const salesVoucher = await tx.voucher.findFirst({
      where: { sourceModule: 'Bill', sourceId: billId },
    });

    await tx.voucherReference.create({
      data: {
        voucherId: voucher.id,
        referenceType: salesVoucher ? 'AGAINST_REF' : 'ON_ACCOUNT',
        referencedVoucherId: salesVoucher?.id ?? null,
        ledgerId: patientLedger.id,
        amount,
      },
    });
  }

  /**
   * Create a PAYMENT voucher + journal + voucher reference for a refund.
   * (The accounting PAYMENT voucher type, not the Payment Prisma model.)
   */
  private async createRefundVoucher(
    tx: TransactionClient,
    paymentId: string,
    patientId: string,
    amount: number,
    billId: string,
    createdById?: string,
  ) {
    const fy = await this.accountingService.getCurrentFinancialYear(tx);
    const paymentVoucherType = await tx.voucherType.findFirst({ where: { code: 'PAYMENT' } });
    if (!paymentVoucherType) throw new BadRequestException('PAYMENT voucher type not found. Run seed.');

    const generalJournalType = await tx.journalType.findFirst({ where: { code: 'GENERAL' } });
    if (!generalJournalType) throw new BadRequestException('GENERAL journal type not found. Run seed.');

    const patient = await tx.patient.findUniqueOrThrow({ where: { id: patientId } });
    const patientLedger = await this.accountingService.resolveOrCreatePatientLedger(
      tx, patientId, `${patient.firstName} ${patient.lastName}`.trim(), createdById,
    );
    const methodLedger = await this.accountingService.resolveMethodLedger(tx, 'CASH');
    const voucherNumber = await this.accountingService.nextVoucherNumber(tx, paymentVoucherType.id, fy.id);

    // Reverse of receipt: Dr Patient, Cr Cash
    const { voucher } = await this.accountingService.createVoucherAndJournal(tx, {
      voucherTypeId: paymentVoucherType.id,
      voucherNumber,
      voucherDate: new Date(),
      financialYearId: fy.id,
      partyLedgerId: patientLedger.id,
      totalAmount: amount,
      status: 'POSTED',
      sourceModule: 'Payment',
      sourceId: paymentId,
      journalTypeId: generalJournalType.id,
      journalLines: [
        { ledgerId: patientLedger.id, debitAmount: amount, creditAmount: 0 },
        { ledgerId: methodLedger.id, debitAmount: 0, creditAmount: amount },
      ],
      notes: `Refund for payment ${paymentId}`,
      createdById,
    });

    // Try to find original Receipt voucher for AGAINST_REF
    const originalReceiptVoucher = await tx.voucher.findFirst({
      where: { sourceModule: 'Payment', voucherType: { code: 'RECEIPT' } },
      orderBy: { createdAt: 'desc' },
    });

    await tx.voucherReference.create({
      data: {
        voucherId: voucher.id,
        referenceType: originalReceiptVoucher ? 'AGAINST_REF' : 'ON_ACCOUNT',
        referencedVoucherId: originalReceiptVoucher?.id ?? null,
        ledgerId: patientLedger.id,
        amount,
      },
    });
  }

  // ─── Sales Voucher (Bill creation wiring) ──────────────────────

  /**
   * Create a Sales voucher + balanced journal for a newly created bill.
   * Journal lines:
   *   Dr  Patient Ledger (or Sundry Debtors if no patient)  — total
   *   Cr  Income Ledger per item type (Pharmacy Sales / Consultation Income / Lab Income)  — item amounts
   *   Cr  Discount Received  — discount (if > 0)
   *   Cr  GST Payable  — tax (if > 0)
   */
  private async createSalesVoucher(
    tx: TransactionClient,
    bill: {
      id: string;
      patientId: string | null;
      total: number;
      subtotal: number;
      discount: number;
      tax: number;
      items: { itemType: string; itemName: string; itemId: string | null; amount: number; quantity: number }[];
    },
    createdById?: string,
  ) {
    const fy = await this.accountingService.getCurrentFinancialYear(tx);
    const salesVoucherType = await tx.voucherType.findFirst({ where: { code: 'SALES' } });
    if (!salesVoucherType) throw new BadRequestException('SALES voucher type not found. Run seed.');

    const generalJournalType = await tx.journalType.findFirst({ where: { code: 'GENERAL' } });
    if (!generalJournalType) throw new BadRequestException('GENERAL journal type not found. Run seed.');

    // Resolve patient ledger (Dr side) — falls back to generic Sundry Debtors if no patient
    let partyLedgerId: string;
    if (bill.patientId) {
      const patient = await tx.patient.findUniqueOrThrow({ where: { id: bill.patientId } });
      const patientLedger = await this.accountingService.resolveOrCreatePatientLedger(
        tx, bill.patientId, `${patient.firstName} ${patient.lastName}`.trim(), createdById,
      );
      partyLedgerId = patientLedger.id;
    } else {
      const sundryDebtors = await tx.ledger.findFirst({ where: { name: 'Sundry Debtors' } });
      if (!sundryDebtors) throw new BadRequestException('Sundry Debtors ledger not found. Run seed.');
      partyLedgerId = sundryDebtors.id;
    }

    // Map item types → income ledger names
    const incomeLedgerMap: Record<string, string> = {
      MEDICINE: 'Pharmacy Sales',
      CONSULTATION: 'Consultation Income',
      LAB: 'Lab Income',
      PROCEDURE: 'Consultation Income',
    };

    // Group items by income ledger
    const ledgerAmounts = new Map<string, number>();
    for (const item of bill.items) {
      const ledgerName = incomeLedgerMap[item.itemType] ?? 'Pharmacy Sales';
      ledgerAmounts.set(ledgerName, (ledgerAmounts.get(ledgerName) ?? 0) + item.amount);
    }

    // Build credit lines for income
    const journalLines: { ledgerId: string; debitAmount: number; creditAmount: number }[] = [];
    for (const [ledgerName, amount] of ledgerAmounts) {
      const ledger = await tx.ledger.findFirst({ where: { name: ledgerName } });
      if (!ledger) throw new BadRequestException(`Ledger "${ledgerName}" not found. Run seed.`);
      journalLines.push({ ledgerId: ledger.id, debitAmount: 0, creditAmount: amount });
    }

    // Discount line (if any)
    if (bill.discount > 0) {
      const discountLedger = await tx.ledger.findFirst({ where: { name: 'Other Income' } });
      if (discountLedger) {
        journalLines.push({ ledgerId: discountLedger.id, debitAmount: 0, creditAmount: bill.discount });
      }
    }

    // Tax line (if any)
    if (bill.tax > 0) {
      const gstLedger = await tx.ledger.findFirst({ where: { name: 'GST Payable' } });
      if (!gstLedger) throw new BadRequestException('GST Payable ledger not found. Run seed.');
      journalLines.push({ ledgerId: gstLedger.id, debitAmount: 0, creditAmount: bill.tax });
    }

    // Debit line: Dr Patient Ledger for total
    journalLines.push({ ledgerId: partyLedgerId, debitAmount: bill.total, creditAmount: 0 });

    const voucherNumber = await this.accountingService.nextVoucherNumber(tx, salesVoucherType.id, fy.id);

    const { voucher } = await this.accountingService.createVoucherAndJournal(tx, {
      voucherTypeId: salesVoucherType.id,
      voucherNumber,
      voucherDate: new Date(),
      financialYearId: fy.id,
      partyLedgerId,
      totalAmount: bill.total,
      status: 'POSTED',
      sourceModule: 'Bill',
      sourceId: bill.id,
      journalTypeId: generalJournalType.id,
      journalLines,
      notes: `Sales voucher for bill ${bill.id}`,
      createdById,
    });

    // Create NEW_REF voucher reference
    await tx.voucherReference.create({
      data: {
        voucherId: voucher.id,
        referenceType: 'NEW_REF',
        referencedVoucherId: voucher.id,
        ledgerId: partyLedgerId,
        amount: bill.total,
      },
    });

    // ── Stock Movements: FEFO stock-out for MEDICINE items ──
    const inventoryLedger = await tx.ledger.findFirst({ where: { name: 'Inventory Asset' } });
    const cogsLedger = await tx.ledger.findFirst({ where: { name: 'Cost of Goods Sold' } });
    const medicineItems = bill.items.filter((i) => i.itemType === 'MEDICINE' && i.itemId);

    if (medicineItems.length > 0 && inventoryLedger && cogsLedger) {
      for (const item of medicineItems) {
        // processStockOut needs to run via the service's tx, but we're already in a tx.
        // We call the service method directly, passing tx.
        const batches = await this.stockService.processStockOut(tx as PrismaService, {
          medicineId: item.itemId!,
          quantity: -item.quantity,
          rate: 0, // rate comes from batch purchase rate inside processStockOut
          movementType: 'SALE',
          voucherId: voucher.id,
          notes: `Bill ${bill.id}, item: ${item.itemName}`,
          createdById,
        });

        // COGS journal lines: Dr COGS, Cr Inventory Asset
        const cogsTotal = batches.reduce((sum, b) => sum + b.quantity * b.rate, 0);
        if (cogsTotal > 0) {
          await this.accountingService.postJournal(tx as PrismaService, {
            voucherId: voucher.id,
            journalTypeId: generalJournalType.id,
            lines: [
              { ledgerId: cogsLedger.id, debitAmount: cogsTotal, creditAmount: 0 },
              { ledgerId: inventoryLedger.id, debitAmount: 0, creditAmount: cogsTotal },
            ],
            notes: `COGS for bill ${bill.id}, medicine: ${item.itemName}`,
            createdById,
          });
        }
      }
    }
  }
}
