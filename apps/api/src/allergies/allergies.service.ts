import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SearchQueryBuilder } from '../common/services/search-query-builder';
import { paginate } from '../common/utils/paginate';
import type { IBaseService, IPaginatable } from '../common/interfaces/base-service.interface';
import type { PaginatedResult } from '../common/interfaces/paginated-result.interface';
import type { Allergy } from '@prisma/client';
import { CreateAllergyDto } from './dto/create-allergy.dto';
import { UpdateAllergyDto } from './dto/update-allergy.dto';
import { FindAllergiesQueryDto } from './dto/find-allergies-query.dto';

@Injectable()
export class AllergiesService
  implements IBaseService<Allergy, CreateAllergyDto, UpdateAllergyDto>, IPaginatable<Allergy, FindAllergiesQueryDto>
{
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateAllergyDto) {
    const existing = await this.prisma.allergy.findUnique({ where: { name: dto.name } });
    if (existing) throw new ConflictException(`Allergy "${dto.name}" already exists`);
    return this.prisma.allergy.create({ data: dto });
  }

  async findAll(query: FindAllergiesQueryDto): Promise<PaginatedResult<Allergy>> {
    const searchWhere = SearchQueryBuilder.search(query.search, ['name', 'description']);
    const where = {
      ...(searchWhere ?? {}),
      ...(query.isActive !== undefined ? { isActive: query.isActive === 'true' } : {}),
      ...(query.severity ? { severity: query.severity } : {}),
      ...(query.category ? { category: query.category } : {}),
    };
    return paginate(
      () => this.prisma.allergy.count({ where }),
      ({ skip, take }) =>
        this.prisma.allergy.findMany({
          where,
          orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
          skip,
          take,
        }),
      query,
    );
  }

  async findOne(id: string) {
    const allergy = await this.prisma.allergy.findUnique({ where: { id } });
    if (!allergy) throw new NotFoundException(`Allergy ${id} not found`);
    return allergy;
  }

  async update(id: string, dto: UpdateAllergyDto) {
    await this.findOne(id);
    if (dto.name) {
      const existing = await this.prisma.allergy.findFirst({
        where: { name: dto.name, NOT: { id } },
      });
      if (existing) throw new ConflictException(`Allergy "${dto.name}" already exists`);
    }
    return this.prisma.allergy.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.allergy.delete({ where: { id } });
  }
}
