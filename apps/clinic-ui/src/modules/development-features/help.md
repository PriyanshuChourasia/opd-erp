# Developer Features — Feature Flags & Permissions

## What is this page?

The Features page (`/developer/features`) is a feature flag and role-permission configurator. It allows developers and administrators to view and manage feature toggles, their types (core/optional/experimental), and which roles have access to each feature.

## What actions can be done?

- **View all features** — Browse the expandable list of system features with their status and type.
- **Toggle feature status** — Change a feature's status between enabled, disabled, beta, and dev.
- **Configure role permissions** — Set which roles (None, Read, Manage) can access each feature.
- **Add new feature** — Create a new feature with name, description, type, and initial status.
- **Edit feature** — Modify a feature's name, description, type, or status.
- **Delete feature** — Remove a feature flag.

## What features does it hold?

- **Feature status indicators** — Visual badges for enabled (green), disabled (gray), beta (amber), and dev (blue) statuses.
- **Feature type classification** — Core, optional, and experimental types with distinct styling.
- **Role permission matrix** — Per-feature permission grid showing None/Read/Manage for each role.
- **Inline permission editing** — Click to cycle through permission levels directly in the list.
- **Add/edit/delete CRUD** — Full feature flag management with form validation.
- **Expandable details** — Click a feature to see its full description, type, status, and role permissions.
