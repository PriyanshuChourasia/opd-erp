import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { paginate } from '../common/utils/paginate';
import { getDoctorNameMap } from '../common/utils/doctor-names';
import type { IBaseService, IPaginatable } from '../common/interfaces/base-service.interface';
import type { PaginatedResult } from '../common/interfaces/paginated-result.interface';
import type { Appointment } from '@prisma/client';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentStatusDto } from './dto/update-appointment-status.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { FindAppointmentsQueryDto } from './dto/find-appointments-query.dto';
import { CheckoutAppointmentDto } from './dto/checkout-appointment.dto';
import { RescheduleAppointmentDto } from './dto/reschedule-appointment.dto';

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

    let registrationFee = dto.registrationFee;
    if (registrationFee === undefined) {
      const priorAppointmentCount = await this.prisma.appointment.count({ where: { patientId: dto.patientId } });
      const organisation = await this.prisma.organisation.findFirst();
      registrationFee = priorAppointmentCount === 0 ? (organisation?.registrationFee ?? 0) : 0;
    }

    // Booking alone does not queue the patient — they only enter the live
    // token queue once checked in (see `update`, on the CHECKED_IN transition).
    const appointment = await this.prisma.appointment.create({
      data: {
        patientId: dto.patientId,
        doctorId: dto.doctorId,
        createdById: createdById ?? null,
        date,
        type: dto.type ?? 'CONSULTATION',
        fee: dto.fee ?? 0,
        registrationFee,
        reasonForVisit: dto.reasonForVisit,
        notes: dto.notes,
        tokenNumber,
      },
      include: { patient: true, doctor: true, bill: { select: { id: true, invoiceNo: true, status: true } } },
    });

    return withDoctorName(this.prisma, appointment);
  }

  async findAll(query: FindAppointmentsQueryDto): Promise<PaginatedResult<Appointment>> {
    const where: Record<string, unknown> = {};
    if (query.doctorId) where.doctorId = query.doctorId;
    if (query.status) where.status = query.status;
    if (query.patientId) where.patientId = query.patientId;
    if (query.createdById) where.createdById = query.createdById;
    if (query.date) {
      const dayStart = new Date(Date.UTC(
        new Date(query.date).getUTCFullYear(),
        new Date(query.date).getUTCMonth(),
        new Date(query.date).getUTCDate(),
      ));
      const dayEnd = new Date(dayStart);
      dayEnd.setUTCDate(dayEnd.getUTCDate() + 1);
      where.date = { gte: dayStart, lt: dayEnd };
    }
    if (query.createdAtDate) {
      const dayStart = new Date(Date.UTC(
        new Date(query.createdAtDate).getUTCFullYear(),
        new Date(query.createdAtDate).getUTCMonth(),
        new Date(query.createdAtDate).getUTCDate(),
      ));
      const dayEnd = new Date(dayStart);
      dayEnd.setUTCDate(dayEnd.getUTCDate() + 1);
      where.createdAt = { gte: dayStart, lt: dayEnd };
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
          orderBy: [{ createdAt: 'desc' }, { date: 'desc' }],
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
    const existing = await this.findOne(id);
    const appointment = await this.prisma.appointment.update({
      where: { id },
      data: {
        status: dto.status,
        cancellationReason: dto.status === 'CANCELLED' ? (dto.cancellationReason ?? null) : undefined,
      },
      include: { patient: true, doctor: true, bill: { select: { id: true, invoiceNo: true, status: true } } },
    });

    // Checking in moves the patient into the live token queue. Idempotent —
    // a queue entry already linked to this appointment is left alone.
    if (dto.status === 'CHECKED_IN' && existing.status !== 'CHECKED_IN') {
      const alreadyQueued = await this.prisma.queueEntry.findUnique({ where: { appointmentId: id } });
      if (!alreadyQueued) {
        const checkedInAt = new Date();
        const tokenNumber = this.generateTokenNumber(checkedInAt, appointment.patient.name);
        await this.prisma.queueEntry.create({
          data: {
            patientId: appointment.patientId,
            doctorId: appointment.doctorId,
            tokenNumber,
            queueDate: checkedInAt,
            checkedInAt,
            status: 'WAITING',
            appointmentId: appointment.id,
          },
        });
      }
    }

    return withDoctorName(this.prisma, appointment);
  }

  /**
   * General-purpose update for appointment details (fee, type, notes, etc.).
   * Does NOT handle status transitions — use `update()` for that.
   */
  async updateDetails(id: string, dto: UpdateAppointmentDto) {
    await this.findOne(id);

    const data: Record<string, unknown> = {};
    if (dto.date !== undefined) data.date = new Date(dto.date);
    if (dto.doctorId !== undefined) data.doctorId = dto.doctorId;
    if (dto.type !== undefined) data.type = dto.type;
    if (dto.fee !== undefined) data.fee = dto.fee;
    if (dto.registrationFee !== undefined) data.registrationFee = dto.registrationFee;
    if (dto.reasonForVisit !== undefined) data.reasonForVisit = dto.reasonForVisit;
    if (dto.notes !== undefined) data.notes = dto.notes;

    const appointment = await this.prisma.appointment.update({
      where: { id },
      data,
      include: { patient: true, doctor: true, bill: { select: { id: true, invoiceNo: true, status: true } } },
    });
    return withDoctorName(this.prisma, appointment);
  }

  /**
   * Move an appointment to a new date/time (and optionally a new doctor),
   * leaving it in RESCHEDULED status rather than reverting to SCHEDULED —
   * this keeps the change visible in the appointment history/badge.
   */
  async reschedule(id: string, dto: RescheduleAppointmentDto) {
    const existing = await this.findOne(id);
    const date = new Date(dto.date);
    const doctorId = dto.doctorId ?? existing.doctorId;
    const tokenNumber = this.generateTokenNumber(date, existing.patient.name);

    const appointment = await this.prisma.appointment.update({
      where: { id },
      data: {
        date,
        doctorId,
        tokenNumber,
        status: 'RESCHEDULED',
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
        ...(appointment.registrationFee > 0
          ? [
              {
                itemType: 'REGISTRATION',
                itemId: appointment.id,
                itemName: `Registration Fee — ${appointment.patient.name}`,
                quantity: 1,
                unitPrice: appointment.registrationFee,
              },
            ]
          : []),
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
    const consultationAmount = appointment.fee;
    const registrationAmount = appointment.registrationFee;
    const subtotal = consultationAmount + registrationAmount;
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
              amount: consultationAmount,
            },
            ...(registrationAmount > 0
              ? [
                  {
                    itemType: 'REGISTRATION',
                    itemId: appointment.id,
                    itemName: `Registration Fee — ${appointment.patient.name}`,
                    quantity: 1,
                    unitPrice: appointment.registrationFee,
                    amount: registrationAmount,
                  },
                ]
              : []),
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
