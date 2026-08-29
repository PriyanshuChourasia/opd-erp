// ═══════════════════════════════════════════════════════════════════════════════════
// ⚠️  DO NOT MODIFY THIS FILE WITHOUT EXPLICIT PERMISSION
// ═══════════════════════════════════════════════════════════════════════════════════
//
// This file contains critical schedule overlap validation logic.
// Any change can break appointment slot generation across the entire clinic.
//
// - This file is STRICTLY READ-ONLY for automated tools and LLMs.
// - Manual changes require explicit approval from the project owner.
// - If you believe a change is needed, explain the problem and get
//   confirmation before editing any logic.
//
// ═══════════════════════════════════════════════════════════════════════════════════

import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { paginate } from '../common/utils/paginate';
import type { IBaseService, IPaginatable } from '../common/interfaces/base-service.interface';
import type { PaginatedResult } from '../common/interfaces/paginated-result.interface';
import type { EmployeeSchedule } from '@prisma/client';
import { CreateEmployeeScheduleDto } from './dto/create-employee-schedule.dto';
import { UpdateEmployeeScheduleDto } from './dto/update-employee-schedule.dto';
import { FindEmployeeSchedulesQueryDto } from './dto/find-employee-schedules-query.dto';

/**
 * Generic employee scheduling — supports any employee type via polymorphic association.
 *
 * Prevents overlapping schedules for the same employee on the same day.
 *
 * # SOLID
 * - **Single Responsibility** — only employee schedule CRUD with overlap validation.
 * - **Dependency Inversion** — implements `IBaseService` & `IPaginatable` contracts.
 *
 * ⚠️ READ-ONLY — See header notice.
 */
@Injectable()
export class EmployeeSchedulesService
  implements
    IBaseService<EmployeeSchedule, CreateEmployeeScheduleDto, UpdateEmployeeScheduleDto>,
    IPaginatable<EmployeeSchedule, FindEmployeeSchedulesQueryDto>
{
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateEmployeeScheduleDto) {
    // Auto-upsert: if a schedule already exists for this employee on this day,
    // update it instead of creating a duplicate. This prevents "overlap" errors
    // when the frontend sends a CREATE for a day that already has a schedule
    // (e.g., after applying a template before schedules finish loading).
    const existing = await this.prisma.employeeSchedule.findFirst({
      where: {
        employeeSchedulableType: dto.employeeSchedulableType,
        employeeSchedulableId: dto.employeeSchedulableId,
        dayOfWeek: dto.dayOfWeek,
      },
    });

    if (existing) {
      // Update the existing schedule with new times/shift
      return this.prisma.employeeSchedule.update({
        where: { id: existing.id },
        data: {
          startTime: dto.startTime,
          endTime: dto.endTime,
          shiftId: dto.shiftId ?? null,
        },
      });
    }

    // No existing schedule — validate no overlap with OTHER schedules
    await this.validateNoOverlap(
      dto.employeeSchedulableType,
      dto.employeeSchedulableId,
      dto.dayOfWeek,
      dto.startTime,
      dto.endTime,
    );

    return this.prisma.employeeSchedule.create({ data: dto });
  }

  async findAll(query: FindEmployeeSchedulesQueryDto): Promise<PaginatedResult<EmployeeSchedule>> {
    const where: Record<string, unknown> = {};
    if (query.employeeSchedulableType) where.employeeSchedulableType = query.employeeSchedulableType;
    if (query.employeeSchedulableId) where.employeeSchedulableId = query.employeeSchedulableId;
    if (query.shiftId) where.shiftId = query.shiftId;
    if (query.dayOfWeek !== undefined) where.dayOfWeek = parseInt(query.dayOfWeek, 10);

    return paginate(
      () => this.prisma.employeeSchedule.count({ where }),
      ({ skip, take }) =>
        this.prisma.employeeSchedule.findMany({
          where,
          orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }, { id: 'asc' }],
          skip,
          take,
          include: { shift: true },
        }),
      query,
    );
  }

  /** Get all schedules for a given employee on a specific day of week. */
  async findByEmployee(employeeSchedulableType: string, employeeSchedulableId: string) {
    return this.prisma.employeeSchedule.findMany({
      where: { employeeSchedulableType, employeeSchedulableId },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
      include: { shift: true },
    });
  }

  async findOne(id: string) {
    const schedule = await this.prisma.employeeSchedule.findUnique({
      where: { id },
      include: { shift: true },
    });
    if (!schedule) throw new NotFoundException(`EmployeeSchedule ${id} not found`);
    return schedule;
  }

  async update(id: string, dto: UpdateEmployeeScheduleDto) {
    const existing = await this.findOne(id);

    await this.validateNoOverlap(
      dto.employeeSchedulableType ?? existing.employeeSchedulableType,
      dto.employeeSchedulableId ?? existing.employeeSchedulableId,
      dto.dayOfWeek ?? existing.dayOfWeek,
      dto.startTime ?? existing.startTime,
      dto.endTime ?? existing.endTime,
      id,
    );

    return this.prisma.employeeSchedule.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.employeeSchedule.delete({ where: { id } });
  }

  /**
   * Prevent overlapping schedules for the same employee on the same day.
   * Overlap = (startA < endB) AND (startB < endA)
   * Excludes the schedule being updated (if excludeId is provided).
   */
  private async validateNoOverlap(
    schedulableType: string,
    schedulableId: string,
    dayOfWeek: number,
    startTime?: string,
    endTime?: string,
    excludeId?: string,
  ) {
    if (!startTime || !endTime) return;

    const existing = await this.prisma.employeeSchedule.findFirst({
      where: {
        employeeSchedulableType: schedulableType,
        employeeSchedulableId: schedulableId,
        dayOfWeek,
        id: excludeId ? { not: excludeId } : undefined,
        // Overlap: existing.startTime < newEndTime AND existing.endTime > newStartTime
        startTime: { lt: endTime },
        endTime: { gt: startTime },
      },
    });

    if (existing) {
      throw new BadRequestException(
        `Schedule overlaps with existing schedule on day ${dayOfWeek} (${existing.startTime}–${existing.endTime})`,
      );
    }
  }
}
