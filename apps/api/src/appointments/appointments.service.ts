import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { paginate } from '../common/utils/paginate';
import { getDoctorNameMap } from '../common/utils/doctor-names';
import { resolveDiscount } from '../common/utils/discount';
import { applyDateRange, applyCreatedAtRange } from '../common/dto/date-range-query.dto';
import type { IBaseService, IPaginatable } from '../common/interfaces/base-service.interface';
import type { PaginatedResult } from '../common/interfaces/paginated-result.interface';
import type { Appointment } from '@prisma/client';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentStatusDto } from './dto/update-appointment-status.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { FindAppointmentsQueryDto } from './dto/find-appointments-query.dto';
import { CheckoutAppointmentDto } from './dto/checkout-appointment.dto';
import { RescheduleAppointmentDto } from './dto/reschedule-appointment.dto';
import { CreatePaymentDto } from '../billing/dto/create-payment.dto';

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
    const patientName = patient ? `${patient.firstName} ${patient.lastName}` : 'PTNT';
    const tokenNumber = this.generateTokenNumber(date, patientName);

    let registrationFee = dto.registrationFee;
    if (registrationFee === undefined) {
      const priorAppointmentCount = await this.prisma.appointment.count({ where: { patientId: dto.patientId } });
      const company = await this.prisma.company.findFirst();
      registrationFee = priorAppointmentCount === 0 ? (company?.registrationFee ?? 0) : 0;
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
        amount: dto.amount ?? 0,
        registrationFee,
        amountPaid: dto.amountPaid ?? 0,
        reasonForVisit: dto.reasonForVisit,
        notes: dto.notes,
        tokenNumber,
      },
      include: { patient: true, doctor: true, bill: { select: { id: true, invoiceNo: true, status: true, total: true } } },
    });

    // Save version 1 history entry (mirroring PrescriptionHistory pattern)
    await this.prisma.appointmentHistory.create({
      data: {
        appointmentId: appointment.id,
        version: 1,
        previousData: {
          patientId: appointment.patientId,
          doctorId: appointment.doctorId,
          date: appointment.date,
          type: appointment.type,
          status: appointment.status,
          amount: appointment.amount,
          registrationFee: appointment.registrationFee,
          amountPaid: appointment.amountPaid,
          reasonForVisit: appointment.reasonForVisit,
          notes: appointment.notes,
        },
        changeType: 'CREATE',
        createdById: createdById ?? null,
      },
    });

    return withDoctorName(this.prisma, appointment);
  }

  async findAll(query: FindAppointmentsQueryDto): Promise<PaginatedResult<Appointment>> {
    const where: Record<string, unknown> = {};
    if (query.doctorId) where.doctorId = query.doctorId;
    if (query.status) where.status = query.status;
    if (query.patientId) where.patientId = query.patientId;
    if (query.createdById) where.createdById = query.createdById;
    // Date range: from/to takes priority; fallback to single-day `date`
    if (query.from || query.to) {
      applyDateRange(where, query, 'date');
    } else if (query.date) {
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
        { patient: { firstName: { contains: search, mode: 'insensitive' } } },
        { patient: { lastName: { contains: search, mode: 'insensitive' } } },
        { patient: { contactNo: { contains: search } } },
        { tokenNumber: { contains: search, mode: 'insensitive' } },
      ];
    }

    where.deletedAt = null;

    const result = await paginate(
      () => this.prisma.appointment.count({ where }),
      ({ skip, take }) =>
        this.prisma.appointment.findMany({
          where,
          include: {
            patient: true,
            doctor: true,
            bill: { select: { id: true, invoiceNo: true, status: true, total: true } },
            queueEntry: { select: { tokenNumber: true } },
          },
          orderBy: [{ createdAt: 'desc' }, { date: 'desc' }],
          skip,
          take,
        }),
      query,
    );
    // Flatten queueEntry.tokenNumber onto the appointment for frontend convenience
    const data = result.data.map((a) => {
      const { queueEntry: _qe, ...rest } = a as any;
      return { ...rest, tokenNumber: rest.tokenNumber ?? _qe?.tokenNumber ?? null };
    });
    return { ...result, data: await withDoctorNames(this.prisma, data) };
  }

  async findOne(id: string) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id, deletedAt: null },
      include: {
        patient: true,
        doctor: true,
        bill: { select: { id: true, invoiceNo: true, status: true, total: true } },
        queueEntry: { select: { tokenNumber: true } },
      },
    });
    if (!appointment) throw new NotFoundException(`Appointment ${id} not found`);
    const { queueEntry: qe, ...rest } = appointment as any;
    const flat = { ...rest, tokenNumber: rest.tokenNumber ?? qe?.tokenNumber ?? null };
    return withDoctorName(this.prisma, flat);
  }

  async update(id: string, dto: UpdateAppointmentStatusDto, userId?: string) {
    const existing = await this.findOne(id);

    // ── Refund gate: CANCELLED / NO_SHOW when money was collected ──
    if (dto.status === 'CANCELLED' || dto.status === 'NO_SHOW') {
      // Check if any money was collected (advance payments or invoiced & paid)
      const paySum = await this.prisma.payment.aggregate({
        where: { appointmentId: id, direction: 'PAYMENT' },
        _sum: { amount: true },
      });
      const refundSum = await this.prisma.payment.aggregate({
        where: { appointmentId: id, direction: 'REFUND' },
        _sum: { amount: true },
      });
      const netPaid = (paySum._sum.amount ?? 0) - (refundSum._sum.amount ?? 0);

      if (netPaid > 0) {
        // Money was collected — require an explicit refund decision
        if (!dto.refundDecision) {
          throw new BadRequestException(
            `Cannot ${dto.status.toLowerCase()} appointment — ₹${netPaid} has been collected. ` +
            `Provide refundDecision: "REFUND" (with refundAmount + refundReason) or ` +
            `"FORFEIT" (with refundReason).`,
          );
        }

        if (dto.refundDecision === 'REFUND') {
          if (!dto.refundAmount || dto.refundAmount < 1) {
            throw new BadRequestException('refundAmount is required and must be >= 1 for REFUND decision.');
          }
          if (dto.refundAmount > netPaid) {
            throw new BadRequestException(
              `Refund amount ₹${dto.refundAmount} exceeds net paid amount ₹${netPaid}.`,
            );
          }
          if (!dto.refundReason) {
            throw new BadRequestException('refundReason is required for REFUND decision.');
          }
        }

        if (dto.refundDecision === 'FORFEIT' && !dto.refundReason) {
          throw new BadRequestException('refundReason is required for FORFEIT decision.');
        }
      }
    }

    // ── Execute the status transition + optional refund in a transaction ──
    const appointment = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.appointment.update({
        where: { id },
        data: {
          status: dto.status,
          cancellationReason: dto.status === 'CANCELLED' ? (dto.cancellationReason ?? null) : undefined,
          updatedById: userId ?? null,
        },
        include: { patient: true, doctor: true, bill: { select: { id: true, invoiceNo: true, status: true, total: true } } },
      });

      // Process refund if requested
      if ((dto.status === 'CANCELLED' || dto.status === 'NO_SHOW') && dto.refundDecision === 'REFUND' && dto.refundAmount && dto.refundReason) {
        // Determine the bill to refund against (if any)
        const bill = updated.bill;
        if (bill) {
          // Refund against the bill
          await tx.payment.create({
            data: {
              billId: bill.id,
              appointmentId: id,
              patientId: updated.patientId,
              amount: dto.refundAmount,
              method: 'CASH',
              direction: 'REFUND',
              notes: `${dto.status} refund: ${dto.refundReason}`,
              collectedById: userId ?? null,
            },
          });
          // Recompute bill status
          const billPaySum = await tx.payment.aggregate({
            where: { billId: bill.id, direction: 'PAYMENT' },
            _sum: { amount: true },
          });
          const billRefundSum = await tx.payment.aggregate({
            where: { billId: bill.id, direction: 'REFUND' },
            _sum: { amount: true },
          });
          const billNetPaid = (billPaySum._sum.amount ?? 0) - (billRefundSum._sum.amount ?? 0);
          const newBillStatus = billNetPaid <= 0 ? 'REFUNDED' : billNetPaid < bill.total ? 'PARTIALLY_PAID' : 'PAID';
          await tx.bill.update({
            where: { id: bill.id },
            data: { paidAmount: billNetPaid, status: newBillStatus },
          });
        } else {
          // Refund against the appointment (advance only, no bill yet)
          await tx.payment.create({
            data: {
              appointmentId: id,
              patientId: updated.patientId,
              amount: dto.refundAmount,
              method: 'CASH',
              direction: 'REFUND',
              notes: `${dto.status} refund: ${dto.refundReason}`,
              collectedById: userId ?? null,
            },
          });
        }

        // Sync appointment.amountPaid
        const apptPaySum = await tx.payment.aggregate({
          where: { appointmentId: id, direction: 'PAYMENT' },
          _sum: { amount: true },
        });
        const apptRefundSum = await tx.payment.aggregate({
          where: { appointmentId: id, direction: 'REFUND' },
          _sum: { amount: true },
        });
        const apptNetPaid = (apptPaySum._sum.amount ?? 0) - (apptRefundSum._sum.amount ?? 0);
        await tx.appointment.update({
          where: { id },
          data: { amountPaid: apptNetPaid },
        });
      } else if ((dto.status === 'CANCELLED' || dto.status === 'NO_SHOW') && dto.refundDecision === 'FORFEIT' && dto.refundReason) {
        // Forfeit: no money moves, but record a note
        await tx.payment.create({
          data: {
            appointmentId: id,
            patientId: updated.patientId,
            amount: 0,
            method: 'CASH',
            direction: 'REFUND',
            notes: `FORFEITED on ${dto.status.toLowerCase()}: ${dto.refundReason}`,
            collectedById: userId ?? null,
          },
        });
      }

      return updated;
    });

    // Checking in moves the patient into the live token queue. Idempotent —
    // a queue entry already linked to this appointment is left alone.
    if (dto.status === 'CHECKED_IN' && existing.status !== 'CHECKED_IN') {
      const alreadyQueued = await this.prisma.queueEntry.findUnique({ where: { appointmentId: id } });
      if (!alreadyQueued) {
        const checkedInAt = new Date();
        const patientName = `${appointment.patient.firstName} ${appointment.patient.lastName}`;
        const tokenNumber = this.generateTokenNumber(checkedInAt, patientName);
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
   * If the doctor changes and a linked queue entry is still WAITING,
   * the queue entry is reassigned to the new doctor as well.
   */
  async updateDetails(id: string, dto: UpdateAppointmentDto, userId?: string) {
    const existing = await this.findOne(id);

    // Calculate next version for history
    const lastHistory = await this.prisma.appointmentHistory.findFirst({
      where: { appointmentId: id },
      orderBy: { version: 'desc' },
    });
    const nextVersion = (lastHistory?.version ?? 0) + 1;

    // Snapshot current state before applying changes
    const previousData = {
      patientId: existing.patientId,
      doctorId: existing.doctorId,
      date: existing.date,
      type: existing.type,
      status: existing.status,
      amount: existing.amount,
      registrationFee: existing.registrationFee,
      amountPaid: existing.amountPaid,
      reasonForVisit: existing.reasonForVisit,
      notes: existing.notes,
    };

    const data: Record<string, unknown> = {};
    if (dto.date !== undefined) data.date = new Date(dto.date);
    if (dto.doctorId !== undefined) data.doctorId = dto.doctorId;
    if (dto.type !== undefined) data.type = dto.type;
    if (dto.amount !== undefined) data.amount = dto.amount;
    if (dto.registrationFee !== undefined) data.registrationFee = dto.registrationFee;
    if (dto.amountPaid !== undefined) data.amountPaid = dto.amountPaid;
    if (dto.reasonForVisit !== undefined) data.reasonForVisit = dto.reasonForVisit;
    if (dto.notes !== undefined) data.notes = dto.notes;
    data.updatedById = userId ?? null;

    // Guard: don't let fee edits drop the total below what's already been paid.
    // Staff must record a refund first before lowering fees.
    const newAmount = (data.amount as number | undefined) ?? existing.amount;
    const newRegFee = (data.registrationFee as number | undefined) ?? existing.registrationFee;
    const newTotal = newAmount + newRegFee;
    const paidSum = await this.prisma.payment.aggregate({
      where: { appointmentId: id, direction: 'PAYMENT' },
      _sum: { amount: true },
    });
    const refundSum = await this.prisma.payment.aggregate({
      where: { appointmentId: id, direction: 'REFUND' },
      _sum: { amount: true },
    });
    const netPaid = (paidSum._sum.amount ?? 0) - (refundSum._sum.amount ?? 0);
    if (newTotal < netPaid) {
      throw new BadRequestException(
        `Cannot reduce total to ₹${newTotal} — ₹${netPaid} has already been collected. ` +
        `Record a refund first before lowering fees.`,
      );
    }

    // If doctor changed, also reassign the linked queue entry regardless of status.
    // The mismatch between appointment and queue doctors is worse than updating
    // an in-progress entry.
    if (dto.doctorId && dto.doctorId !== existing.doctorId) {
      let queueEntry = await this.prisma.queueEntry.findUnique({ where: { appointmentId: id } });
      // Fallback: the queue entry may have been created via walk-in flow and linked to
      // a separate walk-in appointment. Find today's entry for this patient.
      if (!queueEntry) {
        const now = new Date();
        const dayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
        const dayEnd = new Date(dayStart);
        dayEnd.setUTCDate(dayEnd.getUTCDate() + 1);
        queueEntry = await this.prisma.queueEntry.findFirst({
          where: {
            patientId: existing.patientId,
            queueDate: { gte: dayStart, lt: dayEnd },
          },
        });
      }
      if (queueEntry) {
        await this.prisma.queueEntry.update({
          where: { id: queueEntry.id },
          data: { doctorId: dto.doctorId },
        });
      }
    }

    // Use a transaction to atomically save history and update appointment
    await this.prisma.$transaction(async (tx) => {
      // 1. Save history entry with previous state
      await tx.appointmentHistory.create({
        data: {
          appointmentId: id,
          version: nextVersion,
          previousData,
          changeType: 'UPDATE',
          createdById: userId ?? null,
        },
      });

      // 2. Update appointment
      await tx.appointment.update({ where: { id }, data });
    });

    return this.findOne(id);
  }

  /**
   * Move an appointment to a new date/time (and optionally a new doctor),
   * leaving it in RESCHEDULED status rather than reverting to SCHEDULED —
   * this keeps the change visible in the appointment history/badge.
   */
  async reschedule(id: string, dto: RescheduleAppointmentDto, userId?: string) {
    const existing = await this.findOne(id);
    const date = new Date(dto.date);
    const doctorId = dto.doctorId ?? existing.doctorId;
    const patientName = `${existing.patient.firstName} ${existing.patient.lastName}`;
    const tokenNumber = this.generateTokenNumber(date, patientName);

    // Calculate next version for history
    const lastHistory = await this.prisma.appointmentHistory.findFirst({
      where: { appointmentId: id },
      orderBy: { version: 'desc' },
    });
    const nextVersion = (lastHistory?.version ?? 0) + 1;

    // Snapshot current state before reschedule
    const previousData = {
      patientId: existing.patientId,
      doctorId: existing.doctorId,
      date: existing.date,
      type: existing.type,
      status: existing.status,
      amount: existing.amount,
      registrationFee: existing.registrationFee,
      amountPaid: existing.amountPaid,
      reasonForVisit: existing.reasonForVisit,
      notes: existing.notes,
    };

    // If the doctor changed during reschedule, also reassign any linked
    // queue entry regardless of status so the patient appears under the
    // correct doctor on the waiting room display.
    if (doctorId !== existing.doctorId) {
      let queueEntry = await this.prisma.queueEntry.findUnique({ where: { appointmentId: id } });
      // Fallback: the queue entry may have been created via walk-in flow and linked to
      // a separate walk-in appointment. Find today's entry for this patient.
      if (!queueEntry) {
        const now = new Date();
        const dayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
        const dayEnd = new Date(dayStart);
        dayEnd.setUTCDate(dayEnd.getUTCDate() + 1);
        queueEntry = await this.prisma.queueEntry.findFirst({
          where: {
            patientId: existing.patientId,
            queueDate: { gte: dayStart, lt: dayEnd },
          },
        });
      }
      if (queueEntry) {
        await this.prisma.queueEntry.update({
          where: { id: queueEntry.id },
          data: { doctorId },
        });
      }
    }

    // Use a transaction to atomically save history and update appointment
    await this.prisma.$transaction(async (tx) => {
      // 1. Save history entry with previous state
      await tx.appointmentHistory.create({
        data: {
          appointmentId: id,
          version: nextVersion,
          previousData,
          changeType: 'UPDATE',
          createdById: userId ?? null,
        },
      });

      // 2. Update appointment
      await tx.appointment.update({
        where: { id },
        data: {
          date,
          doctorId,
          tokenNumber,
          status: 'RESCHEDULED',
          updatedById: userId ?? null,
        },
      });
    });

    return this.findOne(id);
  }

  async findHistory(appointmentId: string) {
    // Verify appointment exists
    await this.findOne(appointmentId);
    return this.prisma.appointmentHistory.findMany({
      where: { appointmentId },
      orderBy: { version: 'desc' },
      include: { createdBy: { select: { id: true, firstName: true, lastName: true } } },
    });
  }

  async remove(id: string, deletedById?: string) {
    await this.findOne(id);
    return this.prisma.appointment.update({
      where: { id },
      data: { deletedAt: new Date(), deletedById: deletedById ?? null },
    });
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
          itemName: `${appointment.type.replace('_', ' ')} — ${appointment.patient.firstName} ${appointment.patient.lastName}`,
          quantity: 1,
          unitPrice: appointment.amount,
        },
        ...(appointment.registrationFee > 0
          ? [
              {
                itemType: 'REGISTRATION',
                itemId: appointment.id,
                itemName: `Registration Fee — ${appointment.patient.firstName} ${appointment.patient.lastName}`,
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
    const consultationAmount = appointment.amount;
    const registrationAmount = appointment.registrationFee;
    const subtotal = consultationAmount + registrationAmount;
    const { discount, discountRuleId } = await resolveDiscount(this.prisma, dto.discountRuleId, subtotal);
    const tax = dto.tax ?? 0;
    const total = subtotal - discount + tax;

    // Seed paidAmount from the actual ledger sum, not a guess.
    const advanceSum = await this.prisma.payment.aggregate({
      where: { appointmentId: id, direction: 'PAYMENT' },
      _sum: { amount: true },
    });
    const advancePaid = advanceSum._sum.amount ?? 0;
    // Caller can override (e.g. paying in full at checkout); otherwise use ledger.
    const paidAmount = dto.paidAmount ?? Math.min(advancePaid, total);
    const status = paidAmount >= total ? 'PAID' : 'PARTIALLY_PAID';

    return this.prisma.$transaction(async (tx) => {
      // 1. Create the bill
      const bill = await tx.bill.create({
        data: {
          patientId: appointment.patientId,
          appointmentId: appointment.id,
          invoiceNo,
          subtotal,
          discount,
          discountRuleId,
          tax,
          total,
          paidAmount,
          status,
          paymentMethod: dto.paymentMethod ?? 'CASH',
          referenceNumber: dto.referenceNumber ?? null,
          notes: dto.notes,
          createdById: appointment.createdById,
          items: {
            create: [
              {
                itemType: 'CONSULTATION',
                itemId: appointment.id,
                itemName: `${appointment.type.replace('_', ' ')} — ${appointment.patient.firstName} ${appointment.patient.lastName}`,
                quantity: 1,
                unitPrice: appointment.amount,
                amount: consultationAmount,
              },
              ...(registrationAmount > 0
                ? [
                    {
                      itemType: 'REGISTRATION',
                      itemId: appointment.id,
                      itemName: `Registration Fee — ${appointment.patient.firstName} ${appointment.patient.lastName}`,
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

      // 2. If paidAmount > 0, write a ledger row linking the advance to this bill
      if (paidAmount > 0) {
        await tx.payment.create({
          data: {
            billId: bill.id,
            appointmentId: appointment.id,
            patientId: appointment.patientId,
            amount: paidAmount,
            method: dto.paymentMethod ?? 'CASH',
            direction: 'PAYMENT',
            referenceNumber: dto.referenceNumber ?? null,
            notes: dto.notes ?? `Invoice ${invoiceNo}`,
            collectedById: appointment.createdById,
          },
        });
      }

      return bill;
    });
  }

  private async generateInvoiceNo(): Promise<string> {
    const date = new Date();
    const y = date.getFullYear().toString().slice(-2);
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const count = await this.prisma.bill.count();
    return `INV-${y}${m}-${(count + 1).toString().padStart(5, '0')}`;
  }

  // ─── Payment Ledger ──────────────────────────────────────────

  /**
   * Record an advance payment against an appointment (pre-invoice).
   * Writes a ledger row and syncs Appointment.amountPaid.
   */
  async addPayment(appointmentId: string, dto: CreatePaymentDto, userId?: string) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId, deletedAt: null },
      include: { bill: true },
    });
    if (!appointment) throw new NotFoundException(`Appointment ${appointmentId} not found`);

    // If a bill already exists, route to the billing payment endpoint instead
    if (appointment.bill) {
      throw new ConflictException(
        `Appointment ${appointmentId} is already invoiced (${appointment.bill.invoiceNo}). ` +
        `Use POST /billing/${appointment.bill.id}/payments to record installments.`,
      );
    }

    const payment = await this.prisma.$transaction(async (tx) => {
      // 1. Write the ledger row
      const row = await tx.payment.create({
        data: {
          appointmentId,
          patientId: appointment.patientId,
          amount: dto.amount,
          method: dto.method,
          direction: 'PAYMENT',
          referenceNumber: dto.referenceNumber ?? null,
          notes: dto.notes ?? null,
          collectedById: userId ?? null,
        },
      });

      // 2. Recompute amountPaid from ledger sum (PAYMENT rows only)
      const sum = await tx.payment.aggregate({
        where: { appointmentId, direction: 'PAYMENT' },
        _sum: { amount: true },
      });
      const totalPaid = sum._sum.amount ?? 0;

      await tx.appointment.update({
        where: { id: appointmentId },
        data: { amountPaid: totalPaid, updatedById: userId ?? null },
      });

      return row;
    });

    return payment;
  }

  /**
   * List all payment/refund ledger rows for an appointment.
   */
  async getPayments(appointmentId: string) {
    await this.findOne(appointmentId);
    return this.prisma.payment.findMany({
      where: { appointmentId },
      orderBy: { createdAt: 'asc' },
      include: {
        collectedBy: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }
}
