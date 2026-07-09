import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { paginate } from '../common/utils/paginate';
import type { IBaseService, IPaginatable } from '../common/interfaces/base-service.interface';
import type { PaginatedResult } from '../common/interfaces/paginated-result.interface';
import type { Permission } from '@prisma/client';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { FindPermissionsQueryDto } from './dto/find-permissions-query.dto';

/**
 * Granular permission rules — resource + action pairs that roles reference.
 *
 * # SOLID
 * - **Single Responsibility** — only permission rule lifecycle.
 * - **Interface Segregation** — implements only what it needs from IBaseService.
 */
@Injectable()
export class PermissionsService
  implements IBaseService<Permission, CreatePermissionDto, UpdatePermissionDto>, IPaginatable<Permission, FindPermissionsQueryDto>
{
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreatePermissionDto) {
    return this.prisma.permission.create({ data: dto });
  }

  findAll(query: FindPermissionsQueryDto): Promise<PaginatedResult<Permission>> {
    return paginate(
      () => this.prisma.permission.count(),
      ({ skip, take }) =>
        this.prisma.permission.findMany({ orderBy: [{ resource: 'asc' }, { action: 'asc' }, { id: 'asc' }], skip, take }),
      query,
    );
  }

  async findOne(id: string) {
    const permission = await this.prisma.permission.findUnique({ where: { id } });
    if (!permission) throw new NotFoundException(`Permission ${id} not found`);
    return permission;
  }

  async update(id: string, dto: UpdatePermissionDto) {
    await this.findOne(id);
    return this.prisma.permission.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.permission.delete({ where: { id } });
  }
}
