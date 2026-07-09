import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { OrganisationService } from './organisation.service';
import { UpdateOrganisationDto } from './dto/update-organisation.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('organisation')
export class OrganisationController {
  constructor(private readonly organisationService: OrganisationService) {}

  @Get()
  findOne() {
    return this.organisationService.findOne();
  }

  @Patch()
  update(@Body() dto: UpdateOrganisationDto) {
    return this.organisationService.upsert(dto);
  }
}
