# Patient Prescriptions — My Medicines (patient-prescriptions-page)

## What is this page?

The Patient Prescriptions page (`/patient/prescriptions`) lists up to 50 prescriptions issued to the logged-in patient, showing diagnosis, doctor, date, the prescribed medicines, and status.

## Actions & Effects

- **View prescription list** — Read-only. Effect: none; the page is informational.
- **No linked patient** — Shows a message that the account is not linked to a patient record.

## Events

- **Data fetch** — On load, fetches prescriptions filtered by the user's `userableId` (limit 50).

## Features

- Per prescription: diagnosis (or "Prescription"), doctor, date, comma-separated medicine names, and status badge (ACTIVE blue / DISPENSED green / CANCELLED gray).
- Loading skeleton and empty state.
