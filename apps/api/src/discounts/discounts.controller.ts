import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { DiscountsService } from './discounts.service';
import { CreateDiscountDto } from './dto/create-discount.dto';
import { UpdateDiscountDto } from './dto/update-discount.dto';
import { FindDiscountsQueryDto } from './dto/find-discounts-query.dto';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('discounts')
export class DiscountsController {
  constructor(private readonly service: DiscountsService) {}

  @Permissions('create:discounts')
  @Post()
  create(@Body() dto: CreateDiscountDto, @Req() req: { user: { id: string } }) {
    return this.service.create(dto, req.user.id);
  }

  @Permissions('read:discounts')
  @Get()
  findAll(@Query() query: FindDiscountsQueryDto) {
    return this.service.findAll(query);
  }

  @Permissions('read:discounts')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Permissions('update:discounts')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateDiscountDto, @Req() req: { user: { id: string } }) {
    return this.service.update(id, dto, req.user.id);
  }

  @Permissions('delete:discounts')
  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: { user: { id: string } }) {
    return this.service.remove(id, req.user.id);
  }
}
