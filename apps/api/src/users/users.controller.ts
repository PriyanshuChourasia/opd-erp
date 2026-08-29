import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { FindUsersQueryDto } from './dto/find-users-query.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Permissions('read:users')
  findAll(@Query() query: FindUsersQueryDto) {
    return this.usersService.findAll(query);
  }

  @Get('roles')
  @Permissions('read:users')
  findAllRoles() {
    return this.usersService.findAllRoles();
  }

  @Get(':id')
  @Permissions('read:users')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Post()
  @Permissions('create:users')
  create(@Body() dto: CreateUserDto, @Req() req: { user: { id: string } }) {
    return this.usersService.create(dto, req.user.id);
  }

  @Patch(':id')
  @Permissions('update:users')
  update(@Param('id') id: string, @Body() dto: UpdateUserDto, @Req() req: { user: { id: string } }) {
    return this.usersService.update(id, dto, req.user.id);
  }

  @Delete(':id')
  @Permissions('delete:users')
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }

  @Patch(':id/restore')
  @Permissions('update:users')
  restore(@Param('id') id: string) {
    return this.usersService.restore(id);
  }
}
