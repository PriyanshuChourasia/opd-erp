# Patients — Registry & Records

## What is this page?

The Patients page (`/patients`) is the patient registry — search, register, edit, deactivate, and review patients, including their profile photo, documents, and appointment history.

## Actions & Effects

- **Register Patient / New Patient** — Opens the PatientFormSheet. Effect: on save, creates the patient and uploads any pending profile photo/documents; invalidates `patients`; toasts success.
- **Edit (pencil)** — Opens the PatientFormSheet pre-filled from `fetchPatient(id)`. Effect: on save, updates the patient; invalidates `patients`.
- **Deactivate (X + confirm)** — Calls `deletePatient` (soft delete). Effect: patient is deactivated; toasts "Patient deactivated successfully".
- **Documents (folder icon)** — Opens the document sheet for the patient. Effect: upload/delete profile photo and other documents.
- **Search** — Filters by name/phone/email. Effect: refetches the list live and resets pagination.
- **Appointment history (expand)** — Shows the patient's past appointments with statuses. Effect: fetches appointments for that patient on expand.

## Events

- **Data fetch** — Runs on mount, search change, and pagination change.
- **Document upload on save** — Pending photo/files are uploaded after the patient record is created (they need the patient ID).
- **Cross-module effect** — The PatientFormSheet is reused across appointments, queue, POS, and billing pages for inline registration/editing.

## Features

- Paginated DataTable: patient (avatar, name, phone), gender, age/DOB, blood group, allergy count, appointment count, and actions.
- PatientFormSheet with profile photo upload, allergies, addresses, and documents.
- Expandable rows for appointment history.
