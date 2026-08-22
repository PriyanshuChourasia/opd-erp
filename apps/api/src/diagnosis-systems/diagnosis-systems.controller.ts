import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DiagnosisSystemsService } from './diagnosis-systems.service';
import { CreateDiagnosisSystemDto } from './dto/create-diagnosis-system.dto';
import { UpdateDiagnosisSystemDto } from './dto/update-diagnosis-system.dto';
import { FindDiagnosisSystemsQueryDto } from './dto/find-diagnosis-systems-query.dto';

@UseGuards(JwtAuthGuard)
@Controller('diagnosis-systems')
export class DiagnosisSystemsController {
  constructor(private readonly service: DiagnosisSystemsService) {}

  @Post()
  create(@Body() dto: CreateDiagnosisSystemDto, @Req() req: { user: { id: string } }) {
    return this.service.create(dto, req.user.id);
  }

  @Get()
  findAll(@Query() query: FindDiagnosisSystemsQueryDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateDiagnosisSystemDto, @Req() req: { user: { id: string } }) {
    return this.service.update(id, dto, req.user.id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
