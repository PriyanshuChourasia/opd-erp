# POS Billing — Invoice List (pos-billing-page)

## What is this page?

The POS Billing page (`/pos/billing`) is the billing screen inside the POS workspace. It is the same implementation as the dashboard Billing page (it re-exports `BillingPage`), so the actions, effects, and events below are identical to `/billing`.

## Actions & Effects

- **View invoice (eye icon)** — Opens the invoice detail sheet. Effect: shows the itemized bill (line items, subtotal, discount, tax, total), clinic header from the organisation profile, patient info, linked appointment details, and payment method.
- **Mark as paid (PENDING/PARTIAL)** — Calls `updateBillStatus(id, "PAID")`. Effect: invalidates the `bills` cache and toasts "Bill marked as paid".
- **Refund (PAID)** — Calls `updateBillStatus(id, "REFUNDED")`. Effect: invalidates `bills`; toasts "Bill refunded".
- **Cancel (PENDING)** — Calls `updateBillStatus(id, "CANCELLED")`. Effect: invalidates `bills`; toasts "Bill cancelled".
- **Edit patient (pencil, when a patient is linked)** — Opens the PatientFormSheet for that patient. Effect: saving invalidates the `bills` cache.
- **Pagination** — 20 rows per page; changing pages refetches.

## Events

- **Auto-refresh** — The bill list refetches every 15 seconds to reflect sales made elsewhere (appointments, POS checkout, queue checkouts).
- **Organisation fetch** — Loaded to render the clinic header inside the invoice detail sheet.

## Features

- Paginated DataTable: invoice #, patient (or "Walk-in customer"), payment method, status badge, date, total.
- Status badges: PENDING (amber), PAID (green), PARTIAL (blue), REFUNDED (gray), CANCELLED (red).
- Inline status actions that depend on the current status.
- Full invoice detail sheet.
