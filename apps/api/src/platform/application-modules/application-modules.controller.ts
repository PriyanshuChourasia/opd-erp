import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
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
import { ApplicationModulesService } from './application-modules.service';
import { CreateApplicationModuleDto } from './dto/create-application-module.dto';

@UseGuards(JwtAuthGuard, TenantContextGuard, PermissionsGuard)
@RequireScope(TenantScope.PLATFORM)
@Controller('application-modules')
export class ApplicationModulesController {
  constructor(private readonly applicationModulesService: ApplicationModulesService) {}

  @Post()
  @Permissions('create:application-modules')
  create(@Body() dto: CreateApplicationModuleDto, @Req() req: { user: { id: string } }) {
    return this.applicationModulesService.create(dto, req.user.id);
  }

  @Get()
  @Permissions('read:application-modules')
  findAll(@Query() query: { page?: number; limit?: number }) {
    return this.applicationModulesService.findAll(query);
  }

  @Get(':id')
  @Permissions('read:application-modules')
  findOne(@Param('id') id: string) {
    return this.applicationModulesService.findOne(id);
  }

  @Delete(':id')
  @Permissions('delete:application-modules')
  remove(@Param('id') id: string) {
    return this.applicationModulesService.remove(id);
  }
}