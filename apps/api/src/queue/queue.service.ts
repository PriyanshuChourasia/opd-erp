import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TokenNumberService } from '../common/services/token-number.service';
import { paginate } from '../common/utils/paginate';
import { getDoctorNameMap } from '../common/utils/doctor-names';
import type { IBaseService, IPaginatable } from '../common/interfaces/base-service.interface';
import type { PaginatedResult } from '../common/interfaces/paginated-result.interface';
import type { QueueEntry } from '@prisma/client';
import { CreateQueueEntryDto } from './dto/create-queue-entry.dto';
import { UpdateQueueStatusDto } from './dto/update-queue-status.dto';
import { FindQueueQueryDto } from './dto/find-queue-query.dto';
import { applyDateRange } from '../common/dto/date-range-query.dto';
import { AppointmentsService } from '../appointments/appointments.service';

/**
 * Live token queue with status tracking and check-in management.
 *
 * # SOLID
 * - **Single Responsibility** — only queue entry lifecycle.
 * - **Open/Closed** — new status transitions can be added without modifying core logic.
 * - **Dependency Inversion** — implements `IBaseService` & `IPaginatable` contracts.
 */
@Injectable()
export class QueueService
  implements IBaseService<QueueEntry, CreateQueueEntryDto, UpdateQueueStatusDto>, IPaginatable<QueueEntry, FindQueueQueryDto>
{
  constructor(
    private readonly prisma: PrismaService,
    private readonly tokenNumberService: TokenNumberService,
    private readonly appointmentsService: AppointmentsService,
  ) {}

  private readonly billSelect = { select: { id: true, invoiceNo: true, status: true } };

  async create(dto: CreateQueueEntryDto, userId?: string) {
    const today = new Date();
    const checkedInAt = new Date();

    const [patient, doctor] = await Promise.all([
      this.prisma.patient.findUnique({ where: { id: dto.patientId } }),
      this.prisma.doctor.findUnique({ where: { id: dto.doctorId } }),
    ]);
    const patientName = patient ? `${patient.firstName} ${patient.lastName}` : 'PTNT';
    const tokenNumber = await this.tokenNumberService.generateTokenNumber(patientName, today);

    // Pair the queue entry with a lightweight walk-in appointment so it can
    // be invoiced through the same checkout flow as scheduled appointments.
    return this.prisma.$transaction(async (tx) => {
      const appointment = await tx.appointment.create({
        data: {
          patientId: dto.patientId,
          doctorId: dto.doctorId,
          date: checkedInAt,
          type: 'WALK_IN',
          amount: doctor?.consultationFee ?? 0,
          tokenNumber,
          createdById: userId ?? null,
        },
      });

      return tx.queueEntry.create({
        data: {
          patientId: dto.patientId,
          doctorId: dto.doctorId,
          tokenNumber,
          queueDate: today,
          checkedInAt,
          status: 'WAITING',
          appointmentId: appointment.id,
          createdById: userId ?? null,
        },
        include: { patient: true, doctor: true, appointment: { select: { id: true, amount: true, bill: this.billSelect } } },
      });
    });
  }

  async findAll(query: FindQueueQueryDto): Promise<PaginatedResult<QueueEntry>> {
    const where: Record<string, unknown> = {};

    if (query.doctorId) where.doctorId = query.doctorId;

    // Date range: from/to takes priority; fallback to single-day `date`;
    // fallback to today when nothing is given.
    if (query.from || query.to) {
      applyDateRange(where, query, 'queueDate');
    } else {
      const now = query.date ? new Date(query.date) : new Date();
      const dayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
      const dayEnd = new Date(dayStart);
      dayEnd.setUTCDate(dayEnd.getUTCDate() + 1);
      where.queueDate = { gte: dayStart, lt: dayEnd };
    }

    const result = await paginate(
      () => this.prisma.queueEntry.count({ where }),
      ({ skip, take }) =>
        this.prisma.queueEntry.findMany({
          where,
          include: {
            patient: true,
            doctor: true,
            appointment: { select: { id: true, amount: true, date: true, bill: this.billSelect } },
          },
          // Order by the appointment's actual scheduled time, not the token string —
          // tokenNumber embeds patient initials before the time, so lexical sort
          // (e.g. "AR-1200" vs "RG-0900") does not reflect who should be seen first.
          orderBy: [{ appointment: { date: 'asc' } }, { checkedInAt: 'asc' }, { id: 'asc' }],
          skip,
          take,
        }),
      query,
    );

    // Resolve doctor names from linked User accounts
    const doctorIds = result.data.map((e) => e.doctorId);
    const nameMap = await getDoctorNameMap(this.prisma, doctorIds);

    const data = result.data.map((entry) => ({
      ...entry,
      doctor: { ...entry.doctor, name: nameMap.get(entry.doctorId) ?? null },
    }));

    return { ...result, data };
  }

  /**
   * Minimal feed for a public waiting-room display: token, status, and doctor
   * name only — never patient name/phone, since this is unauthenticated.
   */
  async findDisplay() {
    const now = new Date();
    const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const tomorrow = new Date(today);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

    const entries = await this.prisma.queueEntry.findMany({
      where: { queueDate: { gte: today, lt: tomorrow } },
      select: { tokenNumber: true, status: true, doctorId: true },
      orderBy: [{ appointment: { date: 'asc' } }, { checkedInAt: 'asc' }, { id: 'asc' }],
    });

    const doctorIds = [...new Set(entries.map((e) => e.doctorId))];
    const nameMap = await getDoctorNameMap(this.prisma, doctorIds);

    return entries.map((e) => ({
      tokenNumber: e.tokenNumber,
      status: e.status,
      doctorName: nameMap.get(e.doctorId) ?? 'Doctor',
    }));
  }

  async findOne(id: string) {
    const entry = await this.prisma.queueEntry.findUnique({
      where: { id },
      include: { patient: true, doctor: true, appointment: { select: { id: true, amount: true, bill: this.billSelect } } },
    });
    if (!entry) throw new NotFoundException(`Queue entry ${id} not found`);
    return entry;
  }

  async update(id: string, dto: UpdateQueueStatusDto, userId?: string) {
    const existing = await this.findOne(id);

    await this.prisma.queueEntry.update({
      where: { id },
      data: { status: dto.status, updatedById: userId ?? null },
    });

    // Keep the linked appointment's status in sync with the queue: starting a
    // consultation or completing it must also move Appointment.status, since
    // the appointments table reads that directly. Other queue statuses
    // (WAITING, SKIPPED, NO_SHOW) have no clean 1:1 meaning on the appointment
    // side, so they are deliberately not forwarded.
    if (existing.appointmentId && (dto.status === 'IN_PROGRESS' || dto.status === 'COMPLETED')) {
      await this.appointmentsService.update(existing.appointmentId, { status: dto.status }, userId);
    }

    return this.findOne(id);
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.queueEntry.delete({ where: { id } });
  }
}
