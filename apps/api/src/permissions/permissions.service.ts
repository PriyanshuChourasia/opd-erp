import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { IBaseService } from '../common/interfaces/base-service.interface';
import type { Permission } from '@prisma/client';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';

/**
 * Granular permission rules — resource + action pairs that roles reference.
 *
 * # SOLID
 * - **Single Responsibility** — only permission rule lifecycle.
 * - **Interface Segregation** — implements only what it needs from IBaseService.
 */
@Injectable()
export class PermissionsService implements IBaseService<Permission, CreatePermissionDto, UpdatePermissionDto> {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreatePermissionDto) {
    return this.prisma.permission.create({ data: dto });
  }

  findAll() {
    return this.prisma.permission.findMany({ orderBy: [{ resource: 'asc' }, { action: 'asc' }] });
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
