import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { FindRolesQueryDto } from './dto/find-roles-query.dto';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Post()
  @Permissions('create:roles')
  create(@Body() dto: CreateRoleDto, @Req() req: { user: { id: string } }) {
    return this.rolesService.create(dto, req.user.id);
  }

  @Get()
  @Permissions('read:roles')
  findAll(@Query() query: FindRolesQueryDto) {
    return this.rolesService.findAll(query);
  }

  @Get(':id')
  @Permissions('read:roles')
  findOne(@Param('id') id: string) {
    return this.rolesService.findOne(id);
  }

  @Patch(':id')
  @Permissions('update:roles')
  update(@Param('id') id: string, @Body() dto: UpdateRoleDto, @Req() req: { user: { id: string } }) {
    return this.rolesService.update(id, dto, req.user.id);
  }

  @Delete(':id')
  @Permissions('delete:roles')
  remove(@Param('id') id: string) {
    return this.rolesService.remove(id);
  }
}
