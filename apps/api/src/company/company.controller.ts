import { Body, Controller, Get, Patch, Req, UseGuards } from '@nestjs/common';
import { CompanyService } from './company.service';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('company')
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

  @Get()
  @Permissions('read:company')
  findOne() {
    return this.companyService.findOne();
  }

  @Patch()
  @Permissions('update:company')
  update(@Body() dto: UpdateCompanyDto, @Req() req: { user: { id: string } }) {
    return this.companyService.upsert(dto, req.user.id);
  }
}
