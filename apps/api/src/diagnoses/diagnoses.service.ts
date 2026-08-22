import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SearchQueryBuilder } from '../common/services/search-query-builder';
import { paginate } from '../common/utils/paginate';
import type { PaginatedResult } from '../common/interfaces/paginated-result.interface';
import type { Diagnosis } from '@prisma/client';
import { CreateDiagnosisDto } from './dto/create-diagnosis.dto';
import { UpdateDiagnosisDto } from './dto/update-diagnosis.dto';
import { FindDiagnosesQueryDto } from './dto/find-diagnoses-query.dto';

@Injectable()
export class DiagnosesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateDiagnosisDto, userId?: string) {
    return this.prisma.diagnosis.create({ data: { ...dto, createdById: userId ?? null } });
  }

  async findAll(query: FindDiagnosesQueryDto): Promise<PaginatedResult<Diagnosis>> {
    const searchWhere = SearchQueryBuilder.search(query.search, ['name', 'code', 'description']);
    const where = {
      ...(searchWhere ?? {}),
      ...(query.diagnosisSystemId ? { diagnosisSystemId: query.diagnosisSystemId } : {}),
      ...(query.status ? { status: query.status } : {}),
    };
    return paginate(
      () => this.prisma.diagnosis.count({ where }),
      ({ skip, take }) =>
        this.prisma.diagnosis.findMany({
          where,
          include: { diagnosisSystem: true },
          orderBy: [{ name: 'asc' }, { id: 'asc' }],
          skip,
          take,
        }),
      query,
    );
  }

  async findOne(id: string) {
    const diagnosis = await this.prisma.diagnosis.findUnique({ where: { id }, include: { diagnosisSystem: true } });
    if (!diagnosis) throw new NotFoundException(`Diagnosis ${id} not found`);
    return diagnosis;
  }

  async update(id: string, dto: UpdateDiagnosisDto, userId?: string) {
    await this.findOne(id);
    return this.prisma.diagnosis.update({ where: { id }, data: { ...dto, updatedById: userId ?? null } });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.diagnosis.delete({ where: { id } });
  }
}
