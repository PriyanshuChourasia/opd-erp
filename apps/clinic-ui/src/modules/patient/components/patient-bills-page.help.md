# Patient Bills — My Invoices (patient-bills-page)

## What is this page?

The Patient Bills page (`/patient/bills`) lists up to 50 invoices raised against the logged-in patient's visits, with invoice number, date, total, and payment status.

## Actions & Effects

- **View bill list** — Read-only. Effect: none; the page is informational.
- **No linked patient** — Shows a message that the account is not linked to a patient record.

## Events

- **Data fetch** — On load, fetches bills filtered by the user's `userableId` (limit 50).

## Features

- Invoice number, formatted date, total in ₹, and color-coded status badge (PAID/PENDING/PARTIAL/REFUNDED/CANCELLED).
- Loading skeleton and empty state.
