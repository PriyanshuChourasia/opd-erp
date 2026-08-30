import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { MedicineGroupsService } from './medicine-groups.service';
import { CreateMedicineGroupDto } from './dto/create-medicine-group.dto';
import { UpdateMedicineGroupDto } from './dto/update-medicine-group.dto';
import { FindMedicineGroupsQueryDto } from './dto/find-medicine-groups-query.dto';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('medicine-groups')
export class MedicineGroupsController {
  constructor(private readonly service: MedicineGroupsService) {}

  @Permissions('create:medicine-groups')
  @Post()
  create(@Body() dto: CreateMedicineGroupDto, @Req() req: { user: { id: string } }) {
    return this.service.create(dto, req.user.id);
  }

  @Permissions('read:medicine-groups')
  @Get()
  findAll(@Query() query: FindMedicineGroupsQueryDto) {
    return this.service.findAll(query);
  }

  @Permissions('read:medicine-groups')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Permissions('update:medicine-groups')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateMedicineGroupDto, @Req() req: { user: { id: string } }) {
    return this.service.update(id, dto, req.user.id);
  }

  @Permissions('delete:medicine-groups')
  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: { user: { id: string } }) {
    return this.service.remove(id, req.user.id);
  }
}
