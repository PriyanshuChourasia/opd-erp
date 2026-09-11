import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { TenantContextGuard } from '../tenant/tenant-context.guard';
import { TenantContextService, AuthUser } from '../tenant/tenant-context.service';
import { RequireScope } from '../tenant/decorators/require-scope.decorator';
import { TenantScope } from '../tenant/scope.enum';
import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { FindRolesQueryDto } from './dto/find-roles-query.dto';

@UseGuards(JwtAuthGuard, TenantContextGuard, PermissionsGuard)
@RequireScope(TenantScope.TENANT)
@Controller('roles')
export class RolesController {
  constructor(
    private readonly rolesService: RolesService,
    private readonly tenantContext: TenantContextService,
  ) {}

  @Post()
  @Permissions('create:roles')
  create(@Body() dto: CreateRoleDto, @Req() req: { user: AuthUser }) {
    return this.rolesService.create(dto, req.user.id, this.tenantContext.requireOrganization(req));
  }

  @Get()
  @Permissions('read:roles')
  findAll(@Query() query: FindRolesQueryDto, @Req() req: { user: AuthUser }) {
    return this.rolesService.findAll(query, this.tenantContext.requireOrganization(req));
  }

  @Get(':id')
  @Permissions('read:roles')
  findOne(@Param('id') id: string, @Req() req: { user: AuthUser }) {
    return this.rolesService.findOne(id, this.tenantContext.requireOrganization(req));
  }

  @Get(':id/users')
  @Permissions('read:roles')
  findUsersByRole(@Param('id') id: string, @Req() req: { user: AuthUser }) {
    return this.rolesService.findUsersByRole(id, this.tenantContext.requireOrganization(req));
  }

  @Patch(':id')
  @Permissions('update:roles')
  update(@Param('id') id: string, @Body() dto: UpdateRoleDto, @Req() req: { user: AuthUser }) {
    return this.rolesService.update(id, dto, req.user.id, this.tenantContext.requireOrganization(req));
  }

  @Delete(':id')
  @Permissions('delete:roles')
  remove(@Param('id') id: string, @Req() req: { user: AuthUser }) {
    return this.rolesService.remove(id, this.tenantContext.requireOrganization(req));
  }
}