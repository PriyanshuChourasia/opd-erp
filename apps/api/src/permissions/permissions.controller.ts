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
import { PermissionsService } from './permissions.service';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { FindPermissionsQueryDto } from './dto/find-permissions-query.dto';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('permissions')
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Post()
  @Permissions('create:permissions')
  create(@Body() dto: CreatePermissionDto, @Req() req: { user: { id: string } }) {
    return this.permissionsService.create(dto, req.user.id);
  }

  @Get()
  @Permissions('read:permissions')
  findAll(@Query() query: FindPermissionsQueryDto) {
    return this.permissionsService.findAll(query);
  }

  @Get(':id')
  @Permissions('read:permissions')
  findOne(@Param('id') id: string) {
    return this.permissionsService.findOne(id);
  }

  @Patch(':id')
  @Permissions('update:permissions')
  update(@Param('id') id: string, @Body() dto: UpdatePermissionDto, @Req() req: { user: { id: string } }) {
    return this.permissionsService.update(id, dto, req.user.id);
  }

  @Delete(':id')
  @Permissions('delete:permissions')
  remove(@Param('id') id: string) {
    return this.permissionsService.remove(id);
  }
}
