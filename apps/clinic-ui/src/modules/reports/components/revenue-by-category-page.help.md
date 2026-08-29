# Revenue by Category — Report (revenue-by-category-page)

## What is this page?

The Revenue by Category report (`/_dashboard/reports/revenue-by-category`) shows total revenue for a date range, broken down by item type (bar chart) and by payment method (pie chart).

## Actions & Effects

- **From / To date pickers** — Defaults to the current month-to-date. Effect: changing either refetches the report for the new range; charts and the total update.

## Events

- **Data fetch** — Runs on mount and whenever the date range changes (`useRevenueByCategory`).
- **Empty range** — If the range has no data, "No data for this range" is shown instead of charts.

## Features

- Total revenue stat card (₹, formatted with the app's currency util).
- Horizontal bar chart: revenue by item type.
- Pie chart: revenue by payment method (CASH/CARD/UPI) with labels.
