# Roles Module — Agent Help

## Overview
Manages user roles (Super Admin, Receptionist, Doctor, Assistant, etc.) used for Role-Based Access Control (RBAC).

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/roles` | Create a new role |
| GET | `/roles` | List roles (with filters) |
| GET | `/roles/:id` | Get role details |
| PATCH | `/roles/:id` | Update role |
| DELETE | `/roles/:id` | Delete a role |

## DTOs
- `CreateRoleDto` — name (unique), description?, isSystem?
- `UpdateRoleDto` — description?, isSystem?
- `FindRolesQueryDto` — search?, page?, limit?

## Architecture
- `RolesController` → `RolesService`
- Roles are linked to permissions via the `RolePermission` join table.

## Important Notes
- System roles (`isSystem: true`) should not be deleted as they are essential for the application.
- Default seed roles: Super Admin, Receptionist, Doctor, Assistant.
- Each role has a set of permissions defining what actions they can perform on which resources.
- Role assignment is done at user creation or update in the Auth module.
