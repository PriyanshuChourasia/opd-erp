# Doctor — Consultation & Prescription

## What is this page?

The Doctor page (`/doctor`) is the doctor's working screen. It shows the doctor's live patient queue and runs a full consultation in one view — diagnoses, prescriptions, procedures, notes, and completion. It replaces switching between separate appointment and prescription pages.

## Actions & Effects

- **Start Consultation (WAITING rows)** — Moves the queue entry to IN_PROGRESS. Effect: calls `updateQueueStatus`; invalidates `queue`; toasts "Status updated"; the patient becomes the active consultation (or is selected).
- **Select a patient** — Clicking a queue row opens their consultation form. Effect: resets diagnosis, notes, medicines, and procedures for that patient.
- **Record diagnosis** — Pick from the diagnosis catalog (DiagnosisSelect). Effect: stored on the prescription when the consultation completes.
- **Prescribe medicines** — Search the catalog by brand/generic; add with default dosage 1-0-1, 7 days, qty 1. Effect: per-item dosage/duration/qty/instructions are editable; the tablet count (tabs/day × days × qty) is computed live.
- **Order procedures** — Add a procedure with a category (DIAGNOSTIC, THERAPEUTIC, SURGICAL, PREVENTIVE, OTHER). Effect: each added procedure becomes a procedure order on completion.
- **Doctor's notes (required)** — Free text; completion is blocked until notes are entered (red validation hint).
- **All Prescriptions (history)** — Opens the PatientHistorySheet. Effect: loads and shows the patient's past prescriptions.
- **Complete Consultation** — Effect: creates the prescription (always — with a "Verbal Instructions" item if no medicines were added), creates any procedure orders, marks the linked appointment COMPLETED, deletes the queue entry, invalidates queue/appointments/prescriptions, toasts "Consultation completed successfully", and navigates to `/doctor/prescriptions`.

## Events

- **Auto-refresh** — The queue refetches every 10 seconds.
- **Allergy alerts** — Patient allergies render color-coded by severity from the allergy catalog (SEVERE/LIFE_THREATENING in red, MODERATE orange, else amber).
- **Patient facts** — DOB/age, gender, blood group, allergies, and New/Follow-up visit type are shown from the queue entry.

## Features

- Two-panel layout: queue list (with token, phone, blood group, allergy alerts, status) + consultation builder.
- Rx item builder with automatic tablet-count calculation.
- Procedure order list with categories.
- Patient history sheet.
