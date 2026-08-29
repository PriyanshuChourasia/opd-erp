# Diagnoses — Master Catalog

## What is this page?

The Diagnoses page (`/_dashboard/diagnoses`) manages the diagnosis master catalog used when doctors record prescriptions. Each entry has a name (required), optional ICD code, description, and active status, keeping clinical terminology consistent across the clinic.

## Actions & Effects

- **Add Diagnosis** — Opens the add sheet. Effect: entering a name and confirming calls `createDiagnosis`; invalidates `diagnoses`; toasts "Diagnosis created successfully".
- **Edit (pencil)** — Opens the sheet pre-filled from `fetchDiagnosis(id)`. Effect: saving calls `updateDiagnosis`; invalidates `diagnoses`; toasts "Diagnosis updated successfully".
- **Delete (X + confirm)** — Calls `deleteDiagnosis`. Effect: invalidates `diagnoses`; toasts "Diagnosis deleted successfully".
- **Search** — Types to filter the list live. Effect: refetches and resets to page 1.
- **Status select (Active/Inactive)** — In the sheet; inactive diagnoses are hidden from pickers used elsewhere.

## Events

- **Data fetch** — Runs on mount, search change, and pagination change.
- **Cross-module effect** — These entries power the DiagnosisSelect dropdown used in the doctor's consultation screen and prescription flows.

## Features

- Paginated DataTable: name + description, ICD code badge, status badge, row actions.
- Add/Edit slide-over sheet with validation (name required).
