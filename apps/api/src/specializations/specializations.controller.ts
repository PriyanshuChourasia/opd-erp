import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { TenantContextGuard } from '../tenant/tenant-context.guard';
import { TenantContextService, AuthUser } from '../tenant/tenant-context.service';
import { RequireScope } from '../tenant/decorators/require-scope.decorator';
import { TenantScope } from '../tenant/scope.enum';
import { SpecializationsService } from './specializations.service';
import { CreateSpecializationDto } from './dto/create-specialization.dto';
import { UpdateSpecializationDto } from './dto/update-specialization.dto';
import { FindSpecializationsQueryDto } from './dto/find-specializations-query.dto';

@UseGuards(JwtAuthGuard, TenantContextGuard, PermissionsGuard)
@RequireScope(TenantScope.TENANT)
@Controller('specializations')
export class SpecializationsController {
  constructor(
    private readonly specializationsService: SpecializationsService,
    private readonly tenantContext: TenantContextService,
  ) {}

  @Post()
  create(@Body() dto: CreateSpecializationDto, @Req() req: { user: AuthUser }) {
    return this.specializationsService.create(dto, req.user.id, this.tenantContext.requireOrganization(req));
  }

  @Get()
  findAll(@Query() query: FindSpecializationsQueryDto, @Req() req: { user: AuthUser }) {
    return this.specializationsService.findAll(query, this.tenantContext.requireOrganization(req));
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: { user: AuthUser }) {
    return this.specializationsService.findOne(id, this.tenantContext.requireOrganization(req));
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateSpecializationDto, @Req() req: { user: AuthUser }) {
    return this.specializationsService.update(id, dto, req.user.id, this.tenantContext.requireOrganization(req));
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: { user: AuthUser }) {
    return this.specializationsService.remove(id, req.user.id, this.tenantContext.requireOrganization(req));
  }
}
