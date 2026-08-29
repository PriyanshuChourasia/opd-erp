import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { ShiftsService } from './shifts.service';
import { CreateShiftDto } from './dto/create-shift.dto';
import { UpdateShiftDto } from './dto/update-shift.dto';
import { FindShiftsQueryDto } from './dto/find-shifts-query.dto';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('shifts')
export class ShiftsController {
  constructor(private readonly shiftsService: ShiftsService) {}

  @Permissions('create:shifts')
  @Post()
  create(@Body() dto: CreateShiftDto, @Req() req: { user: { id: string } }) {
    return this.shiftsService.create(dto, req.user.id);
  }

  @Permissions('read:shifts')
  @Get()
  findAll(@Query() query: FindShiftsQueryDto) {
    return this.shiftsService.findAll(query);
  }

  @Permissions('read:shifts')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.shiftsService.findOne(id);
  }

  @Permissions('update:shifts')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateShiftDto, @Req() req: { user: { id: string } }) {
    return this.shiftsService.update(id, dto, req.user.id);
  }

  @Permissions('delete:shifts')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.shiftsService.remove(id);
  }
}
