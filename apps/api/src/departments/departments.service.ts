import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SearchQueryBuilder } from '../common/services/search-query-builder';
import { paginate } from '../common/utils/paginate';
import type { IBaseService, IPaginatable } from '../common/interfaces/base-service.interface';
import type { PaginatedResult } from '../common/interfaces/paginated-result.interface';
import type { Department } from '@prisma/client';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { FindDepartmentsQueryDto } from './dto/find-departments-query.dto';

@Injectable()
export class DepartmentsService
  implements IBaseService<Department, CreateDepartmentDto, UpdateDepartmentDto>, IPaginatable<Department, FindDepartmentsQueryDto>
{
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateDepartmentDto, userId?: string) {
    const existing = await this.prisma.department.findUnique({ where: { name: dto.name } });
    if (existing) throw new ConflictException(`Department "${dto.name}" already exists`);
    return this.prisma.department.create({ data: { ...dto, createdById: userId ?? null } });
  }

  async findAll(query: FindDepartmentsQueryDto): Promise<PaginatedResult<Department>> {
    const searchWhere = SearchQueryBuilder.search(query.search, ['name', 'description']);
    const where = {
      ...(searchWhere ?? {}),
      deletedAt: null,
      ...(query.isActive !== undefined ? { isActive: query.isActive === 'true' } : {}),
    };
    return paginate(
      () => this.prisma.department.count({ where }),
      ({ skip, take }) =>
        this.prisma.department.findMany({ where, orderBy: [{ createdAt: 'desc' }, { id: 'asc' }], skip, take }),
      query,
    );
  }

  async findOne(id: string) {
    const dept = await this.prisma.department.findUnique({ where: { id, deletedAt: null } });
    if (!dept) throw new NotFoundException(`Department ${id} not found`);
    return dept;
  }

  async update(id: string, dto: UpdateDepartmentDto, userId?: string) {
    await this.findOne(id);
    if (dto.name) {
      const existing = await this.prisma.department.findFirst({ where: { name: dto.name, NOT: { id } } });
      if (existing) throw new ConflictException(`Department "${dto.name}" already exists`);
    }
    return this.prisma.department.update({ where: { id }, data: { ...dto, updatedById: userId ?? null } });
  }

  async remove(id: string, deletedById?: string) {
    await this.findOne(id);
    const refCount = await this.prisma.doctorDepartment.count({ where: { departmentId: id } });
    if (refCount > 0) {
      throw new ConflictException(`Cannot delete department: ${refCount} doctor(s) reference it. Unlink them first.`);
    }
    return this.prisma.department.update({
      where: { id },
      data: { deletedAt: new Date(), deletedById: deletedById ?? null },
    });
  }
}
