# Allergies Module — Agent Help

## Overview
Manages the allergy master catalog — reference data for known allergies (Penicillin, Latex, Peanuts, etc.) used when recording patient allergies.

## Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/allergies` | JWT | Create a new allergy |
| GET | `/allergies` | JWT | List allergies (with filters) |
| GET | `/allergies/:id` | JWT | Get allergy details |
| PATCH | `/allergies/:id` | JWT | Update allergy |
| DELETE | `/allergies/:id` | JWT | Delete allergy |

## DTOs
- `CreateAllergyDto` — name (required, unique), description?, severity?, category?, isActive?
- `UpdateAllergyDto` — Partial of create fields
- `FindAllergiesQueryDto` — search?, isActive?, severity?, category?, page?, limit?

## Architecture
- `AllergiesController` → `AllergiesService`
- All endpoints are guarded by JWT authentication.
- `name` is unique; create/update enforce uniqueness via ConflictException.

## Enums
- **AllergySeverity**: MILD | MODERATE | SEVERE | LIFE_THREATENING
- **AllergyCategory**: DRUG | FOOD | ENVIRONMENTAL | OTHER
