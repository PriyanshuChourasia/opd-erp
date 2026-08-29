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
import { DoctorsService } from './doctors.service';
import { CreateDoctorDto } from './dto/create-doctor.dto';
import { CreateDoctorWithUserDto } from './dto/create-doctor-with-user.dto';
import { UpdateDoctorDto } from './dto/update-doctor.dto';
import { UpdateDoctorWithUserDto } from './dto/update-doctor-with-user.dto';
import { FindDoctorsQueryDto } from './dto/find-doctors-query.dto';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('doctors')
export class DoctorsController {
  constructor(private readonly doctorsService: DoctorsService) {}

  @Post()
  @Permissions('create:doctors')
  create(@Body() dto: CreateDoctorDto, @Req() req: { user: { id: string } }) {
    return this.doctorsService.create(dto, req.user.id);
  }

  @Post('with-user')
  @Permissions('create:doctors', 'create:users')
  createWithUser(@Body() dto: CreateDoctorWithUserDto) {
    return this.doctorsService.createWithUser(dto);
  }

  @Get()
  @Permissions('read:doctors')
  findAll(@Query() query: FindDoctorsQueryDto) {
    return this.doctorsService.findAll(query);
  }

  @Get(':id')
  @Permissions('read:doctors')
  findOne(@Param('id') id: string) {
    return this.doctorsService.findOne(id);
  }

  @Patch(':id')
  @Permissions('update:doctors')
  update(@Param('id') id: string, @Body() dto: UpdateDoctorDto, @Req() req: { user: { id: string } }) {
    return this.doctorsService.update(id, dto, req.user.id);
  }

  @Get(':id/user')
  @Permissions('read:doctors')
  findLinkedUser(@Param('id') id: string) {
    return this.doctorsService.findLinkedUser(id);
  }

  @Patch(':id/with-user')
  @Permissions('update:doctors')
  updateWithUser(@Param('id') id: string, @Body() dto: UpdateDoctorWithUserDto) {
    return this.doctorsService.updateWithUser(id, dto);
  }

  @Patch(':id/restore')
  @Permissions('update:doctors')
  restore(@Param('id') id: string) {
    return this.doctorsService.restore(id);
  }

  @Delete(':id')
  @Permissions('delete:doctors')
  remove(@Param('id') id: string) {
    return this.doctorsService.remove(id);
  }
}
