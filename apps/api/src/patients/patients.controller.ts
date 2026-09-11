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
import { TenantContextGuard } from '../tenant/tenant-context.guard';
import { TenantContextService, AuthUser } from '../tenant/tenant-context.service';
import { RequireScope } from '../tenant/decorators/require-scope.decorator';
import { TenantScope } from '../tenant/scope.enum';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { PatientsService } from './patients.service';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { FindPatientsQueryDto } from './dto/find-patients-query.dto';
import { CreatePortalLoginDto } from './dto/create-portal-login.dto';

@UseGuards(JwtAuthGuard, TenantContextGuard, PermissionsGuard)
@RequireScope(TenantScope.TENANT)
@Controller('patients')
export class PatientsController {
  constructor(
    private readonly patientsService: PatientsService,
    private readonly tenantContext: TenantContextService,
  ) {}

  @Post()
  @Permissions('create:patients')
  create(@Body() dto: CreatePatientDto, @Req() req: { user: AuthUser }) {
    return this.patientsService.create(dto, req.user.id, this.tenantContext.requireOrganization(req));
  }

  @Get()
  @Permissions('read:patients')
  findAll(@Query() query: FindPatientsQueryDto, @Req() req: { user: AuthUser }) {
    return this.patientsService.findAll(query, this.tenantContext.requireOrganization(req));
  }

  @Get(':id')
  @Permissions('read:patients')
  findOne(@Param('id') id: string, @Req() req: { user: AuthUser }) {
    return this.patientsService.findOne(id, this.tenantContext.requireOrganization(req));
  }

  @Patch(':id')
  @Permissions('update:patients')
  update(@Param('id') id: string, @Body() dto: UpdatePatientDto, @Req() req: { user: AuthUser }) {
    return this.patientsService.update(id, dto, req.user.id, this.tenantContext.requireOrganization(req));
  }

  @Delete(':id')
  @Permissions('delete:patients')
  remove(@Param('id') id: string, @Req() req: { user: AuthUser }) {
    return this.patientsService.remove(id, req.user.id, this.tenantContext.requireOrganization(req));
  }

  @Patch(':id/restore')
  @Permissions('update:patients')
  restore(@Param('id') id: string, @Req() req: { user: AuthUser }) {
    return this.patientsService.restore(id, this.tenantContext.requireOrganization(req));
  }

  @Post(':id/portal-login')
  @Permissions('manage:patients')
  createPortalLogin(
    @Param('id') id: string,
    @Body() dto: CreatePortalLoginDto,
    @Req() req: { user: AuthUser },
  ) {
    return this.patientsService.createPortalLogin(id, dto, req.user.id, this.tenantContext.requireOrganization(req));
  }
}