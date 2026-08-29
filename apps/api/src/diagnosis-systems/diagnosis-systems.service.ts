import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SearchQueryBuilder } from '../common/services/search-query-builder';
import { paginate } from '../common/utils/paginate';
import type { PaginatedResult } from '../common/interfaces/paginated-result.interface';
import type { DiagnosisSystem } from '@prisma/client';
import { CreateDiagnosisSystemDto } from './dto/create-diagnosis-system.dto';
import { UpdateDiagnosisSystemDto } from './dto/update-diagnosis-system.dto';
import { FindDiagnosisSystemsQueryDto } from './dto/find-diagnosis-systems-query.dto';

@Injectable()
export class DiagnosisSystemsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateDiagnosisSystemDto, userId?: string) {
    const existing = await this.prisma.diagnosisSystem.findUnique({ where: { code: dto.code } });
    if (existing) throw new ConflictException(`Diagnosis system with code "${dto.code}" already exists`);
    return this.prisma.diagnosisSystem.create({
      data: { ...dto, createdById: userId ?? null },
    });
  }

  async findAll(query: FindDiagnosisSystemsQueryDto): Promise<PaginatedResult<DiagnosisSystem>> {
    const searchWhere = SearchQueryBuilder.search(query.search, ['name', 'code']);
    const where = { ...(searchWhere ?? {}) };
    return paginate(
      () => this.prisma.diagnosisSystem.count({ where }),
      ({ skip, take }) =>
        this.prisma.diagnosisSystem.findMany({
          where,
          orderBy: [{ name: 'asc' }, { id: 'asc' }],
          skip,
          take,
        }),
      query,
    );
  }

  async findOne(id: string) {
    const system = await this.prisma.diagnosisSystem.findUnique({
      where: { id },
      include: { diagnoses: true },
    });
    if (!system) throw new NotFoundException(`Diagnosis system ${id} not found`);
    return system;
  }

  async update(id: string, dto: UpdateDiagnosisSystemDto, userId?: string) {
    await this.findOne(id);
    if (dto.code) {
      const existing = await this.prisma.diagnosisSystem.findFirst({
        where: { code: dto.code, NOT: { id } },
      });
      if (existing) throw new ConflictException(`Diagnosis system with code "${dto.code}" already exists`);
    }
    return this.prisma.diagnosisSystem.update({
      where: { id },
      data: { ...dto, updatedById: userId ?? null },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.diagnosisSystem.delete({ where: { id } });
  }
}
