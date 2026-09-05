import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { DesignationsService } from './designations.service';
import { CreateDesignationDto } from './dto/create-designation.dto';
import { UpdateDesignationDto } from './dto/update-designation.dto';
import { FindDesignationsQueryDto } from './dto/find-designations-query.dto';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('designations')
export class DesignationsController {
  constructor(private readonly service: DesignationsService) {}

  @Permissions('create:designations')
  @Post()
  create(@Body() dto: CreateDesignationDto, @Req() req: { user: { id: string } }) {
    return this.service.create(dto, req.user.id);
  }

  @Permissions('read:designations')
  @Get()
  findAll(@Query() query: FindDesignationsQueryDto) {
    return this.service.findAll(query);
  }

  @Permissions('read:designations')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Permissions('update:designations')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateDesignationDto, @Req() req: { user: { id: string } }) {
    return this.service.update(id, dto, req.user.id);
  }

  @Permissions('delete:designations')
  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: { user: { id: string } }) {
    return this.service.remove(id, req.user.id);
  }
}
