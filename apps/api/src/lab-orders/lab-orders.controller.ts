import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { LabOrdersService } from './lab-orders.service';
import { CreateLabOrderDto } from './dto/create-lab-order.dto';
import { UpdateLabOrderDto } from './dto/update-lab-order.dto';

@Controller('lab-orders')
export class LabOrdersController {
  constructor(private readonly service: LabOrdersService) {}

  @Post()
  create(@Body() dto: CreateLabOrderDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll(@Query('patientId') patientId?: string, @Query('status') status?: string) {
    return this.service.findAll({ patientId, status });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateLabOrderDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
