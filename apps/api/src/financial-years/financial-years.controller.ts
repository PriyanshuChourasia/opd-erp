import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { FinancialYearsService } from './financial-years.service';
import { CreateFinancialYearDto } from './dto/create-financial-year.dto';
import { UpdateFinancialYearDto } from './dto/update-financial-year.dto';
import { FindFinancialYearsQueryDto } from './dto/find-financial-years-query.dto';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('financial-years')
export class FinancialYearsController {
  constructor(private readonly service: FinancialYearsService) {}

  @Permissions('create:financial-years')
  @Post()
  create(@Body() dto: CreateFinancialYearDto, @Req() req: { user: { id: string } }) {
    return this.service.create(dto, req.user.id);
  }

  @Permissions('read:financial-years')
  @Get()
  findAll(@Query() query: FindFinancialYearsQueryDto) {
    return this.service.findAll(query);
  }

  @Permissions('read:financial-years')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Permissions('update:financial-years')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateFinancialYearDto, @Req() req: { user: { id: string } }) {
    return this.service.update(id, dto, req.user.id);
  }

  @Permissions('delete:financial-years')
  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: { user: { id: string } }) {
    return this.service.remove(id, req.user.id);
  }
}
