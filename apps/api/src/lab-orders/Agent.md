# Lab Orders Module — Agent Help

## Overview
Manages laboratory test orders — creating, tracking, and updating lab orders for patients.

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/lab-orders` | Create a new lab order |
| GET | `/lab-orders` | List lab orders (by patientId or status) |
| GET | `/lab-orders/:id` | Get lab order details |
| PATCH | `/lab-orders/:id` | Update lab order |
| DELETE | `/lab-orders/:id` | Delete a lab order |

## DTOs
- `CreateLabOrderDto` — appointmentId?, patientId, doctorId, testName, instructions?, notes?, isUrgent?
- `UpdateLabOrderDto` — status (ORDERED, SAMPLE_COLLECTED, IN_PROGRESS, COMPLETED, CANCELLED), result?, notes?, completedAt?
- Query params: patientId?, status?

## Architecture
- `LabOrdersController` → `LabOrdersService`
- Orders are linked to patients and optionally to appointments and doctors.

## Important Notes
- Lab order workflow: ORDERED → SAMPLE_COLLECTED → IN_PROGRESS → COMPLETED.
- CANCELLED is a terminal status.
- Results can be stored as text or structured data.
- Urgent orders are flagged for priority processing.
- Lab orders can be billed through the billing module during checkout.
