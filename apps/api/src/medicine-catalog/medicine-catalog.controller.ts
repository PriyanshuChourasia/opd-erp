import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { MedicineCatalogService } from './medicine-catalog.service';
import { CreateMedicineDto } from './dto/create-medicine.dto';
import { UpdateMedicineDto } from './dto/update-medicine.dto';
import { FindMedicinesQueryDto } from './dto/find-medicines-query.dto';

@Controller('medicine-catalog')
export class MedicineCatalogController {
  constructor(private readonly service: MedicineCatalogService) {}

  @Post()
  create(@Body() dto: CreateMedicineDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll(@Query() query: FindMedicinesQueryDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateMedicineDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
