import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantContextGuard } from '../tenant/tenant-context.guard';
import { TenantContextService, AuthUser } from '../tenant/tenant-context.service';
import { RequireScope } from '../tenant/decorators/require-scope.decorator';
import { TenantScope } from '../tenant/scope.enum';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { ShiftsService } from './shifts.service';
import { CreateShiftDto } from './dto/create-shift.dto';
import { UpdateShiftDto } from './dto/update-shift.dto';
import { FindShiftsQueryDto } from './dto/find-shifts-query.dto';

@UseGuards(JwtAuthGuard, TenantContextGuard, PermissionsGuard)
@RequireScope(TenantScope.TENANT)
@Controller('shifts')
export class ShiftsController {
  constructor(
    private readonly shiftsService: ShiftsService,
    private readonly tenantContext: TenantContextService,
  ) {}

  @Permissions('create:shifts')
  @Post()
  create(@Body() dto: CreateShiftDto, @Req() req: { user: AuthUser }) {
    return this.shiftsService.create(dto, req.user.id, this.tenantContext.requireOrganization(req));
  }

  @Permissions('read:shifts')
  @Get()
  findAll(@Query() query: FindShiftsQueryDto, @Req() req: { user: AuthUser }) {
    return this.shiftsService.findAll(query, this.tenantContext.requireOrganization(req));
  }

  @Permissions('read:shifts')
  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: { user: AuthUser }) {
    return this.shiftsService.findOne(id, this.tenantContext.requireOrganization(req));
  }

  @Permissions('update:shifts')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateShiftDto, @Req() req: { user: AuthUser }) {
    return this.shiftsService.update(id, dto, req.user.id, this.tenantContext.requireOrganization(req));
  }

  @Permissions('delete:shifts')
  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: { user: AuthUser }) {
    return this.shiftsService.remove(id, req.user.id, this.tenantContext.requireOrganization(req));
  }
}
