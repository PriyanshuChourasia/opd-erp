# Medicine Catalog — Drug Master

## What is this page?

The Medicine Catalog page (`/medicine-catalog`) is a read-only browser over the drug master database — name, brand, generic name, category, strength/unit, price, and active status. It is the same catalog used by the doctor's prescription builder and the POS checkout search.

## Actions & Effects

- **Search** — Type a name, generic, or brand. Effect: refetches the list live and resets to page 1.
- **Pagination** — 20 rows per page; changing pages refetches.
- **Browse** — Read-only. Effect: none.

## Events

- **Data fetch** — Runs on mount, search change, and pagination change.

## Features

- Paginated DataTable: name (+ brand), generic name, category badge, strength/unit, price in ₹, Active/Inactive status.
- Search across name, generic, and brand.
