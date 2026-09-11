import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { Permissions } from '../../auth/decorators/permissions.decorator';
import { TenantContextGuard } from '../../tenant/tenant-context.guard';
import { RequireScope } from '../../tenant/decorators/require-scope.decorator';
import { TenantScope } from '../../tenant/scope.enum';
import { LicensesService } from './licenses.service';
import { CreateLicenseDto } from './dto/create-license.dto';
import { UpdateLicenseDto } from './dto/update-license.dto';

@UseGuards(JwtAuthGuard, TenantContextGuard, PermissionsGuard)
@RequireScope(TenantScope.PLATFORM)
@Controller('licenses')
export class LicensesController {
  constructor(private readonly licensesService: LicensesService) {}

  @Post()
  @Permissions('create:licenses')
  create(@Body() dto: CreateLicenseDto, @Req() req: { user: { id: string } }) {
    return this.licensesService.create(dto, req.user.id);
  }

  @Get()
  @Permissions('read:licenses')
  findAll(@Query() query: { page?: number; limit?: number; orgId?: string }) {
    return this.licensesService.findAll(query);
  }

  @Get(':id')
  @Permissions('read:licenses')
  findOne(@Param('id') id: string) {
    return this.licensesService.findOne(id);
  }

  @Patch(':id')
  @Permissions('update:licenses')
  update(@Param('id') id: string, @Body() dto: UpdateLicenseDto, @Req() req: { user: { id: string } }) {
    return this.licensesService.update(id, dto, req.user.id);
  }

  @Patch(':id/revoke')
  @Permissions('update:licenses')
  revoke(@Param('id') id: string) {
    return this.licensesService.revoke(id);
  }
}