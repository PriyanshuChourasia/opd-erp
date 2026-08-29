# Shifts Module — Agent Help

## Overview
Manages shift definitions — the master data for different shift types used across the clinic (Morning, Afternoon, Full Day, Evening, etc.).

## Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/shifts` | JWT | Create a new shift definition |
| GET | `/shifts` | JWT | List shifts (with filters) |
| GET | `/shifts/:id` | JWT | Get shift details |
| PATCH | `/shifts/:id` | JWT | Update shift definition |
| DELETE | `/shifts/:id` | JWT | Delete a shift |

## DTOs
- `CreateShiftDto` — name, code (unique), startTime, endTime, breakStartTime?, breakEndTime?, isOvernight?, description?
- `UpdateShiftDto` — Partial of create fields
- `FindShiftsQueryDto` — search?, isActive?, page?, limit?

## Architecture
- `ShiftsController` → `ShiftsService`
- All endpoints are guarded by JWT authentication.

## Important Notes
- Shifts are master data referenced by employee schedules.
- `code` is a unique short identifier (e.g., MOR, AFT, FUL, EVE).
- `isOvernight` flag indicates shifts spanning midnight.
- Break times are optional and used for scheduling purposes.
- Employees (doctors) are assigned to shifts via the Employee Schedules module.
