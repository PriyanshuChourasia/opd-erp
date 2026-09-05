import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { EmployeeScheduleExceptionsService } from './employee-schedule-exceptions.service';
import { CreateEmployeeScheduleExceptionDto } from './dto/create-employee-schedule-exception.dto';
import { UpdateEmployeeScheduleExceptionDto } from './dto/update-employee-schedule-exception.dto';
import { FindEmployeeScheduleExceptionsQueryDto } from './dto/find-employee-schedule-exceptions-query.dto';

/**
 * One-off / date-specific schedule exceptions. Route prefix deliberately NOT
 * nested under employee-schedules to avoid the existing @Get(':id') route
 * swallowing it. Permissions reuse the employee-schedules resource — managing
 * a doctor's exceptions is the same capability as managing their schedule.
 */
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('employee-schedule-exceptions')
export class EmployeeScheduleExceptionsController {
  constructor(private readonly exceptionsService: EmployeeScheduleExceptionsService) {}

  @Post()
  @Permissions('create:employee-schedules')
  create(@Body() dto: CreateEmployeeScheduleExceptionDto, @Req() req: { user: { id: string } }) {
    return this.exceptionsService.create(dto, req.user.id);
  }

  @Get()
  @Permissions('read:employee-schedules')
  findAll(@Query() query: FindEmployeeScheduleExceptionsQueryDto) {
    return this.exceptionsService.findAll(query);
  }

  @Get(':id')
  @Permissions('read:employee-schedules')
  findOne(@Param('id') id: string) {
    return this.exceptionsService.findOne(id);
  }

  @Patch(':id')
  @Permissions('update:employee-schedules')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateEmployeeScheduleExceptionDto,
    @Req() req: { user: { id: string } },
  ) {
    return this.exceptionsService.update(id, dto, req.user.id);
  }

  @Delete(':id')
  @Permissions('delete:employee-schedules')
  remove(@Param('id') id: string, @Req() req: { user: { id: string } }) {
    return this.exceptionsService.remove(id, req.user.id);
  }
}
