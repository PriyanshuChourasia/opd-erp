import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { IBaseService } from '../common/interfaces/base-service.interface';
import type { QueueEntry } from '@prisma/client';
import { CreateQueueEntryDto } from './dto/create-queue-entry.dto';
import { UpdateQueueStatusDto } from './dto/update-queue-status.dto';

/**
 * Live token queue with status tracking and check-in management.
 *
 * # SOLID
 * - **Single Responsibility** — only queue entry lifecycle.
 * - **Open/Closed** — new status transitions can be added without modifying core logic.
 */
@Injectable()
export class QueueService implements IBaseService<QueueEntry, CreateQueueEntryDto, UpdateQueueStatusDto> {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateQueueEntryDto) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lastEntry = await this.prisma.queueEntry.findFirst({
      where: { doctorId: dto.doctorId, queueDate: today },
      orderBy: { tokenNumber: 'desc' },
    });

    const tokenNumber = (lastEntry?.tokenNumber ?? 0) + 1;

    return this.prisma.queueEntry.create({
      data: {
        patientId: dto.patientId,
        doctorId: dto.doctorId,
        tokenNumber,
        queueDate: today,
        checkedInAt: new Date(),
        status: 'WAITING',
      },
      include: { patient: true, doctor: true },
    });
  }

  async findAll(doctorId?: string, date?: string) {
    const where: Record<string, unknown> = {};

    if (doctorId) where.doctorId = doctorId;
    if (date) {
      const d = new Date(date);
      d.setHours(0, 0, 0, 0);
      where.queueDate = d;
    }

    return this.prisma.queueEntry.findMany({
      where,
      include: { patient: true, doctor: true },
      orderBy: { tokenNumber: 'asc' },
    });
  }

  async findOne(id: string) {
    const entry = await this.prisma.queueEntry.findUnique({
      where: { id },
      include: { patient: true, doctor: true },
    });
    if (!entry) throw new NotFoundException(`Queue entry ${id} not found`);
    return entry;
  }

  async update(id: string, dto: UpdateQueueStatusDto) {
    await this.findOne(id);
    return this.prisma.queueEntry.update({
      where: { id },
      data: { status: dto.status },
      include: { patient: true, doctor: true },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.queueEntry.delete({ where: { id } });
  }
}
