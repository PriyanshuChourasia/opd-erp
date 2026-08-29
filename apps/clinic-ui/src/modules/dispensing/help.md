# Dispensing — Pharmacy Records

## What is this page?

The Dispensing page (`/dispensing`) shows the pharmacy's dispensing records — every medicine dispensed, with quantity, batch number, expiry date, who dispensed it, and when. It is a read-only audit trail for batch tracking.

## Actions & Effects

- **Browse records** — Read-only. Effect: none.
- **Pagination** — 20 rows per page; changing pages refetches.

## Events

- **Data fetch** — Runs on mount and on pagination change (`fetchDispensings`).

## Features

- Paginated DataTable: medicine, quantity, batch #, expiry date, dispensed-at timestamp, dispensed-by.
- Batch/expiry tracking for recalls and stock audits.
