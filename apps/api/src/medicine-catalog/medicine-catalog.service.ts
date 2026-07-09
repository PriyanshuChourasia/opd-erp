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

  async create(dto: CreateMedicineDto) {
    return this.prisma.medicine.create({ data: dto });
  }

  async findAll(query: FindMedicinesQueryDto): Promise<PaginatedResult<Medicine>> {
    const where = SearchQueryBuilder.search(query.search, ['name', 'genericName', 'brandName']);
    return paginate(
      () => this.prisma.medicine.count({ where }),
      ({ skip, take }) => this.prisma.medicine.findMany({ where, orderBy: [{ name: 'asc' }, { id: 'asc' }], skip, take }),
      query,
    );
  }

  async findOne(id: string) {
    const medicine = await this.prisma.medicine.findUnique({ where: { id } });
    if (!medicine) throw new NotFoundException(`Medicine ${id} not found`);
    return medicine;
  }

  async update(id: string, dto: UpdateMedicineDto) {
    await this.findOne(id);
    return this.prisma.medicine.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.medicine.delete({ where: { id } });
  }
}
