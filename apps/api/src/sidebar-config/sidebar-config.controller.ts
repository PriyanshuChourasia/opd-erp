import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { SidebarConfigService } from './sidebar-config.service';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('sidebar-config')
export class SidebarConfigController {
  constructor(private readonly sidebarConfigService: SidebarConfigService) {}

  @Get()
  @Permissions('read:roles')
  findAll() {
    return this.sidebarConfigService.findAll();
  }

  @Get('for-role/:roleId')
  @Permissions('read:roles')
  findForRole(@Param('roleId') roleId: string) {
    return this.sidebarConfigService.findForRole(roleId);
  }

  @Post()
  @Permissions('manage:roles')
  create(
    @Body()
    data: {
      label: string;
      path: string;
      icon?: string;
      group: string;
      sortOrder?: number;
      isHidden?: boolean;
      roleIds?: string[];
    },
  ) {
    return this.sidebarConfigService.create(data);
  }

  @Patch(':id')
  @Permissions('manage:roles')
  update(
    @Param('id') id: string,
    @Body()
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
    return this.sidebarConfigService.update(id, data);
  }

  @Delete(':id')
  @Permissions('manage:roles')
  remove(@Param('id') id: string) {
    return this.sidebarConfigService.remove(id);
  }

  @Patch(':id/assign-roles')
  @Permissions('manage:roles')
  assignRoles(
    @Param('id') id: string,
    @Body() body: { roleIds: string[] },
  ) {
    return this.sidebarConfigService.assignRoles(id, body.roleIds);
  }
}
