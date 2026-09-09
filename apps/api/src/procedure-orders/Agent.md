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
- `CreateProcedureOrderDto` — patientId, doctorId, procedureName, category?, notes?
- `UpdateProcedureOrderDto` — status?, result?, resultDate?, notes?
- Query params: patientId?, status?

`status`/`result` are plain strings (no Prisma enum, no `@IsEnum` validation) — any string can currently be PATCHed as status. `ProcedureOrder.status` defaults to `"ORDERED"` in the schema; the frontend only ever creates orders (no status-transition UI exists yet — see below).

## Architecture
- `ProcedureOrdersController` → `ProcedureOrdersService`
- Orders are linked to a patient and a doctor only — there is no `appointmentId` field on the model.
- `GET /procedure-orders` scopes `patientId` to `req.user.userableId` when the requester is a `Patient`-role user (mirrors `lab-orders`), so a patient can only ever see their own orders.

## Important Notes
- Creation-only today: `doctor-pos-page.tsx` lets a doctor add procedure orders during consultation (name, category, notes), but there is no list/detail page, no status-update UI, and no result-entry flow anywhere in the frontend — an order can be created and then never viewed again in the UI (it's still fully readable/updatable via the API).
- No procedure catalog, configurable pricing, or billing-module integration exists for `ProcedureOrder` — do not assume cost/billing wiring is in place.
- Examples: wound dressing, injection, suturing, biopsy, endoscopy, etc.
