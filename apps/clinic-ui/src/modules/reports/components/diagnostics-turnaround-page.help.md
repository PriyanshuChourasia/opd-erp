# Diagnostics Turnaround — Report (diagnostics-turnaround-page)

## What is this page?

The Diagnostics Turnaround report (`/_dashboard/reports/diagnostics-turnaround`) measures how long diagnostic orders take to complete — average hours by order type, plus a status breakdown — so bottlenecks in lab/radiology flow can be spotted.

## Actions & Effects

- **From / To date pickers** — Defaults to the last 90 days. Effect: changing either refetches the report.

## Events

- **Data fetch** — Runs on mount and whenever the range changes.

## Features

- Bar chart: average turnaround hours by order type/category.
- Bar chart: order status breakdown (count by status).
- Empty states when no completed orders or no orders exist in the range.
