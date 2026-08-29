import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SearchQueryBuilder } from '../common/services/search-query-builder';
import { paginate } from '../common/utils/paginate';
import type { IBaseService, IPaginatable } from '../common/interfaces/base-service.interface';
import type { PaginatedResult } from '../common/interfaces/paginated-result.interface';
import type { Designation } from '@prisma/client';
import { CreateDesignationDto } from './dto/create-designation.dto';
import { UpdateDesignationDto } from './dto/update-designation.dto';
import { FindDesignationsQueryDto } from './dto/find-designations-query.dto';

@Injectable()
export class DesignationsService
  implements IBaseService<Designation, CreateDesignationDto, UpdateDesignationDto>, IPaginatable<Designation, FindDesignationsQueryDto>
{
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateDesignationDto, userId?: string) {
    const existing = await this.prisma.designation.findUnique({ where: { name: dto.name } });
    if (existing) throw new ConflictException(`Designation "${dto.name}" already exists`);
    return this.prisma.designation.create({ data: { ...dto, createdById: userId ?? null } });
  }

  async findAll(query: FindDesignationsQueryDto): Promise<PaginatedResult<Designation>> {
    const searchWhere = SearchQueryBuilder.search(query.search, ['name', 'description']);
    const where = {
      ...(searchWhere ?? {}),
      ...(query.isActive !== undefined ? { isActive: query.isActive === 'true' } : {}),
    };
    return paginate(
      () => this.prisma.designation.count({ where }),
      ({ skip, take }) =>
        this.prisma.designation.findMany({ where, orderBy: [{ createdAt: 'desc' }, { id: 'asc' }], skip, take }),
      query,
    );
  }

  async findOne(id: string) {
    const desig = await this.prisma.designation.findUnique({ where: { id } });
    if (!desig) throw new NotFoundException(`Designation ${id} not found`);
    return desig;
  }

  async update(id: string, dto: UpdateDesignationDto, userId?: string) {
    await this.findOne(id);
    if (dto.name) {
      const existing = await this.prisma.designation.findFirst({ where: { name: dto.name, NOT: { id } } });
      if (existing) throw new ConflictException(`Designation "${dto.name}" already exists`);
    }
    return this.prisma.designation.update({ where: { id }, data: { ...dto, updatedById: userId ?? null } });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.designation.delete({ where: { id } });
  }
}
