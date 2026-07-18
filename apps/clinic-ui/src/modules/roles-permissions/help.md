# Roles & Permissions — Access Control

## What is this page?

The Roles & Permissions page (`/organisation/roles`) is the RBAC (Role-Based Access Control) management hub. It allows administrators to define roles, assign permissions to roles, and view the complete permission matrix. This controls what each user role can access and modify in the system.

## What actions can be done?

- **Create role** — Define a new role with a name, description, and set of permissions.
- **Edit role** — Modify a role's name, description, and assigned permissions.
- **Delete role** — Remove a non-system role (system roles like Super Admin cannot be deleted).
- **View permission matrix** — See a grid of resources × roles with permission levels (manage/read/none).
- **Create permission** — Define a new permission with a resource and action (e.g. "patients" + "create").
- **Delete permission** — Remove a custom permission.
- **Seed permissions** — Click "Seed Permissions" to generate the default set of 60 permissions (12 resources × 5 actions).
- **View role details** — See which permissions are assigned to each role and how many users have that role.

## What features does it hold?

- **3-tab layout** — Roles list, Permissions matrix, and Permissions list.
- **Permission matrix table** — Visual grid showing resource × role with manage (green), read (blue), or none indicators.
- **Role cards** — Each role shows name, description, permission count, user count, and system badge.
- **Permission picker** — Grouped by resource when editing a role, with checkboxes for each action.
- **System role protection** — Roles with `isSystem: true` cannot be deleted.
- **Permission count per role** — Quick indicator of how many permissions each role has.
- **User count per role** — Shows how many users are assigned to each role.
