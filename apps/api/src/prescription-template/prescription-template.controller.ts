import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { PrescriptionTemplateService } from './prescription-template.service';
import { CreatePrescriptionTemplateDto, UpdatePrescriptionTemplateDto, AssignDoctorDto } from './dto/prescription-template.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('prescription-templates')
export class PrescriptionTemplateController {
  constructor(private readonly service: PrescriptionTemplateService) {}

  @Get()
  @Permissions('read:prescription-templates')
  findAll() {
    return this.service.findAll();
  }

  @Get('default')
  @Permissions('read:prescription-templates')
  findDefault() {
    return this.service.findDefault();
  }

  // Must be registered before ':id' — otherwise ':id' would swallow
  // 'for-doctor' as a literal template id.
  @Get('for-doctor/:doctorId')
  @Permissions('read:prescription-templates')
  findForDoctor(@Param('doctorId') doctorId: string) {
    return this.service.findForDoctor(doctorId);
  }

  @Get(':id')
  @Permissions('read:prescription-templates')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @Permissions('create:prescription-templates')
  create(@Body() dto: CreatePrescriptionTemplateDto, @Req() req: { user: { id: string } }) {
    return this.service.create(dto, req.user.id);
  }

  @Patch(':id')
  @Permissions('update:prescription-templates')
  update(@Param('id') id: string, @Body() dto: UpdatePrescriptionTemplateDto, @Req() req: { user: { id: string } }) {
    return this.service.update(id, dto, req.user.id);
  }

  @Patch(':id/default')
  @Permissions('update:prescription-templates')
  setDefault(@Param('id') id: string, @Req() req: { user: { id: string } }) {
    return this.service.setDefault(id, req.user.id);
  }

  @Delete(':id')
  @Permissions('delete:prescription-templates')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  @Patch(':id/assign-doctor')
  @Permissions('update:prescription-templates')
  assignDoctor(@Param('id') id: string, @Body() dto: AssignDoctorDto, @Req() req: { user: { id: string } }) {
    return this.service.assignToDoctor(id, dto.doctorId, req.user.id);
  }

  @Patch(':id/unassign-doctor')
  @Permissions('update:prescription-templates')
  unassignDoctor(@Param('id') id: string, @Req() req: { user: { id: string } }) {
    return this.service.unassignFromDoctor(id, req.user.id);
  }
}
