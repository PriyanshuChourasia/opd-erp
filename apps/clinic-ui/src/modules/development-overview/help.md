# Developer Overview — System Dashboard

## What is this page?

The Developer Overview (`/developer`) is the landing page of the developer area. It shows system-wide statistics from the backend module registry — total modules, features, API actions, and API health — plus the module dependency graph and quick links to the deeper developer pages.

## Actions & Effects

- **Quick actions** — Buttons to Application Modules (`/developer/modules`), Application Features (`/developer/features`), System Health, and API Documentation. Effect: route navigation.
- **Browse modules list** — Read-only list of all registered modules with version and action counts. Effect: informational.
- **Browse dependency graph** — Read-only list of modules and their cross-module dependencies. Effect: informational.

## Events

- **Data fetch** — The module registry (`fetchModules`) loads on mount; the "Health" stat reads "…" while loading, then "OK" when the registry responds.
- **Action counting** — Total actions/features are computed by walking each module's features → capabilities → actions.

## Features

- 4 stat cards: Total Modules, Features, API Actions, Health.
- Application Modules list with versions and action counts.
- Module Dependencies card (or "No cross-module dependencies").
- System Overview card: API status, modules registered, total actions, backend prefix (/api).
