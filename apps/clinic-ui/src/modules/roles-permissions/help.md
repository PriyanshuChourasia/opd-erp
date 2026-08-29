# Roles & Permissions — Access Control

## What is this page?

The Roles & Permissions page (`/organisation/roles`) manages role-based access control: define roles, assign permissions to them, and maintain the permission list itself. A permission matrix shows which role has which permission.

## Actions & Effects

- **Create Role** — Opens the add sheet. Effect: calls `createRole` with name, description, and selected permission IDs; invalidates `roles`; toasts "Role created successfully".
- **Edit role (pencil)** — Opens the sheet pre-filled with the role's permissions. Effect: saving calls `updateRole`; invalidates `roles`; toasts "Role updated successfully".
- **Delete role (X + confirm)** — Calls `deleteRole`. Effect: invalidates `roles`; toasts "Role deleted successfully".
- **Delete permission (X + confirm)** — Calls `deletePermission`. Effect: invalidates `permissions`; toasts "Permission deleted".
- **Seed default permissions** — Button to seed the default permission set. Effect: calls the seed endpoint if permissions are empty; invalidates `permissions`; toasts "Default permissions seeded".
- **Permission matrix** — Read-only view of role × permission access (or interactive in the feature-flag UI).

## Events

- **Data fetch** — Roles and permissions are fetched with a large limit (only a handful exist) to power the matrix and the permission picker without pagination.
- **Cross-module effect** — Role changes affect which screens and actions each logged-in user can access on next load.

## Features

- Roles list with permission counts.
- Permission list with delete actions and a seed action.
- Permission-picker inside the role sheet.
- Permission matrix across roles.
