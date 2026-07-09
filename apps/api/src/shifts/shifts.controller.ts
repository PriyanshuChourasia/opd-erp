import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ShiftsService } from './shifts.service';
import { CreateShiftDto } from './dto/create-shift.dto';
import { UpdateShiftDto } from './dto/update-shift.dto';
import { FindShiftsQueryDto } from './dto/find-shifts-query.dto';

@UseGuards(JwtAuthGuard)
@Controller('shifts')
export class ShiftsController {
  constructor(private readonly shiftsService: ShiftsService) {}

  @Post()
  create(@Body() dto: CreateShiftDto) {
    return this.shiftsService.create(dto);
  }

  @Get()
  findAll(@Query() query: FindShiftsQueryDto) {
    return this.shiftsService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.shiftsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateShiftDto) {
    return this.shiftsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.shiftsService.remove(id);
  }
}
