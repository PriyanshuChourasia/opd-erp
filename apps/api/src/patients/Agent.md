# Patients Module — Agent Help

## Overview
Manages patient records — CRUD operations, search, and listing with filters.

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/patients` | Create a new patient record |
| GET | `/patients` | List patients (with search & filters) |
| GET | `/patients/:id` | Get patient details |
| PATCH | `/patients/:id` | Update patient information |
| DELETE | `/patients/:id` | Delete a patient record |

## DTOs
- `CreatePatientDto` — name, phone, email?, gender, dateOfBirth?, bloodGroup?, address?, emergencyContact?
- `UpdatePatientDto` — Partial of CreatePatientDto fields
- `FindPatientsQueryDto` — search? (name/phone), gender?, bloodGroup?, page?, limit?

## Architecture
- `PatientsController` → `PatientsService`
- Service uses Prisma for DB operations.
- Search supports name and phone number lookups.

## Important Notes
- Phone is a unique identifier — used for upsert operations.
- Patient records are referenced by appointments, prescriptions, bills, queue entries, lab/radiology/procedure orders.
- Deleting a patient may be restricted if they have active appointments or bills.
