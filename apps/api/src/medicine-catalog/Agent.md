# Medicine Catalog Module — Agent Help

## Overview
Manages the medicine master data — the catalog of all medicines available at the clinic.

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/medicine-catalog` | Add a new medicine |
| GET | `/medicine-catalog` | List medicines (with filters & search) |
| GET | `/medicine-catalog/:id` | Get medicine details |
| PATCH | `/medicine-catalog/:id` | Update medicine |
| DELETE | `/medicine-catalog/:id` | Remove a medicine |

## DTOs
- `CreateMedicineDto` — name, genericName?, category (TABLET, CAPSULE, SYRUP, INJECTION, CREAM, DROPS, INHALER, OTHER), strength, unit, price, manufacturer?, isActive?
- `UpdateMedicineDto` — Partial of create fields
- `FindMedicinesQueryDto` — search? (name/genericName), category?, isActive?, page?, limit?

## Architecture
- `MedicineCatalogController` → `MedicineCatalogService`
- The catalog is referenced by prescriptions and dispensing modules.

## Important Notes
- Medicine names should be unique within the catalog.
- Category helps organize and filter medicines by type.
- Price is used in billing calculations.
- Stock management can be extended with quantity-on-hand tracking.
- Deactivating (`isActive: false`) is preferred over deleting to preserve historical references.
