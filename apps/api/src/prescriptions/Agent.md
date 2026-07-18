# Prescriptions Module — Agent Help

## Overview
Manages medical prescriptions — CRUD operations for prescriptions with items linked to the medicine catalog.

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/prescriptions` | Create a new prescription |
| GET | `/prescriptions` | List prescriptions (with filters) |
| GET | `/prescriptions/:id` | Get prescription details |
| PATCH | `/prescriptions/:id` | Update prescription |
| DELETE | `/prescriptions/:id` | Delete a prescription |

## DTOs
- `CreatePrescriptionDto` — appointmentId?, patientId, doctorId, items (medicineId, dosage, frequency, duration, instructions?, quantity), notes?, diagnosis?
- `UpdatePrescriptionDto` — Partial of create fields
- `FindPrescriptionsQueryDto` — patientId?, doctorId?, appointmentId?, dateFrom?, dateTo?, page?, limit?

## Architecture
- `PrescriptionsController` → `PrescriptionsService`
- Prescriptions contain multiple prescription items, each referencing a medicine from the catalog.

## Important Notes
- Each prescription item links to `medicineId` from the medicine catalog.
- Dosage includes strength, frequency (e.g., "1-0-1"), and duration.
- Prescriptions are typically created by doctors during/after appointments.
- Linked to dispensing module for medicine dispensation tracking.
