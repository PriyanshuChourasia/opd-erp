import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { ProcedureOrdersService } from './procedure-orders.service';
import { CreateProcedureOrderDto } from './dto/create-procedure-order.dto';
import { UpdateProcedureOrderDto } from './dto/update-procedure-order.dto';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('procedure-orders')
export class ProcedureOrdersController {
  constructor(private readonly service: ProcedureOrdersService) {}

  @Permissions('create:procedure-orders')
  @Post()
  create(@Body() dto: CreateProcedureOrderDto, @Req() req: { user: { id: string } }) {
    return this.service.create(dto, req.user.id);
  }

  @Permissions('read:procedure-orders')
  @Get()
  findAll(@Query('patientId') patientId?: string, @Query('status') status?: string) {
    return this.service.findAll({ patientId, status });
  }

  @Permissions('read:procedure-orders')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Permissions('update:procedure-orders')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateProcedureOrderDto, @Req() req: { user: { id: string } }) {
    return this.service.update(id, dto, req.user.id);
  }

  @Permissions('delete:procedure-orders')
  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: { user: { id: string } }) {
    return this.service.remove(id, req.user.id);
  }
}
