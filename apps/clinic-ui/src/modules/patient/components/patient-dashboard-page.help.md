# Patient Dashboard — My Healthcare Summary (patient-dashboard-page)

## What is this page?

The Patient Dashboard (`/patient`) is the logged-in patient's home screen. It summarizes their appointments, prescriptions, and bills in one place with quick stat cards and recent lists.

## Actions & Effects

- **Browse upcoming appointments** — Read-only list of SCHEDULED/CONFIRMED appointments (max 5). Effect: none; informational.
- **Browse recent visits** — Read-only list of COMPLETED/CANCELLED/NO_SHOW appointments (max 5).
- **Browse recent prescriptions** — Read-only list (max 4) with diagnosis, date, and status (DISPENSED green / ACTIVE blue / other gray).
- **Browse recent bills** — Read-only list (max 4) with invoice number, date, total, and status badge.
- **No linked patient** — If the account has no patient record, a notice asks the user to contact clinic staff.

## Events

- **Data fetch** — On load, three queries run (appointments, prescriptions, bills), all filtered to the logged-in user's `userableId`.
- **Lab Tests stat** — Placeholder card that always shows "—" (lab reports not yet wired up).

## Features

- 4 stat cards: Upcoming, Prescriptions, Lab Tests, Bills.
- Two-column card layout: Upcoming Appointments / Recent Visits, then Recent Prescriptions / Recent Bills.
- Color-coded status badges for appointments, prescriptions, and bills.
