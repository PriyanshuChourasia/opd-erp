import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { IBaseService } from '../common/interfaces/base-service.interface';
import type { Role } from '@prisma/client';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

/**
 * Role-based access control — define roles and assign permissions.
 *
 * # SOLID
 * - **Single Responsibility** — only role lifecycle with permission assignments.
 * - **Open/Closed** — new permission assignment strategies can be added without
 *   changing the role CRUD contract.
 */
@Injectable()
export class RolesService implements IBaseService<Role, CreateRoleDto, UpdateRoleDto> {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateRoleDto) {
    const { permissionIds, ...data } = dto;
    return this.prisma.role.create({
      data: {
        ...data,
        rolePermissions: permissionIds?.length
          ? { create: permissionIds.map((permissionId) => ({ permissionId })) }
          : undefined,
      },
      include: { rolePermissions: { include: { permission: true } } },
    });
  }

  async findAll() {
    return this.prisma.role.findMany({
      include: {
        _count: { select: { users: true } },
        rolePermissions: { include: { permission: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findOne(id: string) {
    const role = await this.prisma.role.findUnique({
      where: { id },
      include: {
        _count: { select: { users: true } },
        rolePermissions: { include: { permission: true } },
      },
    });
    if (!role) throw new NotFoundException(`Role ${id} not found`);
    return role;
  }

  async update(id: string, dto: UpdateRoleDto) {
    await this.findOne(id);
    const { permissionIds, ...data } = dto;

    if (permissionIds !== undefined) {
      await this.prisma.rolePermission.deleteMany({ where: { roleId: id } });
      if (permissionIds.length > 0) {
        await this.prisma.rolePermission.createMany({
          data: permissionIds.map((permissionId) => ({ roleId: id, permissionId })),
        });
      }
    }

    if (Object.keys(data).length > 0) {
      await this.prisma.role.update({ where: { id }, data });
    }

    return this.findOne(id);
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.role.delete({ where: { id } });
  }
}
