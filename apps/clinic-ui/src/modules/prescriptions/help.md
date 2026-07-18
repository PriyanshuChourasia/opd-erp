# Prescriptions — Prescription Records

## What is this page?

The Prescriptions page (`/prescriptions`) displays a read-only list of all prescriptions issued by doctors. Prescriptions are created during the consultation workflow (from the doctor's view) and contain diagnosis, medication orders, dosage instructions, and dispensing status.

## What actions can be done?

- **View prescriptions** — Browse the paginated list of all prescriptions with patient name, doctor, diagnosis, status, and item count.
- **Search** — Search prescriptions by patient name, doctor name, or diagnosis.
- **View details** — Click to see the full prescription including all medication items, dosages, durations, and instructions.
- **Filter by status** — View ACTIVE, DISPENSED, or CANCELLED prescriptions.

## What features does it hold?

- **Paginated DataTable** — Patient, doctor, diagnosis, status badge, number of medicine items, and creation date.
- **Status badges** — Color-coded: ACTIVE (blue), DISPENSED (green), CANCELLED (gray).
- **Read-only** — Prescriptions cannot be created or edited from this page; they are generated from the consultation workflow.
- **Medicine item count** — Shows how many medications are included in each prescription.
- **Linked dispensing** — DISPENSED prescriptions have associated dispensing records viewable in the Dispensing module.
