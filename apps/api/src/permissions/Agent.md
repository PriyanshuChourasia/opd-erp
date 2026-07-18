# Permissions Module — Agent Help

## Overview
Manages granular permissions (action + resource pairs) used for fine-grained RBAC across modules.

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/permissions` | Create a new permission |
| GET | `/permissions` | List permissions (with filters) |
| GET | `/permissions/:id` | Get permission details |
| PATCH | `/permissions/:id` | Update permission |
| DELETE | `/permissions/:id` | Delete a permission |

## DTOs
- `CreatePermissionDto` — action (create, read, update, delete, manage), resource (e.g., patients, appointments, doctors), name?, description?
- `UpdatePermissionDto` — Partial of create fields
- `FindPermissionsQueryDto` — action?, resource?, search?, page?, limit?

## Architecture
- `PermissionsController` → `PermissionsService`
- Permissions are linked to roles via the `RolePermission` join table.

## Important Notes
- Permission names are auto-generated as `{Action} {Resource}` (e.g., "Create Patients", "Read Appointments").
- Available resources: patients, appointments, doctors, prescriptions, medicine-catalog, queue, billing, dispensing, lab-orders, radiology-orders, procedure-orders, users, roles, permissions, shifts, employee-schedules, organisation, addresses.
- Available actions: create, read, update, delete, manage (manage implies all actions).
- Permissions should be seeded with the application and modified with caution.
