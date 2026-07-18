import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { paginate } from '../common/utils/paginate';
import { getDoctorNameMap } from '../common/utils/doctor-names';
import type { IBaseService, IPaginatable } from '../common/interfaces/base-service.interface';
import type { PaginatedResult } from '../common/interfaces/paginated-result.interface';
import type { Appointment } from '@prisma/client';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentStatusDto } from './dto/update-appointment-status.dto';
import { FindAppointmentsQueryDto } from './dto/find-appointments-query.dto';
import { CheckoutAppointmentDto } from './dto/checkout-appointment.dto';

interface WithDoctor {
  doctor: { id: string } & Record<string, unknown>;
}

/** Attaches the doctor's display name (resolved off `User`) onto one appointment. */
async function withDoctorName<T extends WithDoctor>(prisma: PrismaService, appointment: T): Promise<T> {
  const nameMap = await getDoctorNameMap(prisma, [appointment.doctor.id]);
  return { ...appointment, doctor: { ...appointment.doctor, name: nameMap.get(appointment.doctor.id) ?? null } };
}

/** Attaches the doctor's display name onto a list of appointments, batching the lookup. */
async function withDoctorNames<T extends WithDoctor>(prisma: PrismaService, appointments: T[]): Promise<T[]> {
  const nameMap = await getDoctorNameMap(prisma, appointments.map((a) => a.doctor.id));
  return appointments.map((a) => ({ ...a, doctor: { ...a.doctor, name: nameMap.get(a.doctor.id) ?? null } }));
}

/**
 * Appointment booking, scheduling, status tracking, and calendar management.
 *
 * # SOLID
 * - **Single Responsibility** — only appointment lifecycle.
 * - **Dependency Inversion** — implements `IBaseService` & `IPaginatable` contracts.
 */
