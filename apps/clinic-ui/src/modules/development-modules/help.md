# Application Modules — Developer (development-modules)

## What is this page?

The Application Modules page (`/developer/modules`) lists every backend module discovered from the module registry, with expandable detail: features, capabilities, their API actions (method + path), and dependencies.

## Actions & Effects

- **Search** — Filters modules by name, description, or ID. Effect: live client-side filter.
- **Expand / collapse a module** — Toggles the details panel. Effect: shows features & capabilities with API action badges (e.g. `GET /appointments`) and dependency badges.

## Events

- **Data fetch** — The registry (`fetchModules`) loads once on mount.

## Features

- Module rows with ID badge, version, feature/action counts, and route prefix badge.
- Expandable features → capabilities → actions tree.
- Dependencies section with version badges.
