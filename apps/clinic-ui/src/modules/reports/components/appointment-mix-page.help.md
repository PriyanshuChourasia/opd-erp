# Appointment Mix — Report (appointment-mix-page)

## What is this page?

The Appointment Mix report (`/_dashboard/reports/appointment-mix`) analyzes appointment composition over a date range: counts by type, by status, and a cancellation-reasons breakdown.

## Actions & Effects

- **From / To date pickers** — Defaults to the last 90 days. Effect: changing either refetches the report.

## Events

- **Data fetch** — Runs on mount and whenever the range changes.

## Features

- Bar chart: appointments by type (Walk-in, Consultation, Specialist, Emergency, Follow-up, Teleconsultation).
- Bar chart: appointments by status.
- Cancellation reasons grid (reason + count) — useful for reducing no-shows/cancellations.
- Empty states when no appointments/cancellations in range.
