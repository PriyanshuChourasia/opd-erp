import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { paginate } from '../common/utils/paginate';
import { getDoctorNameMap } from '../common/utils/doctor-names';
import type { IBaseService, IPaginatable } from '../common/interfaces/base-service.interface';
import type { PaginatedResult } from '../common/interfaces/paginated-result.interface';
import type { QueueEntry } from '@prisma/client';
import { CreateQueueEntryDto } from './dto/create-queue-entry.dto';
import { UpdateQueueStatusDto } from './dto/update-queue-status.dto';
import { FindQueueQueryDto } from './dto/find-queue-query.dto';

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

  private readonly billSelect = { select: { id: true, invoiceNo: true, status: true } };

  async create(dto: CreateQueueEntryDto) {
    const today = new Date();
    const checkedInAt = new Date();

    const [patient, doctor] = await Promise.all([
      this.prisma.patient.findUnique({ where: { id: dto.patientId } }),
      this.prisma.doctor.findUnique({ where: { id: dto.doctorId } }),
    ]);
    const tokenNumber = this.generateTokenNumber(today, patient?.name ?? 'PTNT');

    // Pair the queue entry with a lightweight walk-in appointment so it can
    // be invoiced through the same checkout flow as scheduled appointments.
    return this.prisma.$transaction(async (tx) => {
      const appointment = await tx.appointment.create({
        data: {
          patientId: dto.patientId,
          doctorId: dto.doctorId,
          date: checkedInAt,
          type: 'WALK_IN',
          fee: doctor?.consultationFee ?? 0,
          tokenNumber,
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
        },
        include: { patient: true, doctor: true, appointment: { select: { id: true, fee: true, bill: this.billSelect } } },
      });
    });
  }

  async findAll(query: FindQueueQueryDto): Promise<PaginatedResult<QueueEntry>> {
    const where: Record<string, unknown> = {};

    if (query.doctorId) where.doctorId = query.doctorId;

    // Default to today's queue when no date is given — without this, entries
    // are unbounded across all history and new ones can be paginated out of view.
    // Use UTC-based boundaries so that the exclusive lt does not accidentally
    // exclude entries created at midnight in a non-UTC timezone.
    const now = query.date ? new Date(query.date) : new Date();
    const dayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const dayEnd = new Date(dayStart);
    dayEnd.setUTCDate(dayEnd.getUTCDate() + 1);
    where.queueDate = { gte: dayStart, lt: dayEnd };

    const result = await paginate(
      () => this.prisma.queueEntry.count({ where }),
      ({ skip, take }) =>
        this.prisma.queueEntry.findMany({
          where,
          include: {
            patient: true,
            doctor: true,
            appointment: { select: { id: true, fee: true, date: true, bill: this.billSelect } },
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
      include: { patient: true, doctor: true, appointment: { select: { id: true, fee: true, bill: this.billSelect } } },
    });
    if (!entry) throw new NotFoundException(`Queue entry ${id} not found`);
    return entry;
  }

  async update(id: string, dto: UpdateQueueStatusDto) {
    await this.findOne(id);
    return this.prisma.queueEntry.update({
      where: { id },
      data: { status: dto.status },
      include: { patient: true, doctor: true, appointment: { select: { id: true, fee: true, bill: this.billSelect } } },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.queueEntry.delete({ where: { id } });
  }
}
