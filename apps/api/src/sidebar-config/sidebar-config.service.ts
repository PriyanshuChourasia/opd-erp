import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SidebarConfigService {
  constructor(private readonly prisma: PrismaService) {}

  /** List all sidebar menu items (with which roles have access). */
  async findAll() {
    return this.prisma.sidebarMenu.findMany({
      include: {
        roleMenus: {
          include: { role: { select: { id: true, name: true } } },
        },
      },
      orderBy: [{ group: 'asc' }, { sortOrder: 'asc' }, { label: 'asc' }],
    });
  }

  /** Get sidebar menu items visible to a specific role. */
  async findForRole(roleId: string) {
    return this.prisma.sidebarMenu.findMany({
      where: {
        isHidden: false,
        roleMenus: { some: { roleId } },
      },
      include: {
        roleMenus: {
          include: { role: { select: { id: true, name: true } } },
        },
      },
      orderBy: [{ group: 'asc' }, { sortOrder: 'asc' }, { label: 'asc' }],
    });
  }

  /**
   * All known sidebar menu paths, with no role information — used by the
   * frontend route guard to tell "not allowed for my role" apart from
   * "not a gated module at all". Safe for any authenticated user.
   */
  async findAllPaths() {
    return this.prisma.sidebarMenu.findMany({
      select: { path: true },
    });
  }

  /** Get sidebar menu items for multiple roles (used by auth/me). */
  async findForRoles(roleIds: string[]) {
    return this.prisma.sidebarMenu.findMany({
      where: {
        isHidden: false,
        roleMenus: { some: { roleId: { in: roleIds } } },
      },
      orderBy: [{ group: 'asc' }, { sortOrder: 'asc' }, { label: 'asc' }],
    });
  }

  /** Create a new sidebar menu item. */
  async create(data: {
    label: string;
    path: string;
    icon?: string;
    group: string;
    sortOrder?: number;
    isHidden?: boolean;
    roleIds?: string[];
  }) {
    const { roleIds, ...menuData } = data;
    return this.prisma.sidebarMenu.create({
      data: {
        ...menuData,
        roleMenus: roleIds?.length
          ? { create: roleIds.map((roleId) => ({ roleId })) }
          : undefined,
      },
      include: {
        roleMenus: {
          include: { role: { select: { id: true, name: true } } },
        },
      },
    });
  }

  /** Update a sidebar menu item. */
  async update(
    id: string,
    data: {
      label?: string;
      path?: string;
      icon?: string;
      group?: string;
      sortOrder?: number;
      isHidden?: boolean;
      roleIds?: string[];
    },
  ) {
    await this.findOne(id);
    const { roleIds, ...menuData } = data;

    if (roleIds !== undefined) {
      await this.prisma.roleSidebarMenu.deleteMany({
        where: { sidebarMenuId: id },
      });
      if (roleIds.length > 0) {
        await this.prisma.roleSidebarMenu.createMany({
          data: roleIds.map((roleId) => ({ roleId, sidebarMenuId: id })),
        });
      }
    }

    if (Object.keys(menuData).length > 0) {
      await this.prisma.sidebarMenu.update({
        where: { id },
        data: menuData,
      });
    }

    return this.findOne(id);
  }

  /** Delete a sidebar menu item. */
  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.sidebarMenu.delete({ where: { id } });
  }

  /** Bulk assign roles to a menu item. */
  async assignRoles(id: string, roleIds: string[]) {
    await this.findOne(id);
    await this.prisma.roleSidebarMenu.deleteMany({
      where: { sidebarMenuId: id },
    });
    if (roleIds.length > 0) {
      await this.prisma.roleSidebarMenu.createMany({
        data: roleIds.map((roleId) => ({ roleId, sidebarMenuId: id })),
      });
    }
    return this.findOne(id);
  }

  /** Bulk assign a menu item to multiple roles. */
  async assignToRoles(id: string, roleIds: string[]) {
    await this.findOne(id);
    // Only add new assignments, don't remove existing
    const existing = await this.prisma.roleSidebarMenu.findMany({
      where: { sidebarMenuId: id },
      select: { roleId: true },
    });
    const existingRoleIds = new Set(existing.map((e) => e.roleId));
    const newRoleIds = roleIds.filter((r) => !existingRoleIds.has(r));
    if (newRoleIds.length > 0) {
      await this.prisma.roleSidebarMenu.createMany({
        data: newRoleIds.map((roleId) => ({ roleId, sidebarMenuId: id })),
      });
    }
    return this.findOne(id);
  }

  /** Remove a menu item from specific roles. */
  async removeFromRoles(id: string, roleIds: string[]) {
    await this.findOne(id);
    await this.prisma.roleSidebarMenu.deleteMany({
      where: { sidebarMenuId: id, roleId: { in: roleIds } },
    });
    return this.findOne(id);
  }

  private async findOne(id: string) {
    const menu = await this.prisma.sidebarMenu.findUnique({
      where: { id },
      include: {
        roleMenus: {
          include: { role: { select: { id: true, name: true } } },
        },
      },
    });
    if (!menu) throw new NotFoundException(`Sidebar menu ${id} not found`);
    return menu;
  }
}
