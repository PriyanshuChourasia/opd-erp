import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import { DoctorSchedulesService } from './doctor-schedules.service';
import { UpsertDoctorScheduleDto } from './dto/upsert-doctor-schedule.dto';

@Controller('doctor-schedules')
export class DoctorSchedulesController {
  constructor(private readonly doctorSchedulesService: DoctorSchedulesService) {}

  @Post()
  upsert(@Body() dto: UpsertDoctorScheduleDto) {
    return this.doctorSchedulesService.upsert(dto);
  }

  @Get()
  findAllForDoctor(@Query('doctorId') doctorId: string) {
    return this.doctorSchedulesService.findAllForDoctor(doctorId);
  }

  @Get('slots')
  getSlots(@Query('doctorId') doctorId: string, @Query('date') date: string) {
    return this.doctorSchedulesService.getSlots(doctorId, date);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.doctorSchedulesService.remove(id);
  }
}
