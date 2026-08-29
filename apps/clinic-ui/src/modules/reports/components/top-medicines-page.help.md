# Top Medicines — Report (top-medicines-page)

## What is this page?

The Top Medicines report (`/_dashboard/reports/top-medicines`) ranks the most dispensed medicines over a date range, both by quantity (volume) and by revenue, using horizontal bar charts.

## Actions & Effects

- **From / To date pickers** — Defaults to the last 90 days. Effect: changing either refetches the report; both charts update.

## Events

- **Data fetch** — Runs on mount and whenever the range changes (`useTopMedicines`).
- **Empty range** — Per-chart "No dispensing data in this range" / "No bill data in this range" states.

## Features

- "By Volume" chart: medicine vs. quantity dispensed.
- "By Revenue" chart: medicine vs. revenue in ₹.
- Useful for stock planning: which medicines to keep in inventory.
