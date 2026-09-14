import { Body, Controller, Get, Patch, Query, Req, UseGuards } from '@nestjs/common';
import { CompanyService } from './company.service';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantContextGuard } from '../tenant/tenant-context.guard';
import { TenantContextService, AuthUser } from '../tenant/tenant-context.service';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';

// No class-level @RequireScope(TENANT): scope enforcement happens per-request
// in resolveOrganizationScope() instead, so a platform-scoped caller with
// `organizations.manage` can pass an explicit organizationId override.
@UseGuards(JwtAuthGuard, TenantContextGuard, PermissionsGuard)
@Controller('company')
export class CompanyController {
  constructor(
    private readonly companyService: CompanyService,
    private readonly tenantContext: TenantContextService,
  ) {}

  @Get()
  @Permissions('read:company')
  async findOne(@Req() req: { user: AuthUser }, @Query('organizationId') organizationId?: string) {
    return this.companyService.findOne(await this.tenantContext.resolveOrganizationScope(req, organizationId));
  }

  @Patch()
  @Permissions('update:company')
  async update(@Body() dto: UpdateCompanyDto, @Req() req: { user: AuthUser }, @Query('organizationId') organizationId?: string) {
    return this.companyService.upsert(dto, req.user.id, await this.tenantContext.resolveOrganizationScope(req, organizationId));
  }
}
