# Diagnoses Module — Agent Help

## Overview
Manages the diagnosis master catalog — reference data for known diagnoses (Hypertension, Type 2 Diabetes, etc.) surfaced to doctors when recording a prescription's diagnosis.

## Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/diagnoses` | JWT | Create a new diagnosis |
| GET | `/diagnoses` | JWT | List diagnoses (with filters) |
| GET | `/diagnoses/:id` | JWT | Get diagnosis details |
| PATCH | `/diagnoses/:id` | JWT | Update diagnosis |
| DELETE | `/diagnoses/:id` | JWT | Delete diagnosis |

## DTOs
- `CreateDiagnosisDto` — name (required, unique), icdCode?, description?, isActive?
- `UpdateDiagnosisDto` — Partial of create fields
- `FindDiagnosesQueryDto` — search?, isActive?, page?, limit?

## Architecture
- `DiagnosesController` → `DiagnosesService`
- All endpoints are guarded by JWT authentication.
- `name` is unique; create/update enforce uniqueness via ConflictException.
- `Prescription.diagnosis` stores the chosen diagnosis as free text (not an FK) — the catalog only powers suggestions/autocomplete in the UI, same relationship as `Allergy` to `Patient.allergies`.
