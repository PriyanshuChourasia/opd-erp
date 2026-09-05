import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { DispensingService } from './dispensing.service';
import { CreateDispensingDto } from './dto/create-dispensing.dto';
import { UpdateDispensingDto } from './dto/update-dispensing.dto';
import { FindDispensingQueryDto } from './dto/find-dispensing-query.dto';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('dispensing')
export class DispensingController {
  constructor(private readonly service: DispensingService) {}

  @Permissions('create:dispensing')
  @Post()
  create(@Body() dto: CreateDispensingDto, @Req() req: { user: { id: string } }) {
    return this.service.create(dto, req.user.id);
  }

  @Permissions('read:dispensing')
  @Get()
  findAll(@Query() query: FindDispensingQueryDto) {
    return this.service.findAll(query);
  }

  @Permissions('read:dispensing')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Permissions('update:dispensing')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateDispensingDto, @Req() req: { user: { id: string } }) {
    return this.service.update(id, dto, req.user.id);
  }

  @Permissions('delete:dispensing')
  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: { user: { id: string } }) {
    return this.service.remove(id, req.user.id);
  }
}
