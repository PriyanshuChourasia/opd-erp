import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SearchQueryBuilder } from '../common/services/search-query-builder';
import { paginate } from '../common/utils/paginate';
import type { IBaseService, IPaginatable } from '../common/interfaces/base-service.interface';
import type { PaginatedResult } from '../common/interfaces/paginated-result.interface';
import type { FinancialYear } from '@prisma/client';
import { CreateFinancialYearDto } from './dto/create-financial-year.dto';
import { UpdateFinancialYearDto } from './dto/update-financial-year.dto';
import { FindFinancialYearsQueryDto } from './dto/find-financial-years-query.dto';

@Injectable()
export class FinancialYearsService
  implements IBaseService<FinancialYear, CreateFinancialYearDto, UpdateFinancialYearDto>, IPaginatable<FinancialYear, FindFinancialYearsQueryDto>
{
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Resolve companyId: if provided, use it; otherwise default to the single Company record.
   * In a single-instance system today, there should be only one Company.
   */
  private async resolveCompanyId(providedCompanyId?: string): Promise<string | null> {
    if (providedCompanyId) return providedCompanyId;

    // Default to the single existing Company record
    const company = await this.prisma.company.findFirst();
    return company?.id ?? null;
  }

  async create(dto: CreateFinancialYearDto, userId?: string) {
    const existing = await this.prisma.financialYear.findUnique({ where: { name: dto.name } });
    if (existing) throw new ConflictException(`Financial year "${dto.name}" already exists`);

    const companyId = await this.resolveCompanyId(dto.companyId);

    return this.prisma.$transaction(async (tx) => {
      if (dto.isCurrent) {
        await tx.financialYear.updateMany({ where: { isCurrent: true }, data: { isCurrent: false } });
      }
      return tx.financialYear.create({
        data: {
          name: dto.name,
          startDate: dto.startDate,
          endDate: dto.endDate,
          isCurrent: dto.isCurrent ?? false,
          isActive: dto.isActive ?? true,
          companyId,
          createdById: userId ?? null,
        },
      });
    });
  }

  async findAll(query: FindFinancialYearsQueryDto): Promise<PaginatedResult<FinancialYear>> {
    const searchWhere = SearchQueryBuilder.search(query.search, ['name']);

    // Resolve companyId filter: if not provided, default to single Company
    let companyIdFilter: string | null | undefined = undefined;
    if (query.companyId !== undefined) {
      companyIdFilter = query.companyId || null;
    } else {
      // Default to single Company if exists
      companyIdFilter = await this.resolveCompanyId();
    }

    const where: Record<string, unknown> = {
      ...(searchWhere ?? {}),
      deletedAt: null,
      ...(query.isActive !== undefined ? { isActive: query.isActive === 'true' } : {}),
      ...(query.isCurrent !== undefined ? { isCurrent: query.isCurrent === 'true' } : {}),
      ...(companyIdFilter !== undefined ? { companyId: companyIdFilter } : {}),
    };

    return paginate(
      () => this.prisma.financialYear.count({ where }),
      ({ skip, take }) =>
        this.prisma.financialYear.findMany({ where, orderBy: [{ startDate: 'desc' }, { id: 'asc' }], skip, take }),
      query,
    );
  }

  async findOne(id: string) {
    const fy = await this.prisma.financialYear.findUnique({ where: { id, deletedAt: null } });
    if (!fy) throw new NotFoundException(`Financial year ${id} not found`);
    return fy;
  }

  async update(id: string, dto: UpdateFinancialYearDto, userId?: string) {
    await this.findOne(id);
    if (dto.name) {
      const existing = await this.prisma.financialYear.findFirst({ where: { name: dto.name, NOT: { id } } });
      if (existing) throw new ConflictException(`Financial year "${dto.name}" already exists`);
    }

    return this.prisma.$transaction(async (tx) => {
      if (dto.isCurrent) {
        await tx.financialYear.updateMany({ where: { isCurrent: true, NOT: { id } }, data: { isCurrent: false } });
      }
      return tx.financialYear.update({ where: { id }, data: { ...dto, updatedById: userId ?? null } });
    });
  }

  async remove(id: string, deletedById?: string) {
    await this.findOne(id);
    return this.prisma.financialYear.update({
      where: { id },
      data: { deletedAt: new Date(), deletedById: deletedById ?? null },
    });
  }
}
