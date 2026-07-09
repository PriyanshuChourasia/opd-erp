import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { DoctorsService } from './doctors.service';
import { CreateDoctorDto } from './dto/create-doctor.dto';
import { CreateDoctorWithUserDto } from './dto/create-doctor-with-user.dto';
import { UpdateDoctorDto, UpdateVerificationStatusDto } from './dto/update-doctor.dto';
import { FindDoctorsQueryDto } from './dto/find-doctors-query.dto';

@Controller('doctors')
export class DoctorsController {
  constructor(private readonly doctorsService: DoctorsService) {}

  @Post()
  create(@Body() dto: CreateDoctorDto) {
    return this.doctorsService.create(dto);
  }

  @Post('with-user')
  createWithUser(@Body() dto: CreateDoctorWithUserDto) {
    return this.doctorsService.createWithUser(dto);
  }

  @Get()
  findAll(@Query() query: FindDoctorsQueryDto) {
    return this.doctorsService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.doctorsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateDoctorDto) {
    return this.doctorsService.update(id, dto);
  }

  @Patch(':id/verification')
  updateVerificationStatus(
    @Param('id') id: string,
    @Body() dto: UpdateVerificationStatusDto,
  ) {
    return this.doctorsService.updateVerificationStatus(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.doctorsService.remove(id);
  }
}
