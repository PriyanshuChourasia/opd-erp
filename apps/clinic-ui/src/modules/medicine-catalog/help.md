# Medicine Catalog — Drug Database

## What is this page?

The Medicine Catalog page (`/medicine-catalog`) is the clinic's drug master database. It lists all medicines available in the pharmacy with their generic names, categories, strengths, units, and prices. This data is used by the POS system and prescription workflows.

## What actions can be done?

- **Browse medicines** — View the paginated list of all medicines in the catalog.
- **Search** — Search medicines by brand name, generic name, or category.
- **Filter by category** — Filter by TABLET, CAPSULE, SYRUP, INJECTION, CREAM, DROPS, INHALER, or OTHER.

## What features does it hold?

- **Paginated DataTable** — Medicine name/brand, generic name, category badge, strength/unit, and price in ₹.
- **Category badges** — Color-coded badges for each medicine category (TABLET, CAPSULE, SYRUP, etc.).
- **Price display** — Prices shown in Indian Rupees (₹) for easy reference.
- **Active/inactive status** — Toggle visibility of active vs discontinued medicines.
- **Read-only** — Medicine catalog is managed through seed data or direct database administration.
- **POS integration** — This catalog is used by the POS checkout screen for medicine search and pricing.
