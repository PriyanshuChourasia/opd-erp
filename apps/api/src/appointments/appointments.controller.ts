import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentStatusDto } from './dto/update-appointment-status.dto';
import { FindAppointmentsQueryDto } from './dto/find-appointments-query.dto';
import { CheckoutAppointmentDto } from './dto/checkout-appointment.dto';

@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() dto: CreateAppointmentDto, @Req() req: { user: { id: string } }) {
    return this.appointmentsService.create(dto, req.user.id);
  }

  @Get()
  findAll(@Query() query: FindAppointmentsQueryDto) {
    return this.appointmentsService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.appointmentsService.findOne(id);
  }

  @Get(':id/invoice-preview')
  invoicePreview(@Param('id') id: string) {
    return this.appointmentsService.invoicePreview(id);
  }

  @Post(':id/checkout')
  checkout(@Param('id') id: string, @Body() dto: CheckoutAppointmentDto) {
    return this.appointmentsService.checkout(id, dto);
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
