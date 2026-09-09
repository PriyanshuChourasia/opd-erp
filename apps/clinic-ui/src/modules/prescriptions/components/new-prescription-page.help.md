# New Prescription — Create Form (new-prescription-page)

## What is this page?

The Create Prescription page (`/prescriptions/new`, and its `/doctor` and `/receptionist` counterparts) is the full-page form for writing a standalone prescription — one not tied to an in-progress appointment consultation. It replaces the old side-sheet: patient and doctor are searched and selected, then diagnosis, medicines, and notes are filled in before saving.

## Actions & Effects

- **Patient search** — Type ≥1 char to search patients by name/phone (limit 8). Effect: selecting a patient locks in the field; clear it (✕) to search again.
- **Doctor search** — For non-doctor users, searches all doctors by name/specialization. Effect: selecting a doctor locks in the field. Doctors themselves see a read-only "You (auto-assigned)" field — their own id is always used.
- **Diagnosis** — Free-text field, optional.
- **Add (medicine)** — Opens an inline medicine search (≥2 chars). Effect: selecting a medicine adds a row with default dosage `1-0-1` / duration `7 days`, editable per-row (dosage, duration, quantity, instructions); remove a row with the ✕.
- **Notes** — Optional free text saved with the prescription.
- **Create Prescription** — Requires a selected patient, a doctor, and at least one medicine. Effect: calls `createPrescription`; invalidates the `prescriptions` cache; toasts success; navigates back to the prescriptions list in the current workspace (dashboard/doctor/receptionist).
- **Cancel** — Returns to the prescriptions list without saving.

## Features

- Three-column layout: left = patient + doctor selection; right (2 cols) = diagnosis, medicines, notes.
- Same URL structure repeated per role layout (`/prescriptions/new`, `/doctor/prescriptions/new`, `/receptionist/prescriptions/new`) so Cancel/Create always return to the list the user came from.
