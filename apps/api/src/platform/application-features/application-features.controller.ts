import { Body, Controller, Delete, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { Permissions } from '../../auth/decorators/permissions.decorator';
import { TenantContextGuard } from '../../tenant/tenant-context.guard';
import { RequireScope } from '../../tenant/decorators/require-scope.decorator';
import { TenantScope } from '../../tenant/scope.enum';
import { ApplicationFeaturesService } from './application-features.service';

@UseGuards(JwtAuthGuard, TenantContextGuard, PermissionsGuard)
@RequireScope(TenantScope.PLATFORM)
@Controller('application-features')
export class ApplicationFeaturesController {
  constructor(private readonly applicationFeaturesService: ApplicationFeaturesService) {}

  @Post()
  @Permissions('create:application-features')
  create(
    @Body() dto: { code: string; moduleId: string; name: string; description?: string },
    @Req() req: { user: { id: string } },
  ) {
    return this.applicationFeaturesService.create(dto, req.user.id);
  }

  @Get()
  @Permissions('read:application-features')
  findAll(@Query() query: { moduleId?: string }) {
    return this.applicationFeaturesService.findAll(query);
  }

  @Get(':id')
  @Permissions('read:application-features')
  findOne(@Param('id') id: string) {
    return this.applicationFeaturesService.findOne(id);
  }

  @Delete(':id')
  @Permissions('delete:application-features')
  remove(@Param('id') id: string) {
    return this.applicationFeaturesService.remove(id);
  }
}