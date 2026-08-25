import { Body, Controller, Get, Patch, Req, UseGuards } from '@nestjs/common';
import { OrganisationService } from './organisation.service';
import { UpdateOrganisationDto } from './dto/update-organisation.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('organisation')
export class OrganisationController {
  constructor(private readonly organisationService: OrganisationService) {}

  @Get()
  @Permissions('read:organisation')
  findOne() {
    return this.organisationService.findOne();
  }

  @Patch()
  @Permissions('update:organisation')
  update(@Body() dto: UpdateOrganisationDto, @Req() req: { user: { id: string } }) {
    return this.organisationService.upsert(dto, req.user.id);
  }
}
