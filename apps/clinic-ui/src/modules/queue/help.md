# Queue — Token Queue Management

## What is this page?

The Queue page (`/queue`) manages the live patient token queue for the clinic. It displays all patients waiting to be seen by doctors, with their token numbers, current status, and check-in times. This is the core operational page for tracking patient flow through the clinic.

## What actions can be done?

- **Add patient to queue** — Open the sheet and select a patient and doctor to generate a token number and add them to today's queue.
- **Advance status** — Move a patient from WAITING → IN_PROGRESS → COMPLETED using the action button.
- **Skip patient** — Mark a patient as SKIPPED (they left without being seen).
- **Mark no-show** — Mark a patient as NO_SHOW (they didn't arrive).
- **Delete entry** — Remove a queue entry entirely.
- **Filter by doctor** — Click doctor filter chips to view queue for a specific doctor.
- **Search** — Search queue entries by patient name or phone.

## What features does it hold?

- **Paginated DataTable** — Sortable, searchable table with token number, patient name/phone, status, doctor, and check-in time.
- **Status badges** — Color-coded badges for WAITING (amber), IN_PROGRESS (blue), COMPLETED (green), SKIPPED (gray), NO_SHOW (red).
- **"Now serving" highlight** — Prominent banner showing the currently serving patient.
- **Auto-refresh** — Queue data refreshes every 15 seconds for real-time updates.
- **Doctor filter chips** — Quick filter buttons for each doctor.
- **Token number auto-assignment** — Tokens are automatically numbered per day per doctor.
- **Date awareness** — Shows today's queue by default.
