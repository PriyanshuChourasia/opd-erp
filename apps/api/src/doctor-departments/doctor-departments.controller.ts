import { Body, Controller, Delete, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { DoctorDepartmentsService } from './doctor-departments.service';
import { CreateDoctorDepartmentDto } from './dto/create-doctor-department.dto';
import { FindDoctorDepartmentsQueryDto } from './dto/find-doctor-departments-query.dto';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('doctor-departments')
export class DoctorDepartmentsController {
  constructor(private readonly service: DoctorDepartmentsService) {}

  @Permissions('create:doctors')
  @Post()
  create(@Body() dto: CreateDoctorDepartmentDto, @Req() req: { user: { id: string } }) {
    return this.service.create(dto, req.user.id);
  }

  @Permissions('read:doctors')
  @Get()
  findAll(@Query() query: FindDoctorDepartmentsQueryDto) {
    return this.service.findAll(query);
  }

  @Permissions('update:doctors')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
