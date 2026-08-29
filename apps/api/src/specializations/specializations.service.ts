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

  async create(dto: CreateSpecializationDto, userId?: string) {
    const existing = await this.prisma.specialization.findUnique({ where: { name: dto.name } });
    if (existing) throw new ConflictException(`Specialization "${dto.name}" already exists`);
    return this.prisma.specialization.create({ data: { ...dto, createdById: userId ?? null } });
  }

  async findAll(query: FindSpecializationsQueryDto): Promise<PaginatedResult<Specialization>> {
    const searchWhere = SearchQueryBuilder.search(query.search, ['name', 'description']);
    const where = {
      ...(searchWhere ?? {}),
      ...(query.isActive !== undefined ? { isActive: query.isActive === 'true' } : {}),
    };
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

  async findOne(id: string) {
    const specialization = await this.prisma.specialization.findUnique({ where: { id } });
    if (!specialization) throw new NotFoundException(`Specialization ${id} not found`);
    return specialization;
  }

  async update(id: string, dto: UpdateSpecializationDto, userId?: string) {
    await this.findOne(id);
    if (dto.name) {
      const existing = await this.prisma.specialization.findFirst({
        where: { name: dto.name, NOT: { id } },
      });
      if (existing) throw new ConflictException(`Specialization "${dto.name}" already exists`);
    }
    return this.prisma.specialization.update({
      where: { id },
      data: { ...dto, updatedById: userId ?? null },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.specialization.delete({ where: { id } });
  }
}
