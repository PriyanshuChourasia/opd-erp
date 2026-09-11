import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { paginate } from '../common/utils/paginate';
import type { IBaseService, IPaginatable } from '../common/interfaces/base-service.interface';
import type { PaginatedResult } from '../common/interfaces/paginated-result.interface';
import type { Role } from '@prisma/client';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { FindRolesQueryDto } from './dto/find-roles-query.dto';

/**
 * Role-based access control — define roles and assign permissions.
 *
 * # SOLID
 * - **Single Responsibility** — only role lifecycle with permission assignments.
 * - **Open/Closed** — new permission assignment strategies can be added without
 *   changing the role CRUD contract.
 */
@Injectable()
export class RolesService
  implements IBaseService<Role, CreateRoleDto, UpdateRoleDto>, IPaginatable<Role, FindRolesQueryDto>
{
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateRoleDto, userId?: string, organizationId?: string) {
    const { permissionIds, ...data } = dto;
    return this.prisma.role.create({
      data: {
        ...data,
        organizationId: organizationId ?? null,
        createdById: userId ?? null,
        rolePermissions: permissionIds?.length
          ? { create: permissionIds.map((permissionId) => ({ permissionId })) }
          : undefined,
      },
      include: { rolePermissions: { include: { permission: true } } },
    });
  }

  async findAll(query: FindRolesQueryDto, organizationId?: string): Promise<PaginatedResult<Role>> {
    const where: Record<string, unknown> = {};
    // Tenant isolation. System/global role templates (organizationId=null) are
    // still visible to the org so seeded roles keep working after scoping.
    if (organizationId) where.OR = [{ organizationId }, { organizationId: null }];

    return paginate(
      () => this.prisma.role.count({ where }),
      ({ skip, take }) =>
        this.prisma.role.findMany({
          where,
          include: {
            _count: { select: { users: true } },
            rolePermissions: { include: { permission: true } },
          },
          orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
          skip,
          take,
        }),
      query,
    );
  }

  async findOne(id: string, organizationId?: string) {
    const role = await this.prisma.role.findFirst({
      where: organizationId
        ? { id, OR: [{ organizationId }, { organizationId: null }] }
        : { id },
      include: {
        _count: { select: { users: true } },
        rolePermissions: { include: { permission: true } },
      },
    });
    if (!role) throw new NotFoundException(`Role ${id} not found`);
    return role;
  }

  async update(id: string, dto: UpdateRoleDto, userId?: string, organizationId?: string) {
    // Mutations may ONLY target org-owned roles (or global templates when the
    // caller is platform-scoped) — global role templates are read-only for
    // tenant accounts. Enforced BEFORE any side-effects (permission rewrites).
    const owned = await this.prisma.role.findFirst({
      where: organizationId ? { id, organizationId } : { id, organizationId: null },
    });
    if (!owned) throw new NotFoundException(`Role ${id} not found`);
    await this.findOne(id, organizationId);

    const { permissionIds, ...data } = dto;
    const updateData: Record<string, unknown> = { ...data, updatedById: userId ?? null };

    if (permissionIds !== undefined) {
      await this.prisma.rolePermission.deleteMany({ where: { roleId: id } });
      if (permissionIds.length > 0) {
        await this.prisma.rolePermission.createMany({
          data: permissionIds.map((permissionId) => ({ roleId: id, permissionId })),
        });
      }
    }

    if (Object.keys(updateData).length > 0) {
      await this.prisma.role.update({
        where: { id },
        data: updateData,
      });
    }

    return this.findOne(id, organizationId);
  }

  /** List all users assigned to a specific role */
  async findUsersByRole(roleId: string, organizationId?: string) {
    await this.findOne(roleId, organizationId);
    return this.prisma.user.findMany({
      where: organizationId ? { roleId, organizationId, isActive: true } : { roleId, isActive: true },
      select: {
        id: true,
        firstName: true,
        middleName: true,
        lastName: true,
        email: true,
        mobileNumber: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
    });
  }

  async remove(id: string, organizationId?: string) {
    const owned = await this.prisma.role.findFirst({
      where: organizationId ? { id, organizationId } : { id, organizationId: null },
    });
    if (!owned) throw new NotFoundException(`Role ${id} not found`);
    const result = await this.prisma.role.deleteMany({
      where: { id },
    });
    if (result.count === 0) throw new NotFoundException(`Role ${id} not found`);
    return owned;
  }
}
