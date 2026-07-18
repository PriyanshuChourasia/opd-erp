# Patient Portal — Self-Service Dashboard

## What is this page?

The Patient Portal (`/patient`) is a self-service area for patients to view their own health records. It provides a dashboard overview, appointment history, prescriptions, lab reports, and billing information. This is a separate layout from the main dashboard with its own navigation.

## What actions can be done?

- **View dashboard overview** — See upcoming appointments, prescription count, lab test count, and total bills.
- **View appointment history** — Browse all past and upcoming appointments with doctor, type, date, and status.
- **View prescriptions** — See all prescriptions with diagnosis, doctor, medicines, and dispensing status.
- **View lab reports** — Access lab test results (placeholder — not yet implemented).
- **View billing history** — See all invoices with amounts, payment status, and dates.

## What features does it hold?

- **Patient-specific layout** — Slim top bar with "Patient Portal" branding and navigation tabs (Dashboard, Appointments, Prescriptions, Lab Reports, Bills).
- **4 stat cards** — Upcoming appointments, total prescriptions, lab tests, and bills.
- **Appointment list** — Date/time, doctor, type, and status badge for each appointment.
- **Prescription list** — Diagnosis, doctor, date, medicine names, and status.
- **Billing list** — Invoice number, date, total amount, and payment status badge.
- **Read-only** — Patients can view but not create or modify records.
- **Auth-gated** — Requires a linked `userableId` (patient-linked user account) to display data.
