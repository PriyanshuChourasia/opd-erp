import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentStatusDto } from './dto/update-appointment-status.dto';
import { FindAppointmentsQueryDto } from './dto/find-appointments-query.dto';

@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Post()
  create(@Body() dto: CreateAppointmentDto) {
    return this.appointmentsService.create(dto);
  }

  @Get()
  findAll(@Query() query: FindAppointmentsQueryDto) {
    return this.appointmentsService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.appointmentsService.findOne(id);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateAppointmentStatusDto) {
    return this.appointmentsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.appointmentsService.remove(id);
  }
}
