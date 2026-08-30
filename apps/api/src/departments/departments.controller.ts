import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { DepartmentsService } from './departments.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { FindDepartmentsQueryDto } from './dto/find-departments-query.dto';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('departments')
export class DepartmentsController {
  constructor(private readonly service: DepartmentsService) {}

  @Permissions('create:departments')
  @Post()
  create(@Body() dto: CreateDepartmentDto, @Req() req: { user: { id: string } }) {
    return this.service.create(dto, req.user.id);
  }

  @Permissions('read:departments')
  @Get()
  findAll(@Query() query: FindDepartmentsQueryDto) {
    return this.service.findAll(query);
  }

  @Permissions('read:departments')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Permissions('update:departments')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateDepartmentDto, @Req() req: { user: { id: string } }) {
    return this.service.update(id, dto, req.user.id);
  }

  @Permissions('delete:departments')
  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: { user: { id: string } }) {
    return this.service.remove(id, req.user.id);
  }
}
