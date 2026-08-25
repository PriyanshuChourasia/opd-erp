import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { PrescriptionTemplateService } from './prescription-template.service';
import { CreatePrescriptionTemplateDto, UpdatePrescriptionTemplateDto } from './dto/prescription-template.dto';
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
}
