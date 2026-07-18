# Dashboard — Clinic Overview

## What is this page?

The Dashboard (`/dashboard`) is the main landing page for clinic staff after login. It provides a high-level overview of today's clinic activity, including appointment counts, queue status, patient statistics, revenue trends, and recent activity. Desk roles (Receptionist) are automatically redirected to `/pos` instead.

## What actions can be done?

- **View today's statistics** — Glance at today's appointments, patients in queue, total registered patients, and pending prescriptions.
- **Navigate to any module** — Use the sidebar to jump to Queue, Appointments, Patients, Doctors, Prescriptions, Medicine Catalog, Billing, Dispensing, or Organisation settings.
- **View revenue trend** — See a 14-day revenue chart to track billing performance.
- **Monitor appointment statuses** — Bar chart showing the distribution of SCHEDULED, CONFIRMED, CHECKED_IN, IN_PROGRESS, COMPLETED, and CANCELLED appointments.
- **See doctor load** — Bar chart showing how many appointments each doctor has.
- **View top medicines** — Bar chart of the most frequently dispensed medicines.
- **Review recent activity** — Feed of recent appointments, prescriptions, and billing events.

## What features does it hold?

- **4 stat cards** — Today's appointments, patients in queue, registered patients, pending prescriptions.
- **Revenue trend chart** — 14-day area chart (Recharts) showing daily revenue.
- **Billing status panel** — Breakdown of PAID, PENDING, PARTIAL, and CANCELLED invoices.
- **Appointment status bar chart** — Visual distribution of appointment statuses.
- **Doctor load bar chart** — Appointment count per doctor.
- **Top medicines dispensed** — Horizontal bar chart of most-dispensed medications.
- **Recent activity feed** — Chronological list of recent clinic events.
- **Auto-refresh** — Dashboard data refreshes automatically.
- **Role-based access** — Receptionist role redirects to `/pos` automatically.
