import { Body, Controller, Get, Patch, Req, UseGuards } from '@nestjs/common';
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
  update(@Body() dto: UpdateOrganisationDto, @Req() req: { user: { id: string } }) {
    return this.organisationService.upsert(dto, req.user.id);
  }
}
