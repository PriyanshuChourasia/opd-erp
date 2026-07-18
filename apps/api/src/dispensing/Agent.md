# Dispensing Module — Agent Help

## Overview
Manages medicine dispensing records — tracking when and how medicines are dispensed to patients from prescriptions.

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/dispensing` | Create a dispensing record |
| GET | `/dispensing` | List dispensing records (with filters) |
| GET | `/dispensing/:id` | Get dispensing details |
| PATCH | `/dispensing/:id` | Update dispensing record |
| DELETE | `/dispensing/:id` | Delete a dispensing record |

## DTOs
- `CreateDispensingDto` — prescriptionId?, patientId, medicineId, quantityDispensed, batchNo?, expiryDate?, notes?
- `UpdateDispensingDto` — Partial of create fields
- `FindDispensingQueryDto` — patientId?, prescriptionId?, medicineId?, dateFrom?, dateTo?, page?, limit?

## Architecture
- `DispensingController` → `DispensingService`
- Tracks medicine inventory outflow linked to prescriptions.

## Important Notes
- Dispensing records are linked to prescriptions and the medicine catalog.
- Tracks batch numbers and expiry dates for inventory management.
- Quantity dispensed should not exceed the prescribed quantity.
- Dispensing reduces available stock of the medicine (if inventory tracking is enabled).
