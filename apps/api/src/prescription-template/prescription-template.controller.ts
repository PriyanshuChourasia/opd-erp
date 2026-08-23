import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { PrescriptionTemplateService } from './prescription-template.service';
import { CreatePrescriptionTemplateDto, UpdatePrescriptionTemplateDto } from './dto/prescription-template.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('prescription-templates')
export class PrescriptionTemplateController {
  constructor(private readonly service: PrescriptionTemplateService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get('default')
  findDefault() {
    return this.service.findDefault();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  create(@Body() dto: CreatePrescriptionTemplateDto, @Req() req: { user: { id: string } }) {
    return this.service.create(dto, req.user.id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdatePrescriptionTemplateDto, @Req() req: { user: { id: string } }) {
    return this.service.update(id, dto, req.user.id);
  }

  @Patch(':id/default')
  setDefault(@Param('id') id: string, @Req() req: { user: { id: string } }) {
    return this.service.setDefault(id, req.user.id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
