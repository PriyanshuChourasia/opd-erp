import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AllergiesService } from './allergies.service';
import { CreateAllergyDto } from './dto/create-allergy.dto';
import { UpdateAllergyDto } from './dto/update-allergy.dto';
import { FindAllergiesQueryDto } from './dto/find-allergies-query.dto';

@UseGuards(JwtAuthGuard)
@Controller('allergies')
export class AllergiesController {
  constructor(private readonly allergiesService: AllergiesService) {}

  @Post()
  create(@Body() dto: CreateAllergyDto) {
    return this.allergiesService.create(dto);
  }

  @Get()
  findAll(@Query() query: FindAllergiesQueryDto) {
    return this.allergiesService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.allergiesService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateAllergyDto) {
    return this.allergiesService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.allergiesService.remove(id);
  }
}
