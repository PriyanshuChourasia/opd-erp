# Common Module — Agent Help

## Overview
Shared utilities and cross-cutting concerns used by other modules. Includes the module registry system, slot generator, and other common services.

## Module Registry

The module registry (`ModuleRegistryService`) is a dynamic feature registry that allows modules to self-register with their capabilities, actions, and metadata.

### Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/modules` | List all registered modules |
| GET | `/modules/:id` | Get specific module details |

### How to Register a Module
Each module has a `registry.ts` file that exports a registration function. The module calls this during initialization to register:
- Module name and description
- Available endpoints/routes
- Supported actions (CRUD operations)
- Permissions required
- Dependencies on other modules

## Common Services

| Service | Description |
|---------|-------------|
| `SlotGeneratorService` | Generates available appointment slots based on employee schedules |
| `ModuleRegistryService` | Manages the dynamic module capability registry |

## Important Notes
- The common module should not contain business logic — only shared infrastructure.
- Services here should be generic and reusable across multiple modules.
- Module registry enables dynamic UI rendering based on available features.
- New shared services should be added here only when needed by 2+ modules.
