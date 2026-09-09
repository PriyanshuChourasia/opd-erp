# Edit Prescription (edit-prescription-page)

## What is this page?

The Edit Prescription page (`/prescriptions/$prescriptionId/edit`, and its `/doctor` and `/receptionist` counterparts) is the full-page form for editing an existing ACTIVE prescription. It replaced the old side-sheet: the prescription is fetched by id, pre-filled into the same fields used at creation, and saved back via `updatePrescription`.

## Actions & Effects

- **Edit (pencil) action** — Clicking Edit on an ACTIVE prescription in the list (dashboard/doctor/receptionist) navigates to this page. Editing is hidden for prescriptions that are not ACTIVE.
- **Diagnosis** — Pre-filled from the prescription; editable, optional.
- **Add (medicine)** — Opens an inline medicine search (≥2 chars); selecting adds a row with default dosage `1-0-1` / duration `7 days`. Existing medicines are shown as editable rows (dosage, duration, quantity, instructions); remove one with the ✕.
- **Save Changes** — Requires at least one medicine. Effect: calls `updatePrescription`; invalidates the `prescriptions` cache; toasts "Prescription updated"; navigates back to the prescriptions list in the current workspace.
- **Cancel** — Returns to the prescriptions list without saving.

## Features

- Read-only patient and doctor summary in the left column; diagnosis, medicines, notes editable on the right (Card-based, same structure as the create page).
- Same URL structure repeated per role layout (`/prescriptions/$prescriptionId/edit`, `/doctor/prescriptions/$prescriptionId/edit`, `/receptionist/prescriptions/$prescriptionId/edit`) so Save/Cancel always return to the list the user came from.