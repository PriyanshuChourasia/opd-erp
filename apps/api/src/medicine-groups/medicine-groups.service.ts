import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SearchQueryBuilder } from '../common/services/search-query-builder';
import { paginate } from '../common/utils/paginate';
import type { IBaseService, IPaginatable } from '../common/interfaces/base-service.interface';
import type { PaginatedResult } from '../common/interfaces/paginated-result.interface';
import type { MedicineGroup } from '@prisma/client';
import { CreateMedicineGroupDto } from './dto/create-medicine-group.dto';
import { UpdateMedicineGroupDto } from './dto/update-medicine-group.dto';
import { FindMedicineGroupsQueryDto } from './dto/find-medicine-groups-query.dto';

@Injectable()
export class MedicineGroupsService
  implements
    IBaseService<MedicineGroup, CreateMedicineGroupDto, UpdateMedicineGroupDto>,
    IPaginatable<MedicineGroup, FindMedicineGroupsQueryDto>
{
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateMedicineGroupDto, userId?: string) {
    const existing = await this.prisma.medicineGroup.findUnique({ where: { name: dto.name } });
    if (existing) throw new ConflictException(`Medicine group "${dto.name}" already exists`);
    return this.prisma.medicineGroup.create({ data: { ...dto, createdById: userId ?? null } });
  }

  async findAll(query: FindMedicineGroupsQueryDto): Promise<PaginatedResult<MedicineGroup>> {
    const searchWhere = SearchQueryBuilder.search(query.search, ['name', 'description']);
    const where = {
      ...(searchWhere ?? {}),
      deletedAt: null,
      ...(query.isActive !== undefined ? { isActive: query.isActive === 'true' } : {}),
    };
    return paginate(
      () => this.prisma.medicineGroup.count({ where }),
      ({ skip, take }) =>
        this.prisma.medicineGroup.findMany({
          where,
          orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
          skip,
          take,
        }),
      query,
    );
  }

  async findOne(id: string) {
    const group = await this.prisma.medicineGroup.findUnique({ where: { id, deletedAt: null } });
    if (!group) throw new NotFoundException(`Medicine group ${id} not found`);
    return group;
  }

  async update(id: string, dto: UpdateMedicineGroupDto, userId?: string) {
    await this.findOne(id);
    if (dto.name) {
      const existing = await this.prisma.medicineGroup.findFirst({
        where: { name: dto.name, NOT: { id } },
      });
      if (existing) throw new ConflictException(`Medicine group "${dto.name}" already exists`);
    }
    return this.prisma.medicineGroup.update({
      where: { id },
      data: { ...dto, updatedById: userId ?? null },
    });
  }

  async remove(id: string, deletedById?: string) {
    await this.findOne(id);
    const refCount = await this.prisma.medicine.count({ where: { groupId: id } });
    if (refCount > 0) {
      throw new ConflictException(
        `Cannot delete medicine group: ${refCount} medicine(s) reference it. Reassign or remove them first.`,
      );
    }
    return this.prisma.medicineGroup.update({
      where: { id },
      data: { deletedAt: new Date(), deletedById: deletedById ?? null },
    });
  }
}
