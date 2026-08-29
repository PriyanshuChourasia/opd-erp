import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { ModuleRegistryService } from './services/module-registry.service';
import { CustomModulesService } from './services/custom-module.service';
import { UpsertModuleDto, toRegistry } from './dto/upsert-module.dto';

/**
 * Exposes the module registry via HTTP so the frontend (or any client)
 * can discover what features, capabilities, and actions each module provides.
 *
 * Developer module management: create / edit / delete custom modules
 * (persisted in the database, registered at boot).
 *
 * # SOLID
 * - **Interface Segregation** — focused controller endpoints.
 */
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('modules')
export class ModuleRegistryController {
  constructor(
    private readonly registry: ModuleRegistryService,
    private readonly customModules: CustomModulesService,
  ) {}

  @Get()
  @Permissions('read:developer')
  getAll() {
    const data = this.registry.getAll();
    return { data, total: data.length };
  }

  @Post()
  @Permissions('create:developer')
  create(@Body() dto: UpsertModuleDto) {
    return this.customModules.create(toRegistry(dto));
  }

  @Patch(':id')
  @Permissions('update:developer')
  update(@Param('id') id: string, @Body() dto: UpsertModuleDto) {
    return this.customModules.update(id, toRegistry({ ...dto, id }));
  }

  @Delete(':id')
  @Permissions('delete:developer')
  remove(@Param('id') id: string) {
    return this.customModules.remove(id);
  }

  @Get(':id')
  @Permissions('read:developer')
  getOne(@Param('id') id: string) {
    const data = this.registry.get(id);
    if (!data) throw new NotFoundException(`Module ${id} not found`);
    return { data };
  }
}
