import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SlotGeneratorService } from '../common/services/slot-generator.service';
import { UpsertDoctorScheduleDto } from './dto/upsert-doctor-schedule.dto';

/**
 * Weekly recurring schedules for doctors.
 *
 * # SOLID
 * - **Single Responsibility** — only schedule CRUD (slot generation is delegated).
 * - **Dependency Inversion** — depends on `SlotGeneratorService` abstraction.
 */
@Injectable()
export class DoctorSchedulesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly slotGenerator: SlotGeneratorService,
  ) {}

  async upsert(dto: UpsertDoctorScheduleDto) {
    return this.prisma.doctorSchedule.upsert({
      where: {
        doctorId_dayOfWeek: { doctorId: dto.doctorId, dayOfWeek: dto.dayOfWeek },
      },
      update: {
        startTime: dto.startTime,
        endTime: dto.endTime,
        slotDuration: dto.slotDuration ?? 15,
        maxPatients: dto.maxPatients ?? 20,
      },
      create: {
        doctorId: dto.doctorId,
        dayOfWeek: dto.dayOfWeek,
        startTime: dto.startTime,
        endTime: dto.endTime,
        slotDuration: dto.slotDuration ?? 15,
        maxPatients: dto.maxPatients ?? 20,
      },
    });
  }

  async findAllForDoctor(doctorId: string) {
    return this.prisma.doctorSchedule.findMany({
      where: { doctorId },
      orderBy: { dayOfWeek: 'asc' },
    });
  }

  async remove(id: string) {
    const schedule = await this.prisma.doctorSchedule.findUnique({ where: { id } });
    if (!schedule) throw new NotFoundException(`Schedule ${id} not found`);
    return this.prisma.doctorSchedule.delete({ where: { id } });
  }

  /** Delegates slot generation to SlotGeneratorService. */
  async getSlots(doctorId: string, dateStr: string) {
    return this.slotGenerator.generateSlots(doctorId, dateStr);
  }
}
