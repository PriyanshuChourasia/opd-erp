# Billing — Invoice Management

## What is this page?

The Billing page (`/billing`) manages all financial invoices generated from patient visits — either through appointment checkout, the queue, or the POS system. It provides a complete, auto-refreshing view of the clinic's billing status. It is also reused as the POS Billing page (`/pos/billing`).

## Actions & Effects

- **View invoice (eye icon)** — Opens the invoice detail sheet. Effect: shows the itemized bill (line items, subtotal, discount, tax, total), clinic header from the organisation profile, patient info, linked appointment details, and payment method.
- **Mark as paid (PENDING / PARTIAL)** — Calls `updateBillStatus(id, "PAID")`. Effect: invalidates the `bills` cache and toasts "Bill marked as paid".
- **Refund (PAID)** — Calls `updateBillStatus(id, "REFUNDED")`. Effect: invalidates `bills`; toasts "Bill refunded".
- **Cancel (PENDING)** — Calls `updateBillStatus(id, "CANCELLED")`. Effect: invalidates `bills`; toasts "Bill cancelled".
- **Edit patient (pencil, linked patients only)** — Opens the PatientFormSheet for that patient. Effect: saving invalidates `bills`.
- **Pagination** — 20 rows per page; changing pages refetches.

## Events

- **Auto-refresh** — The bill list refetches every 15 seconds, so invoices created from appointments, the queue, or POS appear automatically.
- **Organisation fetch** — Runs on load to render the clinic header inside the invoice detail sheet.

## Features

- Paginated DataTable: invoice # (INV-YYMM-XXXXX), patient (or "Walk-in customer"), payment method, status badge, date, total in ₹.
- Status badges: PAID (green), PENDING (amber), PARTIAL (blue), REFUNDED (gray), CANCELLED (red).
- Full invoice detail sheet with line items.
