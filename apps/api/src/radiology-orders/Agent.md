# Radiology Orders Module — Agent Help

## Overview
Manages radiology/imaging orders — X-rays, MRIs, CT scans, ultrasounds, and other imaging procedures.

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/radiology-orders` | Create a new radiology order |
| GET | `/radiology-orders` | List radiology orders (by patientId or status) |
| GET | `/radiology-orders/:id` | Get order details |
| PATCH | `/radiology-orders/:id` | Update radiology order |
| DELETE | `/radiology-orders/:id` | Delete a radiology order |

## DTOs
- `CreateRadiologyOrderDto` — appointmentId?, patientId, doctorId, procedureName, bodyPart?, instructions?, notes?, isUrgent?
- `UpdateRadiologyOrderDto` — status (ORDERED, SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED), results?, reportUrl?, notes?, completedAt?
- Query params: patientId?, status?

## Architecture
- `RadiologyOrdersController` → `RadiologyOrdersService`
- Orders are linked to patients and optionally to appointments and doctors.

## Important Notes
- Radiology workflow: ORDERED → SCHEDULED → IN_PROGRESS → COMPLETED.
- CANCELLED is a terminal status.
- Results may include images/reports stored externally (reportUrl).
- Body part field specifies the anatomical region being imaged.
- Radiology orders can be billed through the billing module during checkout.
