# Patient Demographics — Report (patient-demographics-page)

## What is this page?

The Patient Demographics report (`/_dashboard/reports/patient-demographics`) gives a population-level view of the patient base: a 12-month new vs. returning patient trend (area chart) plus breakdowns by gender, blood group, and age group.

## Actions & Effects

- **Browse the breakdowns** — Read-only charts and lists. Effect: none.

## Events

- **Data fetch** — Runs once on mount (`usePatientDemographics`); no date filter.

## Features

- Area chart: new vs. returning patients per month (12 months).
- Pie chart: patients by gender.
- Lists: patients by blood group and by age group.
- Useful for understanding the clinic's patient mix and growth.
