# Addresses — Global Address Directory

## What is this page?

The Addresses page (`/addresses`) is a global directory of all addresses in the system. Addresses are polymorphic — they can belong to Users, Doctors, Organisations, or any other entity. Each address has a type (CLINIC, HOME, BILLING, OTHER) and can be marked as primary.

## What actions can be done?

- **Add new address** — Create an address for any entity (Doctor, Patient, Organisation, User) with address type, line 1/2, landmark, city, district, state, country, postal code, and coordinates.
- **Edit address** — Modify any address details.
- **Delete address** — Remove an address record.
- **Set as primary** — Mark an address as the primary address for its entity (unsets any previous primary).
- **Filter by type** — Filter addresses by type: CLINIC, HOME, BILLING, or OTHER.
- **Filter by entity** — Filter addresses by entity type: Doctor, Patient, Organisation, or User.

## What features does it hold?

- **Paginated DataTable** — Address type icon, address lines, entity type/ID, primary flag, active status.
- **Type icons** — Visual icons for CLINIC (building), HOME (house), BILLING (receipt), OTHER.
- **Primary address swap** — Setting a new primary automatically unsets the previous primary for that entity.
- **Polymorphic association** — Addresses can belong to any entity type via `addressableType`/`addressableId`.
- **Geolocation support** — Optional latitude/longitude fields for mapping.
- **Entity type filter** — Quick filter chips for Doctor, Patient, Organisation, User.
