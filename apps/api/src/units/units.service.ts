import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SearchQueryBuilder } from '../common/services/search-query-builder';
import { paginate } from '../common/utils/paginate';
import type { IBaseService, IPaginatable } from '../common/interfaces/base-service.interface';
import type { PaginatedResult } from '../common/interfaces/paginated-result.interface';
import type { Unit } from '@prisma/client';
import { CreateUnitDto } from './dto/create-unit.dto';
import { UpdateUnitDto } from './dto/update-unit.dto';
import { FindUnitsQueryDto } from './dto/find-units-query.dto';

@Injectable()
export class UnitsService
  implements IBaseService<Unit, CreateUnitDto, UpdateUnitDto>, IPaginatable<Unit, FindUnitsQueryDto>
{
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateUnitDto, userId?: string) {
    const existing = await this.prisma.unit.findUnique({ where: { name: dto.name } });
    if (existing) throw new ConflictException(`Unit "${dto.name}" already exists`);
    return this.prisma.unit.create({ data: { ...dto, createdById: userId ?? null } });
  }

  async findAll(query: FindUnitsQueryDto): Promise<PaginatedResult<Unit>> {
    const searchWhere = SearchQueryBuilder.search(query.search, ['name', 'symbol', 'description']);
    const where = {
      ...(searchWhere ?? {}),
      deletedAt: null,
      ...(query.isActive !== undefined ? { isActive: query.isActive === 'true' } : {}),
    };
    return paginate(
      () => this.prisma.unit.count({ where }),
      ({ skip, take }) =>
        this.prisma.unit.findMany({
          where,
          orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
          skip,
          take,
        }),
      query,
    );
  }

  async findOne(id: string) {
    const unit = await this.prisma.unit.findUnique({ where: { id, deletedAt: null } });
    if (!unit) throw new NotFoundException(`Unit ${id} not found`);
    return unit;
  }

  async update(id: string, dto: UpdateUnitDto, userId?: string) {
    await this.findOne(id);
    if (dto.name) {
      const existing = await this.prisma.unit.findFirst({
        where: { name: dto.name, NOT: { id } },
      });
      if (existing) throw new ConflictException(`Unit "${dto.name}" already exists`);
    }
    return this.prisma.unit.update({
      where: { id },
      data: { ...dto, updatedById: userId ?? null },
    });
  }

  async remove(id: string, deletedById?: string) {
    await this.findOne(id);
    const refCount = await this.prisma.medicine.count({ where: { unitId: id } });
    if (refCount > 0) {
      throw new ConflictException(
        `Cannot delete unit: ${refCount} medicine(s) reference it. Reassign or remove them first.`,
      );
    }
    return this.prisma.unit.update({
      where: { id },
      data: { deletedAt: new Date(), deletedById: deletedById ?? null },
    });
  }
}
