# Doctor Performance — Report (doctor-performance-page)

## What is this page?

The Doctor Performance report (`/_dashboard/reports/doctor-performance`) compares doctors over a date range — revenue per specialization (bar chart) and a per-doctor table of appointment counts, no-show rate, and revenue.

## Actions & Effects

- **From / To date pickers** — Defaults to the last 30 days. Effect: changing either refetches the report; chart and table update.

## Events

- **Data fetch** — Runs on mount and whenever the range changes (`useDoctorPerformance`).
- **Empty range** — Shows "No data for this range".

## Features

- Bar chart: revenue by specialization.
- Table: Doctor, Total Appts, Completed, No-show, No-show rate, Revenue.
- No-show rate > 15% is flagged with a red badge — a signal for follow-up with the doctor.
