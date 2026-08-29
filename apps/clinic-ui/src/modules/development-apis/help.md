# API Endpoints — Developer (development-apis)

## What is this page?

The API Endpoints page (`/developer/apis`) provides a complete, searchable listing of every API endpoint across all registered backend modules. It is the definitive reference for the HTTP surface area of the system.

## Actions & Effects

- **Search** — Filters endpoints by name, path, description, or module name. Effect: live client-side filter.
- **Method filter buttons** — Click a method badge (GET / POST / PATCH / PUT / DELETE) to show only endpoints of that HTTP method. Effect: client-side filter.
- **Expand / collapse a module** — Toggles the list of endpoints for that module. Effect: reveals the full endpoint table for the module.
- **Expand / collapse an endpoint** — Toggles the request/response detail for that endpoint.

## Events

- **Data fetch** — The registry (`fetchModules`) loads once on mount. All endpoint data is derived by flattening each module's features → capabilities → actions tree.

## Features

- Top-level stat cards: total endpoints, modules, GET/POST/PATCH/DELETE breakdowns.
- Module sections with version badges and endpoint counts.
- Per-endpoint rows with color-coded HTTP method badges, paths, and descriptions.
- Expandable request/response documentation per endpoint.
- Fully responsive layout with method filter bar.
