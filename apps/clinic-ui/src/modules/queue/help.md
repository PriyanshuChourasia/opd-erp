# Queue — Token Queue Management

## What is this page?

The Queue page (`/queue`) manages the live patient token queue. It shows all patients waiting to be seen by doctors with their token numbers, status, and times, split into Active (Waiting / In Progress) and History (Completed / Skipped / No-show) tabs. This is the core page for tracking patient flow and the entry point for billing completed visits.

## Actions & Effects

- **Change status (dropdown per row)** — Move an entry between WAITING, IN_PROGRESS, COMPLETED, SKIPPED, NO_SHOW. Effect: calls `updateQueueStatus`; invalidates the `queue` cache; toasts "Queue status updated". COMPLETED moves the row to the History tab.
- **Delete entry (trash + confirm)** — Permanently removes a queue entry. Effect: calls `deleteQueueEntry`; invalidates `queue`; toasts "Queue entry removed".
- **Generate invoice (direct, COMPLETED rows)** — Calls `checkoutAppointment` immediately. Effect: creates the bill; invalidates `queue`; toasts "Invoice generated successfully"; the row shows the invoice number badge.
- **Generate invoice (POS, COMPLETED rows)** — Navigates to `/pos?appointmentId=…`. Effect: opens POS checkout with the appointment's line items pre-filled.
- **Doctor filter** — Search + select a doctor (chips reset). Effect: refetches the queue filtered by doctor, resets pagination.
- **Date filter** — All / Today / date picker. Effect: refetches the queue for that date.
- **Tab switch** — Active ⇄ History. Effect: switches the client-side-split lists and resets pagination.
- **Edit patient (pencil)** — Opens the PatientFormSheet for the patient on a row. Effect: saving invalidates `patients`.

## Events

- **Auto-refresh** — Queue data refetches every 15 seconds for real-time updates.
- **Token auto-assignment** — Tokens are automatically numbered per day per doctor.
- **Client-side pagination** — The day's queue is fetched in one call (limit 100) and split/paginated locally per tab.

## Features

- Paginated DataTable: token #, patient, status badge, doctor, booked-at, checkup date, and actions.
- "Waiting / In Progress (N)" and "Completed / Skipped / No-show (N)" tab counts.
- Direct and POS invoice generation on completed rows.
- Status badges: WAITING (amber), IN_PROGRESS (blue), COMPLETED (green), SKIPPED (gray), NO_SHOW (red).
