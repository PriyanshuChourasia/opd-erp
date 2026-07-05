import { Injectable } from '@nestjs/common';
import type { IModuleRegistry } from '../interfaces/module-registry.interface';

/**
 * Central registry that collects all module registries at runtime.
 *
 * Each feature module calls `register()` during its `onModuleInit`,
 * passing its registry object directly.
 *
 * # SOLID
 * - **Single Responsibility** — only manages module metadata.
 * - **Open/Closed** — new modules register themselves without modifying this class.
 * - **Dependency Inversion** — consumers depend on this service, not on individual registries.
 */
@Injectable()
export class ModuleRegistryService {
  private registries = new Map<string, IModuleRegistry>();

  /**
   * Register a module's registry. Called from each feature module's
   * `onModuleInit` lifecycle hook.
   */
  register(registry: IModuleRegistry): void {
    this.registries.set(registry.id, registry);
  }

  /** Get a specific module registry by id. */
  get(id: string): IModuleRegistry | undefined {
    return this.registries.get(id);
  }

  /** List all registered modules. */
  getAll(): IModuleRegistry[] {
    return Array.from(this.registries.values());
  }

  /** Count of registered modules. */
  get count(): number {
    return this.registries.size;
  }
}
