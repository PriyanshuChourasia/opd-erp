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

  async create(dto: CreateShiftDto, userId?: string) {
    return this.prisma.shift.create({ data: { ...dto, createdById: userId ?? null } });
  }

  async findAll(query: FindShiftsQueryDto): Promise<PaginatedResult<Shift>> {
    const searchWhere = SearchQueryBuilder.search(query.search, ['name', 'code', 'description']);
    const where = {
      ...(searchWhere ?? {}),
      deletedAt: null,
      ...(query.isActive !== undefined ? { isActive: query.isActive === 'true' } : {}),
    };
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

  async findOne(id: string) {
    const shift = await this.prisma.shift.findUnique({ where: { id, deletedAt: null } });
    if (!shift) throw new NotFoundException(`Shift ${id} not found`);
    return shift;
  }

  async update(id: string, dto: UpdateShiftDto, userId?: string) {
    await this.findOne(id);
    return this.prisma.shift.update({ where: { id }, data: { ...dto, updatedById: userId ?? null } });
  }

  async remove(id: string, deletedById?: string) {
    await this.findOne(id);
    return this.prisma.shift.update({
      where: { id },
      data: { deletedAt: new Date(), deletedById: deletedById ?? null },
    });
  }
}
