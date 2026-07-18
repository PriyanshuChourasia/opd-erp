# Appointments Module — Agent Help

## Overview
Manages patient appointments — creation, scheduling, status updates, checkout, invoice preview, and deletion.

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/appointments` | Create a new appointment |
| GET | `/appointments` | List appointments (with filters) |
| GET | `/appointments/:id` | Get single appointment details |
| GET | `/appointments/:id/invoice-preview` | Preview invoice for an appointment |
| POST | `/appointments/:id/checkout` | Checkout / finalize an appointment |
| PATCH | `/appointments/:id/status` | Update appointment status |
| DELETE | `/appointments/:id` | Remove an appointment |

## DTOs
- `CreateAppointmentDto` — patientId, doctorId, date, type, fee, notes?, tokenNumber?
- `UpdateAppointmentStatusDto` — status (SCHEDULED, CHECKED_IN, IN_PROGRESS, COMPLETED, CANCELLED, NO_SHOW)
- `FindAppointmentsQueryDto` — patientId?, doctorId?, status?, dateFrom?, dateTo?, type?, page?, limit?
- `CheckoutAppointmentDto` — paymentMethod, billItems? (items, labOrders, radiologyOrders, procedureOrders)

## Architecture
- `AppointmentsController` → `AppointmentsService`
- Service handles creation, querying with filters, status transitions, and checkout flow.
- Checkout creates bills, queue entries, and updates appointment status.

## Important Notes
- Appointment statuses follow a workflow: SCHEDULED → CHECKED_IN → IN_PROGRESS → COMPLETED.
- Cancelled and NO_SHOW are terminal statuses.
- Checkout generates a bill and links to billing module.
- Invoice preview shows estimated charges before final checkout.
