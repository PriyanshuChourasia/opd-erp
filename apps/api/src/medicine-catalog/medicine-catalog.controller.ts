import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { MedicineCatalogService } from './medicine-catalog.service';
import { CreateMedicineDto } from './dto/create-medicine.dto';
import { UpdateMedicineDto } from './dto/update-medicine.dto';
import { FindMedicinesQueryDto } from './dto/find-medicines-query.dto';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('medicine-catalog')
export class MedicineCatalogController {
  constructor(private readonly service: MedicineCatalogService) {}

  @Permissions('create:medicine-catalog')
  @Post()
  create(@Body() dto: CreateMedicineDto, @Req() req: { user: { id: string } }) {
    return this.service.create(dto, req.user.id);
  }

  @Permissions('read:medicine-catalog')
  @Get()
  findAll(@Query() query: FindMedicinesQueryDto) {
    return this.service.findAll(query);
  }

  @Permissions('read:medicine-catalog')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Permissions('update:medicine-catalog')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateMedicineDto, @Req() req: { user: { id: string } }) {
    return this.service.update(id, dto, req.user.id);
  }

  @Permissions('delete:medicine-catalog')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
