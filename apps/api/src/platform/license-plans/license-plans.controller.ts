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
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { Permissions } from '../../auth/decorators/permissions.decorator';
import { TenantContextGuard } from '../../tenant/tenant-context.guard';
import { RequireScope } from '../../tenant/decorators/require-scope.decorator';
import { TenantScope } from '../../tenant/scope.enum';
import { LicensePlansService } from './license-plans.service';
import { CreateLicensePlanDto } from './dto/create-license-plan.dto';
import { UpdateLicensePlanDto } from './dto/update-license-plan.dto';

@UseGuards(JwtAuthGuard, TenantContextGuard, PermissionsGuard)
@RequireScope(TenantScope.PLATFORM)
@Controller('license-plans')
export class LicensePlansController {
  constructor(private readonly licensePlansService: LicensePlansService) {}

  @Post()
  @Permissions('create:license-plans')
  create(@Body() dto: CreateLicensePlanDto, @Req() req: { user: { id: string } }) {
    return this.licensePlansService.create(dto, req.user.id);
  }

  @Get()
  @Permissions('read:license-plans')
  findAll(@Query() query: { page?: number; limit?: number }) {
    return this.licensePlansService.findAll(query);
  }

  @Get(':id')
  @Permissions('read:license-plans')
  findOne(@Param('id') id: string) {
    return this.licensePlansService.findOne(id);
  }

  @Patch(':id')
  @Permissions('update:license-plans')
  update(@Param('id') id: string, @Body() dto: UpdateLicensePlanDto, @Req() req: { user: { id: string } }) {
    return this.licensePlansService.update(id, dto, req.user.id);
  }

  @Delete(':id')
  @Permissions('delete:license-plans')
  remove(@Param('id') id: string) {
    return this.licensePlansService.remove(id);
  }
}