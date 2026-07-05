import { Global, Module } from '@nestjs/common';
import { ModuleRegistryService } from './services/module-registry.service';
import { ModuleRegistryController } from './module-registry.controller';
import { SlotGeneratorService } from './services/slot-generator.service';

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
  providers: [ModuleRegistryService, SlotGeneratorService],
  exports: [ModuleRegistryService, SlotGeneratorService],
})
export class CommonModule {}
