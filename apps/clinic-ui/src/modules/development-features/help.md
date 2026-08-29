# Application Features — Developer (development-features)

## What is this page?

The Application Features page (`/developer/features`) is a feature-flag manager. It lists application features (with status enabled/disabled/beta/dev and type core/optional/experimental) and lets admins configure role-based permissions per feature. Note: the list is currently in-memory UI state, not persisted to the backend.

## Actions & Effects

- **Add Feature** — Opens the add sheet. Effect: enter name/description/module/status/type and cycle role permissions; on save the feature is added to the in-memory list (state only).
- **Edit (pencil)** — Opens the sheet pre-filled. Effect: saving updates the feature in the in-memory list.
- **Delete (trash + confirm)** — Removes the feature from the in-memory list.
- **Cycle permission (row)** — Clicking a role chip cycles None → Read → Manage. Effect: updates that feature's rolePermissions immediately.
- **Search** — Filters features by name, description, or module. Effect: live client-side filter.
- **Expand a feature** — Shows the Role & Permission Access panel with clickable role chips.

## Events

- **Permission cycling** — A helper `nextPermission` cycles null → "read" → "manage" → null on each click.
- **No persistence** — All changes live in React state; a page reload discards them.

## Features

- Feature rows with module badge, type badge, and status badge.
- Add/Edit sheet with role-permission setup.
- Inline role-permission cycling per feature.
- Search and expandable rows.
