import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentStatusDto } from './dto/update-appointment-status.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { FindAppointmentsQueryDto } from './dto/find-appointments-query.dto';
import { CheckSlotQueryDto } from './dto/check-slot-query.dto';
import { CheckoutAppointmentDto } from './dto/checkout-appointment.dto';
import { RescheduleAppointmentDto } from './dto/reschedule-appointment.dto';
import { CreatePaymentDto } from '../billing/dto/create-payment.dto';

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
  findAll(@Query() query: FindAppointmentsQueryDto, @Req() req: { user: { id: string; userableType?: string; userableId?: string } }) {
    // Patient portal: force scoping to own data
    if (req.user.userableType === 'Patient' && req.user.userableId) {
      query.patientId = req.user.userableId;
    }
    return this.appointmentsService.findAll(query);
  }

  @Get('check-slot')
  @Permissions('read:appointments')
  checkSlot(@Query() query: CheckSlotQueryDto) {
    return this.appointmentsService.checkSlotAvailability(query);
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

  @Get(':id/history')
  @Permissions('read:appointments')
  findHistory(@Param('id') id: string) {
    return this.appointmentsService.findHistory(id);
  }

  @Patch(':id/reschedule')
  @Permissions('update:appointments')
  reschedule(@Param('id') id: string, @Body() dto: RescheduleAppointmentDto, @Req() req: { user: { id: string } }) {
    return this.appointmentsService.reschedule(id, dto, req.user.id);
  }

  @Post(':id/payments')
  @Permissions('create:billing')
  addPayment(@Param('id') id: string, @Body() dto: CreatePaymentDto, @Req() req: { user: { id: string } }) {
    return this.appointmentsService.addPayment(id, dto, req.user.id);
  }

  @Get(':id/payments')
  @Permissions('read:billing')
  getPayments(@Param('id') id: string) {
    return this.appointmentsService.getPayments(id);
  }

  @Delete(':id')
  @Permissions('delete:appointments')
  remove(@Param('id') id: string, @Req() req: { user: { id: string } }) {
    return this.appointmentsService.remove(id, req.user.id);
  }
}
