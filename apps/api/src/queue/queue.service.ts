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
    if (query.date) {
      const d = new Date(query.date);
      d.setHours(0, 0, 0, 0);
      where.queueDate = d;
    }

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
          orderBy: [{ tokenNumber: 'asc' }, { id: 'asc' }],
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

    // Sort: today's entries first, then by token number
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    data.sort((a, b) => {
      const aIsToday = a.queueDate >= today && a.queueDate < tomorrow;
      const bIsToday = b.queueDate >= today && b.queueDate < tomorrow;
      if (aIsToday && !bIsToday) return -1;
      if (!aIsToday && bIsToday) return 1;
      return 0; // preserve original order within same day
    });

    return { ...result, data };
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
