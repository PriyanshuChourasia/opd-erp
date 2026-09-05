import { Body, Controller, Delete, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { DoctorSpecializationsService } from './doctor-specializations.service';
import { CreateDoctorSpecializationDto } from './dto/create-doctor-specialization.dto';
import { FindDoctorSpecializationsQueryDto } from './dto/find-doctor-specializations-query.dto';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('doctor-specializations')
export class DoctorSpecializationsController {
  constructor(private readonly service: DoctorSpecializationsService) {}

  @Permissions('create:doctors')
  @Post()
  create(@Body() dto: CreateDoctorSpecializationDto, @Req() req: { user: { id: string } }) {
    return this.service.create(dto, req.user.id);
  }

  @Permissions('read:doctors')
  @Get()
  findAll(@Query() query: FindDoctorSpecializationsQueryDto) {
    return this.service.findAll(query);
  }

  @Permissions('update:doctors')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
