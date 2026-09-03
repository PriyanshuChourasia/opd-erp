import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { paginate } from '../common/utils/paginate';
import type { IBaseService, IPaginatable } from '../common/interfaces/base-service.interface';
import type { PaginatedResult } from '../common/interfaces/paginated-result.interface';
import type { EmployeeScheduleException, EmployeeScheduleExceptionType } from '@prisma/client';
import { CreateEmployeeScheduleExceptionDto } from './dto/create-employee-schedule-exception.dto';
import { UpdateEmployeeScheduleExceptionDto } from './dto/update-employee-schedule-exception.dto';
import { FindEmployeeScheduleExceptionsQueryDto } from './dto/find-employee-schedule-exceptions-query.dto';

/** DayOfWeek (0=Monday..6=Sunday) of a local date — mirrors slot-generator. */
function localDayOfWeek(date: Date): number {
  return (date.getDay() + 6) % 7;
}

/** Normalize a calendar date string to LOCAL midnight (same convention as the slot generator). */
function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function overlaps(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
  // Overlap = (startA < endB) AND (startB < endA); "HH:mm" compares lexicographically.
  return aStart < bEnd && bStart < aEnd;
}

/**
 * One-off / date-specific schedule exceptions (extra shift, override, day off).
 *
 * Unlike EmployeeSchedule (recurring by dayOfWeek), each row applies to exactly
 * one calendar date and never mutates the recurring weekly rows. Multiple rows
 * may exist for the same (employee, date) — e.g. two EXTRA_SHIFT rows, or a
 * recurring weekly morning + an EXTRA_SHIFT evening layered on one date.
 *
 * Write-time validation keeps one date unambiguous:
 * - DAY_OFF must be the ONLY row for that date.
 * - OVERRIDE and EXTRA_SHIFT must not be mixed on the same date.
 * - Multiple OVERRIDE rows must not overlap each other; same for EXTRA_SHIFT.
 * - EXTRA_SHIFT windows must not overlap the employee's recurring weekly
 *   windows for that date's day-of-week (otherwise the slot generator would
 *   emit duplicate same-minute slots from two windows).
 *
 * # SOLID
 * - Single Responsibility — only date-specific exception CRUD + validation.
 * - Dependency Inversion — implements IBaseService & IPaginatable contracts.
 */
