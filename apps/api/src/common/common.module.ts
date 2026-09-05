import { Global, Module } from '@nestjs/common';
import { ModuleRegistryService } from './services/module-registry.service';
import { ModuleRegistryController } from './module-registry.controller';
import { SlotGeneratorService } from './services/slot-generator.service';
import { CustomModulesService } from './services/custom-module.service';
import { TokenNumberService } from './services/token-number.service';

/**
 * Shared infrastructure module.
 *
 * Provides cross-cutting services (ModuleRegistry, SlotGenerator) that feature
 * modules can inject without each importing CommonModule individually.
 *
 * # SOLID
 * - **Single Responsibility** — each common service does one thing.
 * - **Dependency Inversion** — feature modules depend on common abstractions.
 */
@Global()
@Module({
  controllers: [ModuleRegistryController],
  providers: [ModuleRegistryService, SlotGeneratorService, CustomModulesService, TokenNumberService],
  exports: [ModuleRegistryService, SlotGeneratorService, CustomModulesService, TokenNumberService],
})
export class CommonModule {}
