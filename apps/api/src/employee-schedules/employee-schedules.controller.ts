import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { SlotGeneratorService } from '../common/services/slot-generator.service';
import { EmployeeSchedulesService } from './employee-schedules.service';
import { CreateEmployeeScheduleDto } from './dto/create-employee-schedule.dto';
import { UpdateEmployeeScheduleDto } from './dto/update-employee-schedule.dto';
import { FindEmployeeSchedulesQueryDto } from './dto/find-employee-schedules-query.dto';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('employee-schedules')
export class EmployeeSchedulesController {
  constructor(
    private readonly employeeSchedulesService: EmployeeSchedulesService,
    private readonly slotGenerator: SlotGeneratorService,
  ) {}

  @Post()
  @Permissions('create:employee-schedules')
  create(@Body() dto: CreateEmployeeScheduleDto) {
    return this.employeeSchedulesService.create(dto);
  }

  @Get()
  @Permissions('read:employee-schedules')
  findAll(@Query() query: FindEmployeeSchedulesQueryDto) {
    return this.employeeSchedulesService.findAll(query);
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
  findOne(@Param('id') id: string) {
    return this.employeeSchedulesService.findOne(id);
  }

  @Patch(':id')
  @Permissions('update:employee-schedules')
  update(@Param('id') id: string, @Body() dto: UpdateEmployeeScheduleDto) {
    return this.employeeSchedulesService.update(id, dto);
  }

  @Delete(':id')
  @Permissions('delete:employee-schedules')
  remove(@Param('id') id: string) {
    return this.employeeSchedulesService.remove(id);
  }
}
