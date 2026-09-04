# Prescriptions — Consultation Records

## What is this page?

The Prescriptions page (`/prescriptions`) lists all consultation prescriptions — patient, doctor, diagnosis, status, medicine items, and date — and provides creation, editing, print preview, Word export, and per-patient invoice lookup. Doctors only ever see their own prescriptions (the server enforces this; the UI hides the doctor picker for doctors).

## Actions & Effects

- **Create Prescription** — Opens the create sheet. Effect: search patient, auto-assigned doctor (or search for non-doctors), add diagnosis, medicines (with dosage/duration/qty/instructions), and notes; on save calls `createPrescription`; invalidates `prescriptions`; toasts success.
- **Actions dropdown (row)** — Preview, Export Word, Edit (ACTIVE only) / View, Invoices:
  - **Preview** — Opens a formatted prescription preview; "Print" opens the browser print dialog (where you can also save as PDF).
  - **Export Word** — Downloads a `.doc` file (HTML-based Word document) with the prescription layout.
  - **Edit** — Opens the edit sheet (ACTIVE prescriptions only). Effect: `updatePrescription` updates diagnosis, notes, and medicine items; invalidates `prescriptions`; toasts "Prescription updated".
  - **Invoices** — Opens a sheet listing the patient's bills with mark-paid/refund/cancel actions. Effect: status changes call `updateBillStatus` and invalidate `bills`.
- **Search / filters** — Search patient/phone/diagnosis; filter by doctor (non-doctors), status (ACTIVE/DISPENSED/CANCELLED), and date (All/Today/picker). Effect: each resets pagination and refetches.
- **Edit patient (pencil)** — Opens the PatientFormSheet for a patient. Effect: saving invalidates `patients`.

## Events

- **Search debounce** — 300 ms after typing before refetching.
- **Doctor auto-assignment** — For doctor accounts, the doctor field is pre-filled with the logged-in user and shown read-only.
- **Patient invoices fetch** — Opening the Invoices sheet fetches up to 50 bills for that patient.

## Features

- Paginated DataTable: patient, doctor (reg. no), diagnosis, status badge, item count, created date, actions.
- Full prescription create/edit sheets with medicine search and per-item dosage/duration/qty/instructions.
- Print preview and Word export with clinic branding from the organisation profile.
- Status badges: ACTIVE (blue), DISPENSED (green), CANCELLED (red).
