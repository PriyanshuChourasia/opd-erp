import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantContextGuard } from '../tenant/tenant-context.guard';
import { TenantContextService, AuthUser } from '../tenant/tenant-context.service';
import { RequireScope } from '../tenant/decorators/require-scope.decorator';
import { TenantScope } from '../tenant/scope.enum';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { SlotGeneratorService } from '../common/services/slot-generator.service';
import { EmployeeSchedulesService } from './employee-schedules.service';
import { CreateEmployeeScheduleDto } from './dto/create-employee-schedule.dto';
import { UpdateEmployeeScheduleDto } from './dto/update-employee-schedule.dto';
import { FindEmployeeSchedulesQueryDto } from './dto/find-employee-schedules-query.dto';

@UseGuards(JwtAuthGuard, TenantContextGuard, PermissionsGuard)
@RequireScope(TenantScope.TENANT)
@Controller('employee-schedules')
export class EmployeeSchedulesController {
  constructor(
    private readonly employeeSchedulesService: EmployeeSchedulesService,
    private readonly slotGenerator: SlotGeneratorService,
    private readonly tenantContext: TenantContextService,
  ) {}

  @Post()
  @Permissions('create:employee-schedules')
  create(@Body() dto: CreateEmployeeScheduleDto, @Req() req: { user: AuthUser }) {
    return this.employeeSchedulesService.create(dto, this.tenantContext.requireOrganization(req));
  }

  @Get()
  @Permissions('read:employee-schedules')
  findAll(@Query() query: FindEmployeeSchedulesQueryDto, @Req() req: { user: AuthUser }) {
    return this.employeeSchedulesService.findAll(query, this.tenantContext.requireOrganization(req));
  }

  @Get('by-employee')
  @Permissions('read:employee-schedules')
  findByEmployee(
    @Query('employeeSchedulableType') employeeSchedulableType: string,
    @Query('employeeSchedulableId') employeeSchedulableId: string,
  ) {
    return this.employeeSchedulesService.findByEmployee(employeeSchedulableType, employeeSchedulableId);
  }

  @Get('slots')
  @Permissions('read:employee-schedules')
  getSlots(
    @Query('employeeSchedulableType') employeeSchedulableType: string,
    @Query('employeeSchedulableId') employeeSchedulableId: string,
    @Query('date') date: string,
  ) {
    return this.slotGenerator.generateSlots(employeeSchedulableType, employeeSchedulableId, date);
  }

  @Get(':id')
  @Permissions('read:employee-schedules')
  findOne(@Param('id') id: string, @Req() req: { user: AuthUser }) {
    return this.employeeSchedulesService.findOne(id, this.tenantContext.requireOrganization(req));
  }

  @Patch(':id')
  @Permissions('update:employee-schedules')
  update(@Param('id') id: string, @Body() dto: UpdateEmployeeScheduleDto, @Req() req: { user: AuthUser }) {
    return this.employeeSchedulesService.update(id, dto, this.tenantContext.requireOrganization(req));
  }

  @Delete(':id')
  @Permissions('delete:employee-schedules')
  remove(@Param('id') id: string, @Req() req: { user: AuthUser }) {
    return this.employeeSchedulesService.remove(id, this.tenantContext.requireOrganization(req));
  }
}
