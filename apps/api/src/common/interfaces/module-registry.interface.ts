/**
 * Describes a single operation an action can perform.
 */
export interface ModuleAction {
  id: string;
  name: string;
  description: string;
  /** HTTP method or internal trigger */
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  /** Route path relative to the module prefix */
  path?: string;
}

/**
 * A capability groups related actions under a domain concern.
 */
export interface ModuleCapability {
  id: string;
  name: string;
  description: string;
  actions: ModuleAction[];
}

/**
 * A feature encapsulates one or more capabilities.
 */
export interface ModuleFeature {
  id: string;
  name: string;
  description: string;
  capabilities: ModuleCapability[];
}

/**
 * Metadata about a module's dependency on another module or external library.
 */
export interface ModuleDependency {
  name: string;
  version?: string;
  optional?: boolean;
}

/**
 * Registry contract every feature module must export as `registry`.
 *
 * Usage:
 * ```ts
 * // in patients/registry.ts
 * export const registry: IModuleRegistry = { ... };
 * ```
 */
export interface IModuleRegistry {
  /** Unique machine-readable identifier (kebab-case). */
  id: string;
  /** Human-readable display name. */
  name: string;
  /** Short description of the module's purpose. */
  description: string;
  /** Semver string. */
  version: string;
  /** Who maintains this module. */
  author?: string;
  /** List of features this module provides. */
  features: ModuleFeature[];
  /** Other modules or packages this module depends on. */
  dependencies?: ModuleDependency[];
  /** NestJS controller route prefix (if any). */
  routePrefix?: string;
  /** Whether the module is enabled. */
  enabled?: boolean;
}
