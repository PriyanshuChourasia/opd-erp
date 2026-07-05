import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { ModuleRegistryService } from './services/module-registry.service';

/**
 * Exposes the module registry via HTTP so the frontend (or any client)
 * can discover what features, capabilities, and actions each module provides.
 *
 * # SOLID
 * - **Interface Segregation** — a focused controller with only two endpoints.
 */
@Controller('modules')
export class ModuleRegistryController {
  constructor(private readonly registry: ModuleRegistryService) {}

  @Get()
  getAll() {
    const data = this.registry.getAll();
    return { data, total: data.length };
  }

  @Get(':id')
  getOne(@Param('id') id: string) {
    const data = this.registry.get(id);
    if (!data) throw new NotFoundException(`Module ${id} not found`);
    return { data };
  }
}
