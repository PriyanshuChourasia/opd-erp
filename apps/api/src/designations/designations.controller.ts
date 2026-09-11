import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantContextGuard } from '../tenant/tenant-context.guard';
import { TenantContextService, AuthUser } from '../tenant/tenant-context.service';
import { RequireScope } from '../tenant/decorators/require-scope.decorator';
import { TenantScope } from '../tenant/scope.enum';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { DesignationsService } from './designations.service';
import { CreateDesignationDto } from './dto/create-designation.dto';
import { UpdateDesignationDto } from './dto/update-designation.dto';
import { FindDesignationsQueryDto } from './dto/find-designations-query.dto';

@UseGuards(JwtAuthGuard, TenantContextGuard, PermissionsGuard)
@RequireScope(TenantScope.TENANT)
@Controller('designations')
export class DesignationsController {
  constructor(
    private readonly service: DesignationsService,
    private readonly tenantContext: TenantContextService,
  ) {}

  @Permissions('create:designations')
  @Post()
  create(@Body() dto: CreateDesignationDto, @Req() req: { user: AuthUser }) {
    return this.service.create(dto, req.user.id, this.tenantContext.requireOrganization(req));
  }

  @Permissions('read:designations')
  @Get()
  findAll(@Query() query: FindDesignationsQueryDto, @Req() req: { user: AuthUser }) {
    return this.service.findAll(query, this.tenantContext.requireOrganization(req));
  }

  @Permissions('read:designations')
  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: { user: AuthUser }) {
    return this.service.findOne(id, this.tenantContext.requireOrganization(req));
  }

  @Permissions('update:designations')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateDesignationDto, @Req() req: { user: AuthUser }) {
    return this.service.update(id, dto, req.user.id, this.tenantContext.requireOrganization(req));
  }

  @Permissions('delete:designations')
  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: { user: AuthUser }) {
    return this.service.remove(id, req.user.id, this.tenantContext.requireOrganization(req));
  }
}
