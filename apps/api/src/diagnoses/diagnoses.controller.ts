import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { DiagnosesService } from './diagnoses.service';
import { CreateDiagnosisDto } from './dto/create-diagnosis.dto';
import { UpdateDiagnosisDto } from './dto/update-diagnosis.dto';
import { FindDiagnosesQueryDto } from './dto/find-diagnoses-query.dto';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('diagnoses')
export class DiagnosesController {
  constructor(private readonly diagnosesService: DiagnosesService) {}

  @Post()
  @Permissions('create:diagnoses')
  create(@Body() dto: CreateDiagnosisDto, @Req() req: { user: { id: string } }) {
    return this.diagnosesService.create(dto, req.user.id);
  }

  @Get()
  @Permissions('read:diagnoses')
  findAll(@Query() query: FindDiagnosesQueryDto) {
    return this.diagnosesService.findAll(query);
  }

  @Get(':id')
  @Permissions('read:diagnoses')
  findOne(@Param('id') id: string) {
    return this.diagnosesService.findOne(id);
  }

  @Patch(':id')
  @Permissions('update:diagnoses')
  update(@Param('id') id: string, @Body() dto: UpdateDiagnosisDto, @Req() req: { user: { id: string } }) {
    return this.diagnosesService.update(id, dto, req.user.id);
  }

  @Delete(':id')
  @Permissions('delete:diagnoses')
  remove(@Param('id') id: string, @Req() req: { user: { id: string } }) {
    return this.diagnosesService.remove(id, req.user.id);
  }
}
