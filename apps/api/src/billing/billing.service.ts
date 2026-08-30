import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { paginate } from '../common/utils/paginate';
import { getDoctorNameMap } from '../common/utils/doctor-names';
import type { IBaseService, IPaginatable } from '../common/interfaces/base-service.interface';
import type { PaginatedResult } from '../common/interfaces/paginated-result.interface';
import type { Bill } from '@prisma/client';
import { CreateBillDto } from './dto/create-bill.dto';
import { UpdateBillStatusDto } from './dto/update-bill-status.dto';
import { FindBillsQueryDto } from './dto/find-bills-query.dto';

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

/**
 * Generates invoice numbers using the database's auto-increment by
 * counting existing bills + 1, prefixed with year-month.
 */
async function generateInvoiceNo(prisma: PrismaService): Promise<string> {
  const date = new Date();
  const y = date.getFullYear().toString().slice(-2);
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  const count = await prisma.bill.count();
  return `INV-${y}${m}-${(count + 1).toString().padStart(5, '0')}`;
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
  constructor(private readonly prisma: PrismaService) {}

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
    const discount = dto.discount ?? 0;
    const tax = dto.tax ?? 0;
    const total = subtotal - discount + tax;

    return this.prisma.bill.create({
      data: {
        patientId: dto.patientId,
        appointmentId: dto.appointmentId,
        invoiceNo: await generateInvoiceNo(this.prisma),
        subtotal,
        discount,
        tax,
        total,
        paymentMethod: dto.paymentMethod ?? 'CASH',
        notes: dto.notes,
        createdById: userId ?? null,
        items: { create: items },
      },
      include: { items: true, patient: true },
    });
  }

  async findAll(query: FindBillsQueryDto): Promise<PaginatedResult<Bill>> {
    const where: Record<string, unknown> = { deletedAt: null };
    if (query.patientId) where.patientId = query.patientId;
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
    return withDoctorName(this.prisma, bill);
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
}
