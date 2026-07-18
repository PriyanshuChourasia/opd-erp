# Addresses Module — Agent Help

## Overview
Manages polymorphic addresses for various entities (patients, doctors, organisation, etc.).

## Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/addresses` | JWT | Create a new address |
| GET | `/addresses` | JWT | List addresses (with filters) |
| GET | `/addresses/by-entity` | JWT | Get addresses by entity type & ID |
| GET | `/addresses/:id` | JWT | Get address details |
| PATCH | `/addresses/:id` | JWT | Update address |
| PATCH | `/addresses/:id/primary` | JWT | Set address as primary |
| DELETE | `/addresses/:id` | JWT | Delete an address |

## DTOs
- `CreateAddressDto` — addressableType, addressableId, line1, line2?, city, state, pincode, country?, type? (HOME, WORK, CLINIC, OTHER), isPrimary?, latitude?, longitude?
- `UpdateAddressDto` — Partial of create fields
- `FindAddressesQueryDto` — addressableType?, addressableId?, city?, state?, type?, page?, limit?

## Architecture
- `AddressesController` → `AddressesService`
- Uses polymorphic associations (`addressableType` / `addressableId`) to link to any entity.
- All endpoints are JWT-guarded.

## Important Notes
- Addresses can be linked to Patients, Doctors, Organisation, or other entities.
- `isPrimary` flag marks the default address for an entity.
- `type` categorizes the address (HOME, WORK, CLINIC, OTHER).
- An entity can have multiple addresses but only one primary.
- Coordinates (lat/lng) can be used for map integration.
