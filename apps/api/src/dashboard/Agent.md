# Dashboard Module — Agent Help

## Overview
Provides aggregated statistics and chart data for the clinic dashboard home screen.

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/dashboard/stats` | Get summary statistics |
| GET | `/dashboard/charts` | Get chart data for visualization |

## Architecture
- `DashboardController` → `DashboardService`
- Aggregates data from multiple modules (appointments, patients, doctors, billing, queue).

## Data Returned

### Stats
- Total patients, appointments, doctors
- Today's appointments count
- Pending bills count
- Queue status breakdown
- Revenue summaries (daily, weekly, monthly)

### Charts
- Appointment trends over time
- Revenue summaries
- Patient visit distribution
- Doctor workload analytics

## Important Notes
- Dashboard data is computed in real-time from the database.
- For large datasets, consider caching or materialized views.
- Charts data is structured for use with charting libraries (Chart.js, Recharts, etc.).
