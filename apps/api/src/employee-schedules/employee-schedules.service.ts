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
 */
@Injectable()
export class EmployeeSchedulesService
  implements
    IBaseService<EmployeeSchedule, CreateEmployeeScheduleDto, UpdateEmployeeScheduleDto>,
    IPaginatable<EmployeeSchedule, FindEmployeeSchedulesQueryDto>
{
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateEmployeeScheduleDto) {
    await this.validateNoOverlap(dto.employeeSchedulableType, dto.employeeSchedulableId, dto.dayOfWeek, dto.startTime, dto.endTime);

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

    const where: Record<string, unknown> = {
      employeeSchedulableType: schedulableType,
      employeeSchedulableId: schedulableId,
      dayOfWeek,
    };
    if (excludeId) where.id = { not: excludeId };

    const existing = await this.prisma.employeeSchedule.findFirst({
      where: {
        ...where,
        // Overlap: existing.startTime < newEndTime AND existing.endTime > newStartTime
        startTime: { lt: endTime },
        endTime: { gt: startTime },
      } as any,
    });

    if (existing) {
      throw new BadRequestException(
        `Schedule overlaps with existing schedule on day ${dayOfWeek} (${existing.startTime}–${existing.endTime})`,
      );
    }
  }
}
