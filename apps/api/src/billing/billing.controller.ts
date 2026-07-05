import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { BillingService } from './billing.service';
import { CreateBillDto } from './dto/create-bill.dto';
import { UpdateBillStatusDto } from './dto/update-bill-status.dto';

@Controller('billing')
export class BillingController {
  constructor(private readonly service: BillingService) {}

  @Post()
  create(@Body() dto: CreateBillDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll(@Query('patientId') patientId?: string) {
    return this.service.findAll(patientId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateBillStatusDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
