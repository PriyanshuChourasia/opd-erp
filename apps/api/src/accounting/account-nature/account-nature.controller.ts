import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { Permissions } from '../../auth/decorators/permissions.decorator';
import { AccountNatureService } from './account-nature.service';
import { CreateAccountNatureDto } from './dto/create-account-nature.dto';
import { UpdateAccountNatureDto } from './dto/update-account-nature.dto';
import { FindAccountNaturesQueryDto } from './dto/find-account-natures-query.dto';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('accounting/natures')
export class AccountNatureController {
  constructor(private readonly service: AccountNatureService) {}

  @Permissions('create:accounting')
  @Post()
  create(@Body() dto: CreateAccountNatureDto) {
    return this.service.create(dto);
  }

  @Permissions('read:accounting')
  @Get()
  findAll(@Query() query: FindAccountNaturesQueryDto) {
    return this.service.findAll(query);
  }

  @Permissions('read:accounting')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Permissions('update:accounting')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateAccountNatureDto) {
    return this.service.update(id, dto);
  }

  @Permissions('delete:accounting')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
