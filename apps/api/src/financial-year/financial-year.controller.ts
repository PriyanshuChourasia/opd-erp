import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { FinancialYearService } from './financial-year.service';
import { CreateFinancialYearDto, UpdateFinancialYearDto } from './dto/financial-year.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('financial-years')
export class FinancialYearController {
  constructor(private readonly service: FinancialYearService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get('active')
  findActive() {
    return this.service.findActive();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateFinancialYearDto, @Req() req: { user: { id: string } }) {
    return this.service.create(dto, req.user.id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateFinancialYearDto, @Req() req: { user: { id: string } }) {
    return this.service.update(id, dto, req.user.id);
  }

  @Patch(':id/activate')
  activate(@Param('id') id: string, @Req() req: { user: { id: string } }) {
    return this.service.activate(id, req.user.id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
