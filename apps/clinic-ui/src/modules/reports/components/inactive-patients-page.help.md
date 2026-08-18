# Inactive Patients — Report (inactive-patients-page)

## What is this page?

The Inactive Patients report (`/_dashboard/reports/inactive-patients`) lists patients who haven't visited in a while, so the clinic can reach out for follow-up and reactivation.

## Actions & Effects

- **Days-since threshold select** — Choose 30 / 60 / 90 / 180 / 365 days. Effect: resets to page 1 and refetches the list with the new threshold.
- **Pagination** — Page through the results (page links with ellipsis for large result sets).

## Events

- **Data fetch** — Runs on mount and whenever the threshold or page changes (`useInactivePatients`).

## Features

- Table: Name, Phone, Last visit date, Days since.
- Total count shown in the card title.
- Pagination when results span multiple pages.
