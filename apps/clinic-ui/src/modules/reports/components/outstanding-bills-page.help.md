# Outstanding Bills — Report (outstanding-bills-page)

## What is this page?

The Outstanding Bills report (`/_dashboard/reports/outstanding-bills`) surfaces unpaid and partially paid invoices, grouped into aging buckets (e.g. 0–30 days, 31+ days overdue) with a full itemized list.

## Actions & Effects

- **Browse aging buckets** — Read-only stat cards: amount + bill count per age bucket. The 31+ bucket is labeled "(overdue)".
- **Browse the outstanding list** — Read-only table of invoice no, patient, phone, amount, age (days), and status. Rows older than 30 days are highlighted.

## Events

- **Data fetch** — Runs once on mount (`useOutstandingBills`); no date-range filter.

## Features

- Aging-bucket summary cards (3 buckets).
- Table with overdue highlighting and status badges.
- Useful for follow-up: identify bills that need collection calls.
