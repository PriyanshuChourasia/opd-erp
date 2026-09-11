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

  async create(dto: CreateDepartmentDto, userId?: string, organizationId?: string) {
    const existing = await this.prisma.department.findUnique({ where: { name: dto.name } });
    if (existing) throw new ConflictException(`Department "${dto.name}" already exists`);
    return this.prisma.department.create({ data: { ...dto, organizationId: organizationId ?? null, createdById: userId ?? null } });
  }

  async findAll(query: FindDepartmentsQueryDto, organizationId?: string): Promise<PaginatedResult<Department>> {
    const searchWhere = SearchQueryBuilder.search(query.search, ['name', 'description']);
    const where: Record<string, unknown> = {
      ...(searchWhere ?? {}),
      deletedAt: null,
      ...(query.isActive !== undefined ? { isActive: query.isActive === 'true' } : {}),
    };
    if (organizationId) where.OR = [{ organizationId }, { organizationId: null }]; // own org + shared global defaults
    return paginate(
      () => this.prisma.department.count({ where }),
      ({ skip, take }) =>
        this.prisma.department.findMany({ where, orderBy: [{ createdAt: 'desc' }, { id: 'asc' }], skip, take }),
      query,
    );
  }

  async findOne(id: string, organizationId?: string) {
    const dept = await this.prisma.department.findFirst({
      where: organizationId
        ? { id, deletedAt: null, OR: [{ organizationId }, { organizationId: null }] }
        : { id, deletedAt: null },
    });
    if (!dept) throw new NotFoundException(`Department ${id} not found`);
    return dept;
  }

  async update(id: string, dto: UpdateDepartmentDto, userId?: string, organizationId?: string) {
    await this.findOne(id, organizationId);
    if (dto.name) {
      const existing = await this.prisma.department.findFirst({ where: { name: dto.name, NOT: { id } } });
      if (existing) throw new ConflictException(`Department "${dto.name}" already exists`);
    }
    const result = await this.prisma.department.updateMany({
      where: organizationId ? { id, organizationId } : { id },
      data: { ...dto, updatedById: userId ?? null },
    });
    if (result.count === 0) throw new NotFoundException(`Department ${id} not found`);
    return this.findOne(id, organizationId);
  }

  async remove(id: string, deletedById?: string, organizationId?: string) {
    await this.findOne(id, organizationId);
    const refCount = await this.prisma.doctorDepartment.count({ where: { departmentId: id } });
    if (refCount > 0) {
      throw new ConflictException(`Cannot delete department: ${refCount} doctor(s) reference it. Unlink them first.`);
    }
    const result = await this.prisma.department.updateMany({
      where: organizationId ? { id, organizationId } : { id },
      data: { deletedAt: new Date(), deletedById: deletedById ?? null },
    });
    if (result.count === 0) throw new NotFoundException(`Department ${id} not found`);
    return this.findOne(id, organizationId);
  }
}
