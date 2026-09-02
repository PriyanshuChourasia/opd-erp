import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { PrescriptionsService } from './prescriptions.service';
import { CreatePrescriptionDto } from './dto/create-prescription.dto';
import { UpdatePrescriptionDto } from './dto/update-prescription.dto';
import { FindPrescriptionsQueryDto } from './dto/find-prescriptions-query.dto';

interface AuthedRequest {
  user: { userableType?: string | null; userableId?: string | null };
}

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('prescriptions')
export class PrescriptionsController {
  constructor(private readonly service: PrescriptionsService) {}

  @Post()
  @Permissions('create:prescriptions')
  create(@Body() dto: CreatePrescriptionDto, @Req() req: AuthedRequest & { user: { id: string } }) {
    // When the authenticated user is a doctor, always use their own ID
    // so they cannot create prescriptions under another doctor's name.
    if (req.user.userableType === 'Doctor' && req.user.userableId) {
      dto.doctorId = req.user.userableId;
    }
    return this.service.create(dto, req.user.id);
  }

  @Get()
  @Permissions('read:prescriptions')
  findAll(@Query() query: FindPrescriptionsQueryDto, @Req() req: AuthedRequest) {
    // Doctor portal: scope to own prescriptions
    if (req.user.userableType === 'Doctor' && req.user.userableId) {
      return this.service.findAll(query, req.user.userableId);
    }
    // Patient portal: scope to own prescriptions
    if (req.user.userableType === 'Patient' && req.user.userableId) {
      query.patientId = req.user.userableId;
    }
    return this.service.findAll(query);
  }

  @Get(':id')
  @Permissions('read:prescriptions')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Get(':id/history')
  @Permissions('read:prescriptions')
  findHistory(@Param('id') id: string) {
    return this.service.findHistory(id);
  }

  @Patch(':id')
  @Permissions('update:prescriptions')
  update(
    @Param('id') id: string,
    @Body() dto: UpdatePrescriptionDto & { changeReason?: string },
    @Req() req: { user: { id: string } },
  ) {
    const { changeReason, ...prescriptionDto } = dto;
    return this.service.update(id, prescriptionDto, req.user.id, changeReason);
  }

  @Delete(':id')
  @Permissions('delete:prescriptions')
  remove(@Param('id') id: string, @Req() req: { user: { id: string } }) {
    return this.service.remove(id, req.user.id);
  }
}
