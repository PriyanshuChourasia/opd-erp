# Procedure Orders Module — Agent Help

## Overview
Manages medical procedure orders — minor surgical procedures, dressing changes, injections, and other clinical procedures.

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/procedure-orders` | Create a new procedure order |
| GET | `/procedure-orders` | List procedure orders (by patientId or status) |
| GET | `/procedure-orders/:id` | Get order details |
| PATCH | `/procedure-orders/:id` | Update procedure order |
| DELETE | `/procedure-orders/:id` | Delete a procedure order |

## DTOs
- `CreateProcedureOrderDto` — appointmentId?, patientId, doctorId, procedureName, instructions?, notes?, isUrgent?
- `UpdateProcedureOrderDto` — status (ORDERED, SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED), result?, notes?, completedAt?
- Query params: patientId?, status?

## Architecture
- `ProcedureOrdersController` → `ProcedureOrdersService`
- Orders are linked to patients and optionally to appointments and doctors.

## Important Notes
- Procedure workflow: ORDERED → SCHEDULED → IN_PROGRESS → COMPLETED.
- CANCELLED is a terminal status.
- Examples: wound dressing, injection, suturing, biopsy, endoscopy, etc.
- Procedure orders can be billed through the billing module during checkout.
- Each procedure has a defined cost that can be configured.
