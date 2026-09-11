import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SearchQueryBuilder } from '../common/services/search-query-builder';
import { paginate } from '../common/utils/paginate';
import type { IBaseService, IPaginatable } from '../common/interfaces/base-service.interface';
import type { PaginatedResult } from '../common/interfaces/paginated-result.interface';
import type { Shift } from '@prisma/client';
import { CreateShiftDto } from './dto/create-shift.dto';
import { UpdateShiftDto } from './dto/update-shift.dto';
import { FindShiftsQueryDto } from './dto/find-shifts-query.dto';

/**
 * Manages work shifts (Morning, Evening, Night, etc.) used in employee scheduling.
 *
 * # SOLID
 * - **Single Responsibility** — only shift CRUD.
 * - **Dependency Inversion** — implements `IBaseService` & `IPaginatable` contracts.
 */
@Injectable()
export class ShiftsService
  implements IBaseService<Shift, CreateShiftDto, UpdateShiftDto>, IPaginatable<Shift, FindShiftsQueryDto>
{
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateShiftDto, userId?: string, organizationId?: string) {
    return this.prisma.shift.create({ data: { ...dto, organizationId: organizationId ?? null, createdById: userId ?? null } });
  }

  async findAll(query: FindShiftsQueryDto, organizationId?: string): Promise<PaginatedResult<Shift>> {
    const searchWhere = SearchQueryBuilder.search(query.search, ['name', 'code', 'description']);
    const where: Record<string, unknown> = {
      ...(searchWhere ?? {}),
      deletedAt: null,
      ...(query.isActive !== undefined ? { isActive: query.isActive === 'true' } : {}),
    };
    if (organizationId) where.OR = [{ organizationId }, { organizationId: null }]; // own org + shared global defaults
    return paginate(
      () => this.prisma.shift.count({ where }),
      ({ skip, take }) =>
        this.prisma.shift.findMany({
          where,
          orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
          skip,
          take,
        }),
      query,
    );
  }

  async findOne(id: string, organizationId?: string) {
    const shift = await this.prisma.shift.findFirst({
      where: organizationId
        ? { id, deletedAt: null, OR: [{ organizationId }, { organizationId: null }] }
        : { id, deletedAt: null },
    });
    if (!shift) throw new NotFoundException(`Shift ${id} not found`);
    return shift;
  }

  async update(id: string, dto: UpdateShiftDto, userId?: string, organizationId?: string) {
    await this.findOne(id, organizationId);
    const result = await this.prisma.shift.updateMany({
      where: organizationId ? { id, organizationId } : { id },
      data: { ...dto, updatedById: userId ?? null },
    });
    if (result.count === 0) throw new NotFoundException(`Shift ${id} not found`);
    return this.findOne(id, organizationId);
  }

  async remove(id: string, deletedById?: string, organizationId?: string) {
    await this.findOne(id, organizationId);
    const result = await this.prisma.shift.updateMany({
      where: organizationId ? { id, organizationId } : { id },
      data: { deletedAt: new Date(), deletedById: deletedById ?? null },
    });
    if (result.count === 0) throw new NotFoundException(`Shift ${id} not found`);
    return this.findOne(id, organizationId);
  }
}
