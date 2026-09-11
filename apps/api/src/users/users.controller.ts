import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { FindUsersQueryDto } from './dto/find-users-query.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { TenantContextGuard } from '../tenant/tenant-context.guard';
import { TenantContextService, AuthUser } from '../tenant/tenant-context.service';
import { RequireScope } from '../tenant/decorators/require-scope.decorator';
import { TenantScope } from '../tenant/scope.enum';

@UseGuards(JwtAuthGuard, TenantContextGuard, PermissionsGuard)
@RequireScope(TenantScope.TENANT)
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly tenantContext: TenantContextService,
  ) {}

  @Get()
  @Permissions('read:users')
  findAll(@Query() query: FindUsersQueryDto, @Req() req: { user: AuthUser }) {
    return this.usersService.findAll(query, this.tenantContext.requireOrganization(req));
  }

  @Get('roles')
  @Permissions('read:users')
  findAllRoles() {
    return this.usersService.findAllRoles();
  }

  @Get(':id')
  @Permissions('read:users')
  findOne(@Param('id') id: string, @Req() req: { user: AuthUser }) {
    return this.usersService.findOne(id, this.tenantContext.requireOrganization(req));
  }

  @Post()
  @Permissions('create:users')
  create(@Body() dto: CreateUserDto, @Req() req: { user: AuthUser }) {
    return this.usersService.create(dto, req.user.id, this.tenantContext.requireOrganization(req));
  }

  @Patch(':id')
  @Permissions('update:users')
  update(@Param('id') id: string, @Body() dto: UpdateUserDto, @Req() req: { user: AuthUser }) {
    return this.usersService.update(id, dto, req.user.id, this.tenantContext.requireOrganization(req));
  }

  @Delete(':id')
  @Permissions('delete:users')
  remove(@Param('id') id: string, @Req() req: { user: AuthUser }) {
    return this.usersService.remove(id, this.tenantContext.requireOrganization(req));
  }

  @Patch(':id/restore')
  @Permissions('update:users')
  restore(@Param('id') id: string, @Req() req: { user: AuthUser }) {
    return this.usersService.restore(id, this.tenantContext.requireOrganization(req));
  }
}
