import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SlotGeneratorService } from '../common/services/slot-generator.service';
import { EmployeeSchedulesService } from './employee-schedules.service';
import { CreateEmployeeScheduleDto } from './dto/create-employee-schedule.dto';
import { UpdateEmployeeScheduleDto } from './dto/update-employee-schedule.dto';
import { FindEmployeeSchedulesQueryDto } from './dto/find-employee-schedules-query.dto';

@UseGuards(JwtAuthGuard)
@Controller('employee-schedules')
export class EmployeeSchedulesController {
  constructor(
    private readonly employeeSchedulesService: EmployeeSchedulesService,
    private readonly slotGenerator: SlotGeneratorService,
  ) {}

  @Post()
  create(@Body() dto: CreateEmployeeScheduleDto) {
    return this.employeeSchedulesService.create(dto);
  }

  @Get()
  findAll(@Query() query: FindEmployeeSchedulesQueryDto) {
    return this.employeeSchedulesService.findAll(query);
  }

  @Get('by-employee')
  findByEmployee(
    @Query('employeeSchedulableType') employeeSchedulableType: string,
    @Query('employeeSchedulableId') employeeSchedulableId: string,
  ) {
    return this.employeeSchedulesService.findByEmployee(employeeSchedulableType, employeeSchedulableId);
  }

  @Get('slots')
  getSlots(
    @Query('employeeSchedulableType') employeeSchedulableType: string,
    @Query('employeeSchedulableId') employeeSchedulableId: string,
    @Query('date') date: string,
  ) {
    return this.slotGenerator.generateSlots(employeeSchedulableType, employeeSchedulableId, date);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.employeeSchedulesService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateEmployeeScheduleDto) {
    return this.employeeSchedulesService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.employeeSchedulesService.remove(id);
  }
}
