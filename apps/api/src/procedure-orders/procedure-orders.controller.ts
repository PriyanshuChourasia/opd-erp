import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ProcedureOrdersService } from './procedure-orders.service';
import { CreateProcedureOrderDto } from './dto/create-procedure-order.dto';
import { UpdateProcedureOrderDto } from './dto/update-procedure-order.dto';

@UseGuards(JwtAuthGuard)
@Controller('procedure-orders')
export class ProcedureOrdersController {
  constructor(private readonly service: ProcedureOrdersService) {}

  @Post()
  create(@Body() dto: CreateProcedureOrderDto, @Req() req: { user: { id: string } }) {
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
  update(@Param('id') id: string, @Body() dto: UpdateProcedureOrderDto, @Req() req: { user: { id: string } }) {
    return this.service.update(id, dto, req.user.id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
