# Developer Modules — Backend Module Registry

## What is this page?

The Modules page (`/developer/modules`) is a browser for the backend's module registry. It displays every registered NestJS module with its features, capabilities, and API endpoints. This is useful for understanding what the backend provides and for debugging API routes.

## What actions can be done?

- **Browse all modules** — View a searchable, expandable list of every registered backend module.
- **Expand module details** — Click a module to see its features, capabilities, and API action badges.
- **Search modules** — Filter modules by name or feature.
- **View API routes** — See the HTTP method (GET/POST/PATCH/DELETE) and path for each API endpoint.
- **Check module versions** — View the version number of each module.
- **View dependencies** — See which modules depend on other modules.

## What features does it hold?

- **Expandable module cards** — Each module shows name, version, feature count, action count, and route prefix.
- **Feature → Capability tree** — Expanded view shows features with their capabilities nested underneath.
- **API action badges** — Color-coded badges showing HTTP method (GET=green, POST=blue, PATCH=amber, DELETE=red) and path.
- **Search with debounce** — Real-time filtering as you type.
- **Dependency display** — Shows module dependencies at the bottom of each expanded card.
- **Route prefix** — Shows the base API path for each module (e.g. `/api/doctors`).
