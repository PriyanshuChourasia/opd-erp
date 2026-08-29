# Patient Appointments — My Visits (patient-appointments-page)

## What is this page?

The Patient Appointments page (`/patient/appointments`) lists up to 50 of the logged-in patient's appointments (scheduled and past) with date, time, doctor, type, and status.

## Actions & Effects

- **View appointment list** — Read-only. Effect: none; the page is informational.
- **No linked patient** — Shows a message that the account is not linked to a patient record.

## Events

- **Data fetch** — On load, fetches appointments filtered by the user's `userableId` (limit 50).

## Features

- Date + time, doctor name/registration no, consultation type, and color-coded status badge per row.
- Loading skeleton while the list loads.
- Empty state when no appointments exist.
