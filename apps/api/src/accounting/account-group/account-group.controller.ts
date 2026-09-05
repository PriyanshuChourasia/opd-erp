import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { Permissions } from '../../auth/decorators/permissions.decorator';
import { AccountGroupService } from './account-group.service';
import { CreateAccountGroupDto } from './dto/create-account-group.dto';
import { UpdateAccountGroupDto } from './dto/update-account-group.dto';
import { FindAccountGroupsQueryDto } from './dto/find-account-groups-query.dto';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('accounting/groups')
export class AccountGroupController {
  constructor(private readonly service: AccountGroupService) {}

  @Permissions('create:accounting')
  @Post()
  create(@Body() dto: CreateAccountGroupDto, @Req() req: { user: { id: string } }) {
    return this.service.create(dto, req.user.id);
  }

  @Permissions('read:accounting')
  @Get()
  findAll(@Query() query: FindAccountGroupsQueryDto) {
    return this.service.findAll(query);
  }

  @Permissions('read:accounting')
  @Get('tree')
  findTree() {
    return this.service.findTree();
  }

  @Permissions('read:accounting')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Permissions('update:accounting')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateAccountGroupDto, @Req() req: { user: { id: string } }) {
    return this.service.update(id, dto, req.user.id);
  }

  @Permissions('delete:accounting')
  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: { user: { id: string } }) {
    return this.service.remove(id, req.user.id);
  }
}
