# POS Patients — Search & Register (pos-patients-page)

## What is this page?

The POS Patients page (`/pos/patients`) lets counter staff search the patient directory, register new patients, edit existing ones, and expand any patient to view their appointment history — without leaving the POS area.

## Actions & Effects

- **Search** — Type a name, phone, or email. Effect: refetches the patient list live with the search term.
- **Expand / collapse a patient row** — Click a row. Effect: fetches up to 50 appointments for that patient and shows them as a history list (doctor, type, date/time, fee, status badge); clicking again collapses it.
- **New Patient button** — Opens the PatientFormSheet in create mode. Effect: on save, the patient is created (and any pending profile photo/documents are uploaded) and the list refetches.
- **Edit (pencil on row hover)** — Opens the PatientFormSheet pre-filled. Effect: on save, the patient record is updated.
- **History status badges** — Read-only color coding of appointment statuses.

## Events

- **History fetch** — Expanding a row triggers `fetchAppointments({ patientId, limit: 50 })`; only the expanded patient's history is loaded at a time.
- **List query** — `searchPatients(search)` runs on mount and whenever the search text changes.

## Features

- Expandable patient list with phone, email, DOB, and blood group shown inline.
- Appointment history drawer per patient.
- Patient registration/editing via the shared PatientFormSheet.
- Empty states with a quick "New Patient" action.
