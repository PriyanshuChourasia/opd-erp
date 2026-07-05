import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ProcedureOrdersService } from './procedure-orders.service';
import { CreateProcedureOrderDto } from './dto/create-procedure-order.dto';
import { UpdateProcedureOrderDto } from './dto/update-procedure-order.dto';

@Controller('procedure-orders')
export class ProcedureOrdersController {
  constructor(private readonly service: ProcedureOrdersService) {}

  @Post()
  create(@Body() dto: CreateProcedureOrderDto) {
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
  update(@Param('id') id: string, @Body() dto: UpdateProcedureOrderDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
