import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PrescriptionsService } from './prescriptions.service';
import { CreatePrescriptionDto } from './dto/create-prescription.dto';
import { UpdatePrescriptionDto } from './dto/update-prescription.dto';
import { FindPrescriptionsQueryDto } from './dto/find-prescriptions-query.dto';

interface AuthedRequest {
  user: { userableType?: string | null; userableId?: string | null };
}

@Controller('prescriptions')
export class PrescriptionsController {
  constructor(private readonly service: PrescriptionsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() dto: CreatePrescriptionDto, @Req() req: AuthedRequest) {
    // When the authenticated user is a doctor, always use their own ID
    // so they cannot create prescriptions under another doctor's name.
    if (req.user.userableType === 'Doctor' && req.user.userableId) {
      dto.doctorId = req.user.userableId;
    }
    return this.service.create(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(@Query() query: FindPrescriptionsQueryDto, @Req() req: AuthedRequest) {
    const requestingDoctorId = req.user.userableType === 'Doctor' ? (req.user.userableId ?? undefined) : undefined;
    return this.service.findAll(query, requestingDoctorId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdatePrescriptionDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
