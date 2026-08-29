import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SearchQueryBuilder } from '../common/services/search-query-builder';
import { paginate } from '../common/utils/paginate';
import type { IBaseService, IPaginatable } from '../common/interfaces/base-service.interface';
import type { PaginatedResult } from '../common/interfaces/paginated-result.interface';
import type { Medicine } from '@prisma/client';
import { CreateMedicineDto } from './dto/create-medicine.dto';
import { UpdateMedicineDto } from './dto/update-medicine.dto';
import { FindMedicinesQueryDto } from './dto/find-medicines-query.dto';

const MEDICINE_INCLUDE = { group: true, unitMaster: true } as const;

/**
 * Medicine/drug master database management.
 *
 * # SOLID
 * - **Single Responsibility** — only medicine catalog lifecycle.
 * - **Dependency Inversion** — implements `IBaseService` & `IPaginatable` contracts.
 */
@Injectable()
export class MedicineCatalogService
  implements IBaseService<Medicine, CreateMedicineDto, UpdateMedicineDto>, IPaginatable<Medicine, FindMedicinesQueryDto>
{
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateMedicineDto, userId?: string) {
    const { openingStock, currentStock, ...rest } = dto;
    return this.prisma.medicine.create({
      data: {
        ...rest,
        createdById: userId ?? null,
        openingStock: openingStock ?? undefined,
        currentStock: currentStock ?? openingStock ?? 0,
      },
      include: MEDICINE_INCLUDE,
    });
  }

  async findAll(query: FindMedicinesQueryDto): Promise<PaginatedResult<Medicine>> {
    const searchWhere = SearchQueryBuilder.search(query.search, ['name', 'alias', 'genericName', 'brandName']);
    const where: Record<string, unknown> = {
      ...(searchWhere ?? {}),
      ...(query.groupId ? { groupId: query.groupId } : {}),
    };
    return paginate(
      () => this.prisma.medicine.count({ where }),
      ({ skip, take }) =>
        this.prisma.medicine.findMany({
          where,
          include: MEDICINE_INCLUDE,
          orderBy: [{ name: 'asc' }, { id: 'asc' }],
          skip,
          take,
        }),
      query,
    );
  }

  async findOne(id: string) {
    const medicine = await this.prisma.medicine.findUnique({ where: { id }, include: MEDICINE_INCLUDE });
    if (!medicine) throw new NotFoundException(`Medicine ${id} not found`);
    return medicine;
  }

  async update(id: string, dto: UpdateMedicineDto, userId?: string) {
    await this.findOne(id);
    return this.prisma.medicine.update({
      where: { id },
      data: { ...dto, updatedById: userId ?? null },
      include: MEDICINE_INCLUDE,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.medicine.delete({ where: { id } });
  }
}
