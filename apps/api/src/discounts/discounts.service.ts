import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SearchQueryBuilder } from '../common/services/search-query-builder';
import { paginate } from '../common/utils/paginate';
import type { IBaseService, IPaginatable } from '../common/interfaces/base-service.interface';
import type { PaginatedResult } from '../common/interfaces/paginated-result.interface';
import type { DiscountRule } from '@prisma/client';
import { CreateDiscountDto } from './dto/create-discount.dto';
import { UpdateDiscountDto } from './dto/update-discount.dto';
import { FindDiscountsQueryDto } from './dto/find-discounts-query.dto';

@Injectable()
export class DiscountsService
  implements
    IBaseService<DiscountRule, CreateDiscountDto, UpdateDiscountDto>,
    IPaginatable<DiscountRule, FindDiscountsQueryDto>
{
  constructor(private readonly prisma: PrismaService) {}

  /** A PERCENTAGE rule can never exceed the organisation's configured ceiling. */
  private async assertWithinCompanyCap(type: string | undefined, value: number | undefined) {
    if (type !== 'PERCENTAGE' || value === undefined) return;
    const company = await this.prisma.company.findFirst();
    const maxPercent = company?.maxDiscountPercent ?? 50;
    if (value > maxPercent) {
      throw new BadRequestException(`Percentage discount cannot exceed the organisation's maximum (${maxPercent}%)`);
    }
  }

  async create(dto: CreateDiscountDto, userId?: string) {
    await this.assertWithinCompanyCap(dto.type, dto.value);
    return this.prisma.discountRule.create({
      data: {
        name: dto.name,
        type: dto.type,
        value: dto.value,
        validFrom: dto.validFrom ? new Date(dto.validFrom) : undefined,
        validTo: dto.validTo ? new Date(dto.validTo) : undefined,
        isActive: dto.isActive ?? true,
        description: dto.description,
        createdById: userId ?? null,
      },
    });
  }

  async findAll(query: FindDiscountsQueryDto): Promise<PaginatedResult<DiscountRule>> {
    const searchWhere = SearchQueryBuilder.search(query.search, ['name', 'description']);
    const now = new Date();
    const where: Record<string, unknown> = {
      ...(searchWhere ?? {}),
      deletedAt: null,
      ...(query.isActive !== undefined ? { isActive: query.isActive === 'true' } : {}),
    };
    if (query.activeOnly === 'true') {
      where.isActive = true;
      where.AND = [
        { OR: [{ validFrom: null }, { validFrom: { lte: now } }] },
        { OR: [{ validTo: null }, { validTo: { gte: now } }] },
      ];
    }
    return paginate(
      () => this.prisma.discountRule.count({ where }),
      ({ skip, take }) =>
        this.prisma.discountRule.findMany({
          where,
          orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
          skip,
          take,
        }),
      query,
    );
  }

  async findOne(id: string) {
    const rule = await this.prisma.discountRule.findUnique({ where: { id, deletedAt: null } });
    if (!rule) throw new NotFoundException(`Discount rule ${id} not found`);
    return rule;
  }

  async update(id: string, dto: UpdateDiscountDto, userId?: string) {
    const existing = await this.findOne(id);
    await this.assertWithinCompanyCap(dto.type ?? existing.type, dto.value ?? existing.value);
    return this.prisma.discountRule.update({
      where: { id },
      data: {
        ...dto,
        validFrom: dto.validFrom !== undefined ? (dto.validFrom ? new Date(dto.validFrom) : null) : undefined,
        validTo: dto.validTo !== undefined ? (dto.validTo ? new Date(dto.validTo) : null) : undefined,
        updatedById: userId ?? null,
      },
    });
  }

  async remove(id: string, deletedById?: string) {
    const existing = await this.findOne(id);
    const refCount = await this.prisma.bill.count({ where: { discountRuleId: id } });
    if (refCount > 0) {
      // Bills keep their own snapshotted discount amount — deactivate instead of
      // hard-deleting so the rule id stays resolvable on historical bills.
      throw new ConflictException(
        `Cannot delete "${existing.name}": ${refCount} bill(s) reference it. Deactivate it instead.`,
      );
    }
    return this.prisma.discountRule.update({
      where: { id },
      data: { deletedAt: new Date(), deletedById: deletedById ?? null },
    });
  }
}
