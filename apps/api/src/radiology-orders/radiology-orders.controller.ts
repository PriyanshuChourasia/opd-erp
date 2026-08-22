import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RadiologyOrdersService } from './radiology-orders.service';
import { CreateRadiologyOrderDto } from './dto/create-radiology-order.dto';
import { UpdateRadiologyOrderDto } from './dto/update-radiology-order.dto';

@UseGuards(JwtAuthGuard)
@Controller('radiology-orders')
export class RadiologyOrdersController {
  constructor(private readonly service: RadiologyOrdersService) {}

  @Post()
  create(@Body() dto: CreateRadiologyOrderDto, @Req() req: { user: { id: string } }) {
    return this.service.create(dto, req.user.id);
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
  update(@Param('id') id: string, @Body() dto: UpdateRadiologyOrderDto, @Req() req: { user: { id: string } }) {
    return this.service.update(id, dto, req.user.id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
