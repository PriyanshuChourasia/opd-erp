# Reports — Clinic Analytics

## What is this module?

The Reports module (`/_dashboard/reports/*`) provides analytics dashboards that turn clinic data into actionable insights. Each report is a standalone page focused on one question — revenue, doctor productivity, prescription flow, patient population, or appointment behavior. Most reports accept a date range; changing it refetches the data for that window.

## Pages (per-page help files)

- **Revenue by Category** (`/reports/revenue-by-category`) — `components/revenue-by-category-page.help.md` — total revenue by item type and payment method.
- **Outstanding Bills** (`/reports/outstanding-bills`) — `components/outstanding-bills-page.help.md` — unpaid/partial invoices by aging bucket.
- **Doctor Performance** (`/reports/doctor-performance`) — `components/doctor-performance-page.help.md` — revenue and no-show stats per doctor.
- **Prescription Fulfillment** (`/reports/prescription-fulfillment`) — `components/prescription-fulfillment-page.help.md` — prescription statuses and unfulfilled orders.
- **Top Medicines** (`/reports/top-medicines`) — `components/top-medicines-page.help.md` — most dispensed medicines by volume and revenue.
- **Patient Demographics** (`/reports/patient-demographics`) — `components/patient-demographics-page.help.md` — new vs. returning trend and population breakdowns.
- **Inactive Patients** (`/reports/inactive-patients`) — `components/inactive-patients-page.help.md` — patients who haven't visited, for follow-up.
- **Diagnostics Turnaround** (`/reports/diagnostics-turnaround`) — `components/diagnostics-turnaround-page.help.md` — order completion time by type.
- **Appointment Mix** (`/reports/appointment-mix`) — `components/appointment-mix-page.help.md` — type/status distribution and cancellation reasons.

## Shared Actions & Effects

- **Date range filters** — From/To pickers (defaults: current month, 30 days, or 90 days depending on the report). Effect: refetches the report for the new range.
- **Threshold/pagination** — Inactive Patients lets you pick the days-since threshold and page through results.
- **Read-only** — Reports never mutate data.

## Events

- **Data fetch** — Each report queries its own endpoint on mount and on filter change; empty ranges render "No data for this range".
- **Alert thresholds** — No-show rate > 15% (Doctor Performance) and unfulfilled prescriptions > 7 days are highlighted.

## Features

- Recharts visualizations (bar, pie, area, donut) styled with app design tokens.
- Aging buckets with overdue highlighting.
- Shared `data/` layer (api, interface, hooks, utils) reused by all report pages.
