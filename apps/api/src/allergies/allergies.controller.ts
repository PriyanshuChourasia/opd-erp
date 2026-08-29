import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { AllergiesService } from './allergies.service';
import { CreateAllergyDto } from './dto/create-allergy.dto';
import { UpdateAllergyDto } from './dto/update-allergy.dto';
import { FindAllergiesQueryDto } from './dto/find-allergies-query.dto';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('allergies')
export class AllergiesController {
  constructor(private readonly allergiesService: AllergiesService) {}

  @Post()
  @Permissions('create:allergies')
  create(@Body() dto: CreateAllergyDto, @Req() req: { user: { id: string } }) {
    return this.allergiesService.create(dto, req.user.id);
  }

  @Get()
  @Permissions('read:allergies')
  findAll(@Query() query: FindAllergiesQueryDto) {
    return this.allergiesService.findAll(query);
  }

  @Get(':id')
  @Permissions('read:allergies')
  findOne(@Param('id') id: string) {
    return this.allergiesService.findOne(id);
  }

  @Patch(':id')
  @Permissions('update:allergies')
  update(@Param('id') id: string, @Body() dto: UpdateAllergyDto, @Req() req: { user: { id: string } }) {
    return this.allergiesService.update(id, dto, req.user.id);
  }

  @Delete(':id')
  @Permissions('delete:allergies')
  remove(@Param('id') id: string) {
    return this.allergiesService.remove(id);
  }
}
