# Organisation Module — Agent Help

## Overview
Manages the clinic/hospital organisation profile — a singleton record with basic business information.

## Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/organisation` | JWT | Get organisation details |
| PATCH | `/organisation` | JWT | Update or create organisation |

## DTOs
- `UpdateOrganisationDto` — name?, address?, phone?, email?, website?, registrationNumber?, logo?, timezone?, currency?

## Architecture
- `OrganisationController` → `OrganisationService`
- All endpoints are JWT-guarded.
- Uses upsert pattern — there is only one organisation record.

## Important Notes
- This is a singleton entity — there should only be one organisation record in the database.
- The record is seeded with default values and updated as needed.
- Organisation details appear on invoices, reports, and system settings UI.
- Fields include business registration info for legal compliance.
