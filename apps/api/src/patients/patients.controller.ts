import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { PatientsService } from './patients.service';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { FindPatientsQueryDto } from './dto/find-patients-query.dto';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('patients')
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  @Post()
  @Permissions('create:patients')
  create(@Body() dto: CreatePatientDto, @Req() req: { user: { id: string } }) {
    return this.patientsService.create(dto, req.user.id);
  }

  @Get()
  @Permissions('read:patients')
  findAll(@Query() query: FindPatientsQueryDto) {
    return this.patientsService.findAll(query);
  }

  @Get(':id')
  @Permissions('read:patients')
  findOne(@Param('id') id: string) {
    return this.patientsService.findOne(id);
  }

  @Patch(':id')
  @Permissions('update:patients')
  update(@Param('id') id: string, @Body() dto: UpdatePatientDto, @Req() req: { user: { id: string } }) {
    return this.patientsService.update(id, dto, req.user.id);
  }

  @Delete(':id')
  @Permissions('delete:patients')
  remove(@Param('id') id: string) {
    return this.patientsService.remove(id);
  }

  @Patch(':id/restore')
  @Permissions('update:patients')
  restore(@Param('id') id: string) {
    return this.patientsService.restore(id);
  }
}
