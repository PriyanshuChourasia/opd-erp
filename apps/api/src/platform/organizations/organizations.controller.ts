import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { Permissions } from '../../auth/decorators/permissions.decorator';
import { TenantContextGuard } from '../../tenant/tenant-context.guard';
import { RequireScope } from '../../tenant/decorators/require-scope.decorator';
import { TenantScope } from '../../tenant/scope.enum';
import { OrganizationsService } from './organizations.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';

@UseGuards(JwtAuthGuard, TenantContextGuard, PermissionsGuard)
@RequireScope(TenantScope.PLATFORM)
@Controller('organizations')
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Post()
  @Permissions('create:organizations')
  create(@Body() dto: CreateOrganizationDto, @Req() req: { user: { id: string } }) {
    return this.organizationsService.create(dto, req.user.id);
  }

  @Get()
  @Permissions('read:organizations')
  findAll(@Query() query: { page?: number; limit?: number; search?: string }) {
    return this.organizationsService.findAll(query);
  }

  @Get(':id')
  @Permissions('read:organizations')
  findOne(@Param('id') id: string) {
    return this.organizationsService.findOne(id);
  }

  @Patch(':id')
  @Permissions('update:organizations')
  update(@Param('id') id: string, @Body() dto: UpdateOrganizationDto, @Req() req: { user: { id: string } }) {
    return this.organizationsService.update(id, dto, req.user.id);
  }
}