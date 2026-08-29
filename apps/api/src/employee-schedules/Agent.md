# Employee Schedules Module — Agent Help

## Overview
Manages weekly schedules for employees (primarily doctors) — defining working days, hours, and generating available appointment slots.

## Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/employee-schedules` | JWT | Create a schedule entry |
| GET | `/employee-schedules` | JWT | List schedules (with filters) |
| GET | `/employee-schedules/by-employee` | JWT | Get schedules for a specific employee |
| GET | `/employee-schedules/slots` | JWT | Generate available time slots for a date |
| GET | `/employee-schedules/:id` | JWT | Get schedule details |
| PATCH | `/employee-schedules/:id` | JWT | Update schedule entry |
| DELETE | `/employee-schedules/:id` | JWT | Delete a schedule entry |

## DTOs
- `CreateEmployeeScheduleDto` — employeeSchedulableType (Doctor), employeeSchedulableId, dayOfWeek (0=Mon..6=Sun), startTime, endTime, isAvailable?, shiftId?
- `UpdateEmployeeScheduleDto` — Partial of create fields
- `FindEmployeeSchedulesQueryDto` — employeeSchedulableType?, employeeSchedulableId?, dayOfWeek?, isAvailable?, page?, limit?

## Architecture
- `EmployeeSchedulesController` → `EmployeeSchedulesService` + `SlotGeneratorService`
- Uses polymorphic association similar to addresses.
- Slot generation considers existing appointments to avoid double-booking.

## Important Notes
- `dayOfWeek` is 0-indexed starting Monday (0=Monday, 6=Sunday).
- Slot generator creates time slots based on schedule + existing appointments.
- Used by the appointments module to show available time slots.
- An employee can have multiple schedule entries (e.g., split shifts).
- Each schedule entry can optionally reference a Shift definition.
