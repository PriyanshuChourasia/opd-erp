# Prisma Module — Agent Help

> **⚠️ READ-ONLY MODULE**
> This module (including `prisma/schema.prisma`, `prisma/seed.ts`, and all Prisma-related configuration) is **locked and read-only**.
> **Do not edit or modify any file in this module without explicit permission from the user.**
> If you need to make changes, ask the user first and wait for their approval before proceeding.

## Overview
Provides the Prisma ORM client as a singleton service across the entire application. All database operations go through this module.

## Structure
- `PrismaService` — Wraps `PrismaClient` with lifecycle management
- `PrismaModule` — Global module exporting `PrismaService`

## Architecture
```
PrismaModule (Global)
    └── PrismaService
            └── PrismaClient → PostgreSQL
```

## Features
- Auto-connects on application startup
- Graceful disconnect on application shutdown
- Extensible with middleware (logging, soft-delete, audit trails)
- Single instance shared across all modules

## Database Schema (Key Models)
- **User** — System users with polymorphic relations (userable)
- **Patient** — Patient information
- **Doctor** — Doctor profiles with verification
- **Appointment** — Patient appointments
- **Prescription** + **PrescriptionItem** — Medical prescriptions
- **Bill** + **BillItem** — Billing and invoicing
- **QueueEntry** — Patient queue management
- **LabOrder, RadiologyOrder, ProcedureOrder** — Clinical orders
- **Medicine** — Medicine catalog
- **Shift** — Shift definitions
- **EmployeeSchedule** — Employee weekly schedules
- **Role, Permission, RolePermission** — RBAC
- **Organisation** — Clinic/hospital profile
- **Address** — Polymorphic addresses

## Important Notes
- `PrismaService` enables `shutdownhooks` for clean termination.
- Migrations are stored in `prisma/migrations/`.
- Schema file: `prisma/schema.prisma`.
- Seed scripts: `prisma/seed.ts`.
- Always use transactions for operations affecting multiple models.
