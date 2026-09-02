import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { BillingService } from './billing.service';
import { CreateBillDto } from './dto/create-bill.dto';
import { UpdateBillStatusDto } from './dto/update-bill-status.dto';
import { FindBillsQueryDto } from './dto/find-bills-query.dto';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { CreateRefundDto } from './dto/create-refund.dto';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('billing')
export class BillingController {
  constructor(private readonly service: BillingService) {}

  @Post()
  @Permissions('create:billing')
  create(@Body() dto: CreateBillDto, @Req() req: { user: { id: string } }) {
    return this.service.create(dto, req.user.id);
  }

  @Get()
  @Permissions('read:billing')
  findAll(@Query() query: FindBillsQueryDto, @Req() req: { user: { id: string; userableType?: string; userableId?: string } }) {
    // Patient portal: force scoping to own bills
    if (req.user.userableType === 'Patient' && req.user.userableId) {
      query.patientId = req.user.userableId;
    }
    return this.service.findAll(query);
  }

  @Get(':id')
  @Permissions('read:billing')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id/status')
  @Permissions('update:billing')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateBillStatusDto, @Req() req: { user: { id: string } }) {
    return this.service.update(id, dto, req.user.id);
  }

  @Post(':id/payments')
  @Permissions('create:billing')
  addPayment(@Param('id') id: string, @Body() dto: CreatePaymentDto, @Req() req: { user: { id: string } }) {
    return this.service.addPayment(id, dto, req.user.id);
  }

  @Get(':id/payments')
  @Permissions('read:billing')
  getPayments(@Param('id') id: string) {
    return this.service.getPayments(id);
  }

  @Get(':id/payments/:paymentId/receipt')
  @Permissions('read:billing')
  getReceipt(@Param('id') id: string, @Param('paymentId') paymentId: string) {
    return this.service.getReceipt(id, paymentId);
  }

  @Post(':id/refund')
  @Permissions('refund:billing')
  refund(@Param('id') id: string, @Body() dto: CreateRefundDto, @Req() req: { user: { id: string } }) {
    return this.service.refund(id, dto, req.user.id);
  }

  @Delete(':id')
  @Permissions('delete:billing')
  remove(@Param('id') id: string, @Req() req: { user: { id: string } }) {
    return this.service.remove(id, req.user.id);
  }
}
