import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { LabOrdersService } from './lab-orders.service';
import { CreateLabOrderDto } from './dto/create-lab-order.dto';
import { UpdateLabOrderDto } from './dto/update-lab-order.dto';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('lab-orders')
export class LabOrdersController {
  constructor(private readonly service: LabOrdersService) {}

  @Permissions('create:lab-orders')
  @Post()
  create(@Body() dto: CreateLabOrderDto, @Req() req: { user: { id: string } }) {
    return this.service.create(dto, req.user.id);
  }

  @Permissions('read:lab-orders')
  @Get()
  findAll(
    @Query('patientId') patientId?: string,
    @Query('status') status?: string,
    @Req() req: { user: { id: string; userableType?: string; userableId?: string } } = {} as any,
  ) {
    // Patient portal: force scoping to own lab orders
    if (req.user?.userableType === 'Patient' && req.user?.userableId) {
      patientId = req.user.userableId;
    }
    return this.service.findAll({ patientId, status });
  }

  @Permissions('read:lab-orders')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Permissions('update:lab-orders')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateLabOrderDto, @Req() req: { user: { id: string } }) {
    return this.service.update(id, dto, req.user.id);
  }

  @Permissions('delete:lab-orders')
  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: { user: { id: string } }) {
    return this.service.remove(id, req.user.id);
  }
}
