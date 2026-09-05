import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { RadiologyOrdersService } from './radiology-orders.service';
import { CreateRadiologyOrderDto } from './dto/create-radiology-order.dto';
import { UpdateRadiologyOrderDto } from './dto/update-radiology-order.dto';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('radiology-orders')
export class RadiologyOrdersController {
  constructor(private readonly service: RadiologyOrdersService) {}

  @Permissions('create:radiology-orders')
  @Post()
  create(@Body() dto: CreateRadiologyOrderDto, @Req() req: { user: { id: string } }) {
    return this.service.create(dto, req.user.id);
  }

  @Permissions('read:radiology-orders')
  @Get()
  findAll(@Query('patientId') patientId?: string, @Query('status') status?: string) {
    return this.service.findAll({ patientId, status });
  }

  @Permissions('read:radiology-orders')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Permissions('update:radiology-orders')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateRadiologyOrderDto, @Req() req: { user: { id: string } }) {
    return this.service.update(id, dto, req.user.id);
  }

  @Permissions('delete:radiology-orders')
  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: { user: { id: string } }) {
    return this.service.remove(id, req.user.id);
  }
}
