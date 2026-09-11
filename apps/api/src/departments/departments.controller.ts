import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantContextGuard } from '../tenant/tenant-context.guard';
import { TenantContextService, AuthUser } from '../tenant/tenant-context.service';
import { RequireScope } from '../tenant/decorators/require-scope.decorator';
import { TenantScope } from '../tenant/scope.enum';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { DepartmentsService } from './departments.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { FindDepartmentsQueryDto } from './dto/find-departments-query.dto';

@UseGuards(JwtAuthGuard, TenantContextGuard, PermissionsGuard)
@RequireScope(TenantScope.TENANT)
@Controller('departments')
export class DepartmentsController {
  constructor(
    private readonly service: DepartmentsService,
    private readonly tenantContext: TenantContextService,
  ) {}

  @Permissions('create:departments')
  @Post()
  create(@Body() dto: CreateDepartmentDto, @Req() req: { user: AuthUser }) {
    return this.service.create(dto, req.user.id, this.tenantContext.requireOrganization(req));
  }

  @Permissions('read:departments')
  @Get()
  findAll(@Query() query: FindDepartmentsQueryDto, @Req() req: { user: AuthUser }) {
    return this.service.findAll(query, this.tenantContext.requireOrganization(req));
  }

  @Permissions('read:departments')
  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: { user: AuthUser }) {
    return this.service.findOne(id, this.tenantContext.requireOrganization(req));
  }

  @Permissions('update:departments')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateDepartmentDto, @Req() req: { user: AuthUser }) {
    return this.service.update(id, dto, req.user.id, this.tenantContext.requireOrganization(req));
  }

  @Permissions('delete:departments')
  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: { user: AuthUser }) {
    return this.service.remove(id, req.user.id, this.tenantContext.requireOrganization(req));
  }
}
