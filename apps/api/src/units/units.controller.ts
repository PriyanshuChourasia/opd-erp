import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { UnitsService } from './units.service';
import { CreateUnitDto } from './dto/create-unit.dto';
import { UpdateUnitDto } from './dto/update-unit.dto';
import { FindUnitsQueryDto } from './dto/find-units-query.dto';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('units')
export class UnitsController {
  constructor(private readonly service: UnitsService) {}

  @Permissions('create:units')
  @Post()
  create(@Body() dto: CreateUnitDto, @Req() req: { user: { id: string } }) {
    return this.service.create(dto, req.user.id);
  }

  @Permissions('read:units')
  @Get()
  findAll(@Query() query: FindUnitsQueryDto) {
    return this.service.findAll(query);
  }

  @Permissions('read:units')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Permissions('update:units')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateUnitDto, @Req() req: { user: { id: string } }) {
    return this.service.update(id, dto, req.user.id);
  }

  @Permissions('delete:units')
  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: { user: { id: string } }) {
    return this.service.remove(id, req.user.id);
  }
}
