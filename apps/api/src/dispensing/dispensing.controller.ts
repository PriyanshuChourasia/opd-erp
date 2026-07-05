import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { DispensingService } from './dispensing.service';
import { CreateDispensingDto } from './dto/create-dispensing.dto';
import { UpdateDispensingDto } from './dto/update-dispensing.dto';

@Controller('dispensing')
export class DispensingController {
  constructor(private readonly service: DispensingService) {}

  @Post()
  create(@Body() dto: CreateDispensingDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll(@Query('prescriptionId') prescriptionId?: string) {
    return this.service.findAll(prescriptionId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateDispensingDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
