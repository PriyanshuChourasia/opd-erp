import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentStatusDto } from './dto/update-appointment-status.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { FindAppointmentsQueryDto } from './dto/find-appointments-query.dto';
import { CheckoutAppointmentDto } from './dto/checkout-appointment.dto';
import { RescheduleAppointmentDto } from './dto/reschedule-appointment.dto';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Post()
  @Permissions('create:appointments')
  create(@Body() dto: CreateAppointmentDto, @Req() req: { user: { id: string } }) {
    return this.appointmentsService.create(dto, req.user.id);
  }

  @Get()
  @Permissions('read:appointments')
  findAll(@Query() query: FindAppointmentsQueryDto) {
    return this.appointmentsService.findAll(query);
  }

  @Get(':id')
  @Permissions('read:appointments')
  findOne(@Param('id') id: string) {
    return this.appointmentsService.findOne(id);
  }

  @Get(':id/invoice-preview')
  @Permissions('read:appointments')
  invoicePreview(@Param('id') id: string) {
    return this.appointmentsService.invoicePreview(id);
  }

  @Post(':id/checkout')
  @Permissions('update:appointments')
  checkout(@Param('id') id: string, @Body() dto: CheckoutAppointmentDto) {
    return this.appointmentsService.checkout(id, dto);
  }

  @Patch(':id/status')
  @Permissions('update:appointments')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateAppointmentStatusDto, @Req() req: { user: { id: string } }) {
    return this.appointmentsService.update(id, dto, req.user.id);
  }

  @Patch(':id')
  @Permissions('update:appointments')
  update(@Param('id') id: string, @Body() dto: UpdateAppointmentDto, @Req() req: { user: { id: string } }) {
    return this.appointmentsService.updateDetails(id, dto, req.user.id);
  }

  @Patch(':id/reschedule')
  @Permissions('update:appointments')
  reschedule(@Param('id') id: string, @Body() dto: RescheduleAppointmentDto) {
    return this.appointmentsService.reschedule(id, dto);
  }

  @Delete(':id')
  @Permissions('delete:appointments')
  remove(@Param('id') id: string) {
    return this.appointmentsService.remove(id);
  }
}
