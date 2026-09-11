import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantContextGuard } from '../tenant/tenant-context.guard';
import { TenantContextService, AuthUser } from '../tenant/tenant-context.service';
import { RequireScope } from '../tenant/decorators/require-scope.decorator';
import { TenantScope } from '../tenant/scope.enum';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { FinancialYearsService } from './financial-years.service';
import { CreateFinancialYearDto } from './dto/create-financial-year.dto';
import { UpdateFinancialYearDto } from './dto/update-financial-year.dto';
import { FindFinancialYearsQueryDto } from './dto/find-financial-years-query.dto';

@UseGuards(JwtAuthGuard, TenantContextGuard, PermissionsGuard)
@RequireScope(TenantScope.TENANT)
@Controller('financial-years')
export class FinancialYearsController {
  constructor(
    private readonly service: FinancialYearsService,
    private readonly tenantContext: TenantContextService,
  ) {}

  @Permissions('create:financial-years')
  @Post()
  create(@Body() dto: CreateFinancialYearDto, @Req() req: { user: AuthUser }) {
    return this.service.create(dto, req.user.id, this.tenantContext.requireOrganization(req));
  }

  @Permissions('read:financial-years')
  @Get()
  findAll(@Query() query: FindFinancialYearsQueryDto, @Req() req: { user: AuthUser }) {
    return this.service.findAll(query, this.tenantContext.requireOrganization(req));
  }

  @Permissions('read:financial-years')
  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: { user: AuthUser }) {
    return this.service.findOne(id, this.tenantContext.requireOrganization(req));
  }

  @Permissions('update:financial-years')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateFinancialYearDto, @Req() req: { user: AuthUser }) {
    return this.service.update(id, dto, req.user.id, this.tenantContext.requireOrganization(req));
  }

  @Permissions('delete:financial-years')
  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: { user: AuthUser }) {
    return this.service.remove(id, req.user.id, this.tenantContext.requireOrganization(req));
  }
}