@Injectable()
export class EmployeeScheduleExceptionsService
  implements
    IBaseService<
      EmployeeScheduleException,
      CreateEmployeeScheduleExceptionDto,
      UpdateEmployeeScheduleExceptionDto
    >,
    IPaginatable<EmployeeScheduleException, FindEmployeeScheduleExceptionsQueryDto>
{
  constructor(private readonly prisma: PrismaService) {}

  private toLocalDate(dateStr: string): Date {
    return startOfDay(new Date(dateStr));
  }

  private async assertNoConflicts(
    employeeSchedulableType: string,
    employeeSchedulableId: string,
    date: Date,
    type: EmployeeScheduleExceptionType,
    startTime: string,
    endTime: string,
    excludeId?: string,
  ) {
    const otherRows = await this.prisma.employeeScheduleException.findMany({
      where: {
        employeeSchedulableType,
        employeeSchedulableId,
        date,
        deletedAt: null,
        id: excludeId ? { not: excludeId } : undefined,
      },
    });

    // DAY_OFF must be alone on its date
    if (type === 'DAY_OFF') {
      if (otherRows.length > 0) {
        throw new BadRequestException(
          `A DAY_OFF exception cannot be combined with other exceptions on ${date.toISOString().slice(0, 10)}`,
        );
      }
      return;
    }

    // DAY_OFF already occupies this date
    if (otherRows.some((r) => r.type === 'DAY_OFF')) {
      throw new BadRequestException(
        `Cannot add a schedule exception — a DAY_OFF already exists for ${date.toISOString().slice(0, 10)}`,
      );
    }

    // OVERRIDE and EXTRA_SHIFT are contradictory on the same date
    const conflictingMode = type === 'OVERRIDE' ? 'EXTRA_SHIFT' : 'OVERRIDE';
    if (otherRows.some((r) => r.type === conflictingMode)) {
      throw new BadRequestException(
        `Cannot mix ${type} with ${conflictingMode} exceptions on the same date`,
      );
    }

    // Same-mode rows must be pairwise non-overlapping
    const overlapping = otherRows.find(
      (r) => r.type === type && overlaps(startTime, endTime, r.startTime, r.endTime),
    );
    if (overlapping) {
      throw new BadRequestException(
        `Schedule exception overlaps another ${type} on the same date (${overlapping.startTime}–${overlapping.endTime})`,
      );
    }

    // An extra shift layered on the recurring week must not overlap that weekday's hours
    if (type === 'EXTRA_SHIFT') {
      const dayOfWeek = localDayOfWeek(date);
      const recurring = await this.prisma.employeeSchedule.findFirst({
        where: {
          employeeSchedulableType,
          employeeSchedulableId,
          dayOfWeek,
          deletedAt: null,
          startTime: { lt: endTime },
          endTime: { gt: startTime },
        },
      });
      if (recurring) {
        throw new BadRequestException(
          `EXTRA_SHIFT overlaps the recurring schedule on that weekday (${recurring.startTime}–${recurring.endTime}) — use OVERRIDE if you intend to replace the day`,
        );
      }
    }
  }

  async create(dto: CreateEmployeeScheduleExceptionDto, userId?: string) {
    const date = this.toLocalDate(dto.date);

    await this.assertNoConflicts(
      dto.employeeSchedulableType,
      dto.employeeSchedulableId,
      date,
      dto.type,
      dto.startTime,
      dto.endTime,
    );

    return this.prisma.employeeScheduleException.create({
      data: {
        date,
        type: dto.type,
        startTime: dto.startTime,
        endTime: dto.endTime,
        shiftId: dto.shiftId ?? null,
        employeeSchedulableType: dto.employeeSchedulableType,
        employeeSchedulableId: dto.employeeSchedulableId,
        createdById: userId ?? null,
      },
      include: { shift: true },
    });
  }

  async findAll(query: FindEmployeeScheduleExceptionsQueryDto): Promise<PaginatedResult<EmployeeScheduleException>> {
    const where: Record<string, unknown> = { deletedAt: null };

    if (query.employeeSchedulableType) where.employeeSchedulableType = query.employeeSchedulableType;
    if (query.employeeSchedulableId) where.employeeSchedulableId = query.employeeSchedulableId;
    if (query.type) where.type = query.type;

    if (query.from || query.to) {
      const dateFilter: Record<string, Date> = {};
      if (query.from) dateFilter.gte = this.toLocalDate(query.from);
      if (query.to) dateFilter.lte = this.toLocalDate(query.to);
      where.date = dateFilter;
    }

    return paginate(
      () => this.prisma.employeeScheduleException.count({ where }),
      ({ skip, take }) =>
        this.prisma.employeeScheduleException.findMany({
          where,
          orderBy: [{ date: 'asc' }, { startTime: 'asc' }, { id: 'asc' }],
          skip,
          take,
          include: { shift: true },
        }),
      query,
    );
  }

  async findOne(id: string) {
    const exception = await this.prisma.employeeScheduleException.findUnique({
      where: { id, deletedAt: null },
      include: { shift: true },
    });
    if (!exception) throw new NotFoundException(`EmployeeScheduleException ${id} not found`);
    return exception;
  }

  async update(id: string, dto: UpdateEmployeeScheduleExceptionDto, userId?: string) {
    const existing = await this.findOne(id);

    const date = dto.date ? this.toLocalDate(dto.date) : existing.date;
    const type = dto.type ?? existing.type;
    const startTime = dto.startTime ?? existing.startTime;
    const endTime = dto.endTime ?? existing.endTime;

    await this.assertNoConflicts(
      dto.employeeSchedulableType ?? existing.employeeSchedulableType,
      dto.employeeSchedulableId ?? existing.employeeSchedulableId,
      date,
      type,
      startTime,
      endTime,
      id,
    );

    return this.prisma.employeeScheduleException.update({
      where: { id },
      data: {
        ...(dto.date ? { date } : {}),
        ...(dto.type ? { type } : {}),
        ...(dto.startTime ? { startTime } : {}),
        ...(dto.endTime ? { endTime } : {}),
        ...(dto.shiftId !== undefined ? { shiftId: dto.shiftId ?? null } : {}),
        ...(dto.employeeSchedulableType ? { employeeSchedulableType: dto.employeeSchedulableType } : {}),
        ...(dto.employeeSchedulableId ? { employeeSchedulableId: dto.employeeSchedulableId } : {}),
        updatedById: userId ?? null,
      },
      include: { shift: true },
    });
  }

  async remove(id: string, deletedById?: string) {
    await this.findOne(id);
    return this.prisma.employeeScheduleException.update({
      where: { id },
      data: { deletedAt: new Date(), deletedById: deletedById ?? null },
    });
  }
}
