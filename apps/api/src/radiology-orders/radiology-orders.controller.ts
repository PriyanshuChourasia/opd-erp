import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { RadiologyOrdersService } from './radiology-orders.service';
import { CreateRadiologyOrderDto } from './dto/create-radiology-order.dto';
import { UpdateRadiologyOrderDto } from './dto/update-radiology-order.dto';

@Controller('radiology-orders')
export class RadiologyOrdersController {
  constructor(private readonly service: RadiologyOrdersService) {}

  @Post()
  create(@Body() dto: CreateRadiologyOrderDto) {
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
  update(@Param('id') id: string, @Body() dto: UpdateRadiologyOrderDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
