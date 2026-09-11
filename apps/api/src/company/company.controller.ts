import { Body, Controller, Get, Patch, Req, UseGuards } from '@nestjs/common';
import { CompanyService } from './company.service';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantContextGuard } from '../tenant/tenant-context.guard';
import { TenantContextService, AuthUser } from '../tenant/tenant-context.service';
import { RequireScope } from '../tenant/decorators/require-scope.decorator';
import { TenantScope } from '../tenant/scope.enum';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';

@UseGuards(JwtAuthGuard, TenantContextGuard, PermissionsGuard)
@RequireScope(TenantScope.TENANT)
@Controller('company')
export class CompanyController {
  constructor(
    private readonly companyService: CompanyService,
    private readonly tenantContext: TenantContextService,
  ) {}

  @Get()
  @Permissions('read:company')
  findOne(@Req() req: { user: AuthUser }) {
    return this.companyService.findOne(this.tenantContext.requireOrganization(req));
  }

  @Patch()
  @Permissions('update:company')
  update(@Body() dto: UpdateCompanyDto, @Req() req: { user: AuthUser }) {
    return this.companyService.upsert(dto, req.user.id, this.tenantContext.requireOrganization(req));
  }
}
