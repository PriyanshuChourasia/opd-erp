import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantContextGuard } from '../tenant/tenant-context.guard';
import { TenantContextService, AuthUser } from '../tenant/tenant-context.service';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { FinancialYearsService } from './financial-years.service';
import { CreateFinancialYearDto } from './dto/create-financial-year.dto';
import { UpdateFinancialYearDto } from './dto/update-financial-year.dto';
import { FindFinancialYearsQueryDto } from './dto/find-financial-years-query.dto';

// No class-level @RequireScope(TENANT): scope enforcement happens per-request
// in resolveOrganizationScope() instead, so a platform-scoped caller with
// `organizations.manage` can pass an explicit organizationId override.
@UseGuards(JwtAuthGuard, TenantContextGuard, PermissionsGuard)
@Controller('financial-years')
export class FinancialYearsController {
  constructor(
    private readonly service: FinancialYearsService,
    private readonly tenantContext: TenantContextService,
  ) {}

  @Permissions('create:financial-years')
  @Post()
  async create(@Body() dto: CreateFinancialYearDto, @Req() req: { user: AuthUser }, @Query('organizationId') organizationId?: string) {
    return this.service.create(dto, req.user.id, await this.tenantContext.resolveOrganizationScope(req, organizationId));
  }

  @Permissions('read:financial-years')
  @Get()
  async findAll(@Query() query: FindFinancialYearsQueryDto, @Req() req: { user: AuthUser }) {
    return this.service.findAll(query, await this.tenantContext.resolveOrganizationScope(req, query.organizationId));
  }

  @Permissions('read:financial-years')
  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req: { user: AuthUser }, @Query('organizationId') organizationId?: string) {
    return this.service.findOne(id, await this.tenantContext.resolveOrganizationScope(req, organizationId));
  }

  @Permissions('update:financial-years')
  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateFinancialYearDto, @Req() req: { user: AuthUser }, @Query('organizationId') organizationId?: string) {
    return this.service.update(id, dto, req.user.id, await this.tenantContext.resolveOrganizationScope(req, organizationId));
  }

  @Permissions('delete:financial-years')
  @Delete(':id')
  async remove(@Param('id') id: string, @Req() req: { user: AuthUser }, @Query('organizationId') organizationId?: string) {
    return this.service.remove(id, req.user.id, await this.tenantContext.resolveOrganizationScope(req, organizationId));
  }
}
