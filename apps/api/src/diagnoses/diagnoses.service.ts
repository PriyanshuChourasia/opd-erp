import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SearchQueryBuilder } from '../common/services/search-query-builder';
import { paginate } from '../common/utils/paginate';
import type { IBaseService, IPaginatable } from '../common/interfaces/base-service.interface';
import type { PaginatedResult } from '../common/interfaces/paginated-result.interface';
import type { Diagnosis } from '@prisma/client';
import { CreateDiagnosisDto } from './dto/create-diagnosis.dto';
import { UpdateDiagnosisDto } from './dto/update-diagnosis.dto';
import { FindDiagnosesQueryDto } from './dto/find-diagnoses-query.dto';

@Injectable()
export class DiagnosesService
  implements IBaseService<Diagnosis, CreateDiagnosisDto, UpdateDiagnosisDto>, IPaginatable<Diagnosis, FindDiagnosesQueryDto>
{
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateDiagnosisDto) {
    const existing = await this.prisma.diagnosis.findUnique({ where: { name: dto.name } });
    if (existing) throw new ConflictException(`Diagnosis "${dto.name}" already exists`);
    return this.prisma.diagnosis.create({ data: dto });
  }

  async findAll(query: FindDiagnosesQueryDto): Promise<PaginatedResult<Diagnosis>> {
    const searchWhere = SearchQueryBuilder.search(query.search, ['name', 'icdCode', 'description']);
    const where = {
      ...(searchWhere ?? {}),
      ...(query.isActive !== undefined ? { isActive: query.isActive === 'true' } : {}),
    };
    return paginate(
      () => this.prisma.diagnosis.count({ where }),
      ({ skip, take }) =>
        this.prisma.diagnosis.findMany({
          where,
          orderBy: [{ name: 'asc' }, { id: 'asc' }],
          skip,
          take,
        }),
      query,
    );
  }

  async findOne(id: string) {
    const diagnosis = await this.prisma.diagnosis.findUnique({ where: { id } });
    if (!diagnosis) throw new NotFoundException(`Diagnosis ${id} not found`);
    return diagnosis;
  }

  async update(id: string, dto: UpdateDiagnosisDto) {
    await this.findOne(id);
    if (dto.name) {
      const existing = await this.prisma.diagnosis.findFirst({
        where: { name: dto.name, NOT: { id } },
      });
      if (existing) throw new ConflictException(`Diagnosis "${dto.name}" already exists`);
    }
    return this.prisma.diagnosis.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.diagnosis.delete({ where: { id } });
  }
}
