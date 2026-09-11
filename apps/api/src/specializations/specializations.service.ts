import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SearchQueryBuilder } from '../common/services/search-query-builder';
import { paginate } from '../common/utils/paginate';
import type { IBaseService, IPaginatable } from '../common/interfaces/base-service.interface';
import type { PaginatedResult } from '../common/interfaces/paginated-result.interface';
import type { Specialization } from '@prisma/client';
import { CreateSpecializationDto } from './dto/create-specialization.dto';
import { UpdateSpecializationDto } from './dto/update-specialization.dto';
import { FindSpecializationsQueryDto } from './dto/find-specializations-query.dto';

@Injectable()
export class SpecializationsService
  implements
    IBaseService<Specialization, CreateSpecializationDto, UpdateSpecializationDto>,
    IPaginatable<Specialization, FindSpecializationsQueryDto>
{
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateSpecializationDto, userId?: string, organizationId?: string) {
    const existing = await this.prisma.specialization.findUnique({ where: { name: dto.name } });
    if (existing) throw new ConflictException(`Specialization "${dto.name}" already exists`);
    return this.prisma.specialization.create({ data: { ...dto, organizationId: organizationId ?? null, createdById: userId ?? null } });
  }

  async findAll(query: FindSpecializationsQueryDto, organizationId?: string): Promise<PaginatedResult<Specialization>> {
    const searchWhere = SearchQueryBuilder.search(query.search, ['name', 'description']);
    const where: Record<string, unknown> = {
      ...(searchWhere ?? {}),
      deletedAt: null,
      ...(query.isActive !== undefined ? { isActive: query.isActive === 'true' } : {}),
    };
    if (organizationId) where.OR = [{ organizationId }, { organizationId: null }]; // own org + shared global defaults
    return paginate(
      () => this.prisma.specialization.count({ where }),
      ({ skip, take }) =>
        this.prisma.specialization.findMany({
          where,
          orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
          skip,
          take,
        }),
      query,
    );
  }

  async findOne(id: string, organizationId?: string) {
    const specialization = await this.prisma.specialization.findFirst({
      where: organizationId
        ? { id, deletedAt: null, OR: [{ organizationId }, { organizationId: null }] }
        : { id, deletedAt: null },
    });
    if (!specialization) throw new NotFoundException(`Specialization ${id} not found`);
    return specialization;
  }

  async update(id: string, dto: UpdateSpecializationDto, userId?: string, organizationId?: string) {
    await this.findOne(id, organizationId);
    if (dto.name) {
      const existing = await this.prisma.specialization.findFirst({
        where: { name: dto.name, NOT: { id } },
      });
      if (existing) throw new ConflictException(`Specialization "${dto.name}" already exists`);
    }
    const result = await this.prisma.specialization.updateMany({
      where: organizationId ? { id, organizationId } : { id },
      data: { ...dto, updatedById: userId ?? null },
    });
    if (result.count === 0) throw new NotFoundException(`Specialization ${id} not found`);
    return this.findOne(id, organizationId);
  }

  async remove(id: string, deletedById?: string, organizationId?: string) {
    await this.findOne(id, organizationId);
    const result = await this.prisma.specialization.updateMany({
      where: organizationId ? { id, organizationId } : { id },
      data: { deletedAt: new Date(), deletedById: deletedById ?? null },
    });
    if (result.count === 0) throw new NotFoundException(`Specialization ${id} not found`);
    return this.findOne(id, organizationId);
  }
}
