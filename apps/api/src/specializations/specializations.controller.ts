import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SpecializationsService } from './specializations.service';
import { CreateSpecializationDto } from './dto/create-specialization.dto';
import { UpdateSpecializationDto } from './dto/update-specialization.dto';
import { FindSpecializationsQueryDto } from './dto/find-specializations-query.dto';

@UseGuards(JwtAuthGuard)
@Controller('specializations')
export class SpecializationsController {
  constructor(private readonly specializationsService: SpecializationsService) {}

  @Post()
  create(@Body() dto: CreateSpecializationDto, @Req() req: { user: { id: string } }) {
    return this.specializationsService.create(dto, req.user.id);
  }

  @Get()
  findAll(@Query() query: FindSpecializationsQueryDto) {
    return this.specializationsService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.specializationsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateSpecializationDto, @Req() req: { user: { id: string } }) {
    return this.specializationsService.update(id, dto, req.user.id);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: { user: { id: string } }) {
    return this.specializationsService.remove(id, req.user.id);
  }
}