@Injectable()
export class AppointmentsService
  implements
    IBaseService<Appointment, CreateAppointmentDto, UpdateAppointmentStatusDto>,
    IPaginatable<Appointment, FindAppointmentsQueryDto>
{
  constructor(private readonly prisma: PrismaService) {}

  private generateTokenNumber(date: Date, patientName: string): string {
    const y = date.getFullYear().toString();
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const d = date.getDate().toString().padStart(2, '0');
    const h = date.getHours().toString().padStart(2, '0');
    const min = date.getMinutes().toString().padStart(2, '0');
    const nameInitials = patientName
      .split(' ')
      .map((p) => p.charAt(0).toUpperCase())
      .join('')
      .slice(0, 4);
    return `${y}${m}${d}-${nameInitials}-${h}${min}`;
  }

  async create(dto: CreateAppointmentDto, createdById?: string) {
    const date = new Date(dto.date);

    const patient = await this.prisma.patient.findUnique({ where: { id: dto.patientId } });
    const tokenNumber = this.generateTokenNumber(date, patient?.name ?? 'PTNT');

    // Use a transaction to create both the appointment and a queue entry atomically
    const result = await this.prisma.$transaction(async (tx) => {
      const appointment = await tx.appointment.create({
        data: {
          patientId: dto.patientId,
          doctorId: dto.doctorId,
          createdById: createdById ?? null,
          date,
          type: dto.type ?? 'CONSULTATION',
          fee: dto.fee ?? 0,
          notes: dto.notes,
          tokenNumber,
        },
        include: { patient: true, doctor: true, bill: { select: { id: true, invoiceNo: true, status: true } } },
      });

      // Automatically add the patient to the queue for the appointment's date
      const queueDate = new Date(date);
      queueDate.setHours(0, 0, 0, 0);
      const checkedInAt = new Date();
      await tx.queueEntry.create({
        data: {
          patientId: dto.patientId,
          doctorId: dto.doctorId,
          tokenNumber,
          queueDate,
          checkedInAt,
          status: 'WAITING',
          appointmentId: appointment.id,
        },
      });

      return appointment;
    });

    return withDoctorName(this.prisma, result);
  }

  async findAll(query: FindAppointmentsQueryDto): Promise<PaginatedResult<Appointment>> {
    const where: Record<string, unknown> = {};
    if (query.doctorId) where.doctorId = query.doctorId;
    if (query.status) where.status = query.status;
    if (query.patientId) where.patientId = query.patientId;
    if (query.createdById) where.createdById = query.createdById;
    if (query.date) {
      const dayStart = new Date(query.date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);
      where.date = { gte: dayStart, lt: dayEnd };
    }
    if (query.search) {
      const search = query.search.trim();
      where.OR = [
        { patient: { name: { contains: search, mode: 'insensitive' } } },
        { patient: { phone: { contains: search } } },
        { tokenNumber: { contains: search, mode: 'insensitive' } },
      ];
    }

    const result = await paginate(
      () => this.prisma.appointment.count({ where }),
      ({ skip, take }) =>
        this.prisma.appointment.findMany({
          where,
          include: { patient: true, doctor: true, bill: { select: { id: true, invoiceNo: true, status: true } } },
          orderBy: [{ date: 'asc' }, { id: 'asc' }],
          skip,
          take,
        }),
      query,
    );
    return { ...result, data: await withDoctorNames(this.prisma, result.data) };
  }

  async findOne(id: string) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id },
      include: { patient: true, doctor: true, bill: { select: { id: true, invoiceNo: true, status: true } } },
    });
    if (!appointment) throw new NotFoundException(`Appointment ${id} not found`);
    return withDoctorName(this.prisma, appointment);
  }

  async update(id: string, dto: UpdateAppointmentStatusDto) {
    await this.findOne(id);
    const appointment = await this.prisma.appointment.update({
      where: { id },
      data: {
        status: dto.status,
        cancellationReason: dto.status === 'CANCELLED' ? (dto.cancellationReason ?? null) : undefined,
      },
      include: { patient: true, doctor: true, bill: { select: { id: true, invoiceNo: true, status: true } } },
    });
    return withDoctorName(this.prisma, appointment);
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.appointment.delete({ where: { id } });
  }

  /**
   * Draft invoice for checkout: the consultation fee as a pre-filled line
   * item, plus whether this appointment has already been billed.
   */
  async invoicePreview(id: string) {
    const appointment = await this.findOne(id);
    return {
      appointment,
      alreadyInvoiced: !!appointment.bill,
      items: [
        {
          itemType: 'CONSULTATION',
          itemId: appointment.id,
          itemName: `${appointment.type.replace('_', ' ')} — ${appointment.patient.name}`,
          quantity: 1,
          unitPrice: appointment.fee,
        },
      ],
    };
  }

  /**
   * One-click checkout: creates a bill directly from the appointment's
   * consultation fee without going through the POS flow.
   */
  async checkout(id: string, dto: CheckoutAppointmentDto) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id },
      include: { patient: true, bill: true },
    });
    if (!appointment) throw new NotFoundException(`Appointment ${id} not found`);
    if (appointment.bill) throw new ConflictException(`Appointment ${id} is already invoiced (${appointment.bill.invoiceNo})`);

    const invoiceNo = await this.generateInvoiceNo();
    const unitPrice = appointment.fee;
    const quantity = 1;
    const amount = unitPrice * quantity;
    const subtotal = amount;
    const discount = dto.discount ?? 0;
    const tax = dto.tax ?? 0;
    const total = subtotal - discount + tax;

    return this.prisma.bill.create({
      data: {
        patientId: appointment.patientId,
        appointmentId: appointment.id,
        invoiceNo,
        subtotal,
        discount,
        tax,
        total,
        paymentMethod: dto.paymentMethod ?? 'CASH',
        notes: dto.notes,
        items: {
          create: [
            {
              itemType: 'CONSULTATION',
              itemId: appointment.id,
              itemName: `${appointment.type.replace('_', ' ')} — ${appointment.patient.name}`,
              quantity: 1,
              unitPrice: appointment.fee,
              amount,
            },
          ],
        },
      },
      include: { items: true, patient: true },
    });
  }

  private async generateInvoiceNo(): Promise<string> {
    const date = new Date();
    const y = date.getFullYear().toString().slice(-2);
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const count = await this.prisma.bill.count();
    return `INV-${y}${m}-${(count + 1).toString().padStart(5, '0')}`;
  }
}
