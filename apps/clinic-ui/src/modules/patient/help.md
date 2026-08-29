# Patient Portal — My Healthcare

## What is this module?

The Patient module (`/patient`) is the self-service portal for logged-in patients. It shows their appointments, prescriptions, and bills — a read-only summary of their healthcare records. The portal has no write actions; it is informational.

## Pages (per-page help files)

- **Patient Dashboard** (`/patient`) — `components/patient-dashboard-page.help.md` — overview with stat cards and recent lists.
- **Patient Appointments** (`/patient/appointments`) — `components/patient-appointments-page.help.md` — full appointment list.
- **Patient Bills** (`/patient/bills`) — `components/patient-bills-page.help.md` — invoices raised against visits.
- **Patient Prescriptions** (`/patient/prescriptions`) — `components/patient-prescriptions-page.help.md` — issued prescriptions.
- **Patient Lab Reports** (`/patient/lab-orders`) — `components/patient-lab-orders-page.help.md` — placeholder (not available yet).

## Shared Actions & Effects

- **Browse records** — All pages are read-only. Effect: none.
- **No linked patient** — If the account has no patient record, pages show a notice to contact clinic staff.

## Events

- **Data fetch** — Every page fetches data filtered by the logged-in user's `userableId` (appointments/prescriptions/bills, limits 10–50).

## Features

- Color-coded status badges (appointments, prescriptions, bills).
- Stat cards on the dashboard (Upcoming, Prescriptions, Lab Tests, Bills).
- Loading skeletons and empty states throughout.
