# Prescription Fulfillment — Report (prescription-fulfillment-page)

## What is this page?

The Prescription Fulfillment report (`/_dashboard/reports/prescription-fulfillment`) tracks prescription statuses over a date range and lists unfulfilled prescriptions older than 3 days so the pharmacy can catch up on pending dispensing.

## Actions & Effects

- **From / To date pickers** — Defaults to the last 90 days. Effect: changing either refetches the report.
- **Review unfulfilled list** — Read-only table: prescription ID, patient, doctor ID, and days pending. Rows older than 7 days get a red badge.

## Events

- **Data fetch** — Runs on mount and whenever the range changes.
- **Status breakdown** — ACTIVE (warning), DISPENSED (good), CANCELLED (critical) shown as a donut chart and summary rows.

## Features

- Donut chart + summary of prescription statuses.
- Unfulfilled prescriptions table (older than 3 days) for follow-up.
- Days-pending alert threshold at 7+ days.
