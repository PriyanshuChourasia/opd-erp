# Dashboard — Clinic Overview

## What is this page?

The Dashboard (`/dashboard`) is the main landing page for clinic staff after login. It provides a high-level overview of today's activity — appointment counts, queue status, patient statistics, revenue trends, billing status, doctor load, top medicines, and recent activity. Desk roles (Receptionist) are automatically redirected to `/pos` instead.

## Actions & Effects

- **Navigate to any module** — Sidebar links jump to Queue, Appointments, Patients, Doctors, Prescriptions, Medicine Catalog, Billing, Dispensing, or Organisation. Effect: route navigation.
- **View today's statistics** — 4–5 stat cards (today's appointments, patients in queue, registered patients, pending prescriptions). Effect: informational; updates on auto-refresh.
- **Review charts** — Revenue trend (14-day area chart), appointment status bar chart, doctor load bar chart, top medicines bar chart, billing status panel. Effect: informational.
- **Monitor recent activity** — Chronological feed of recent appointments, prescriptions, and billing events. Effect: informational.
- **Role-based access** — A receptionist role redirects to `/pos` automatically on load.

## Events

- **Auto-refresh** — Dashboard statistics refetch every 15 seconds (`useDashboardStats`).
- **Chart data** — Revenue trend, appointment statuses, doctor load, and top medicines are derived from dedicated queries on mount and refresh.

## Features

- Stat cards with icons and loading skeletons.
- Recharts visualizations (area chart, bar charts).
- Billing status breakdown (PAID, PENDING, PARTIAL, CANCELLED).
- Recent activity feed.
- Auto-refresh and role-based redirect.
