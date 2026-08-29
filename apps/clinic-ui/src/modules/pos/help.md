# POS — Point of Sale

## What is this module?

The POS module (`/pos`) is the cash-register workspace for the clinic. It combines checkout (cart → bill), billing (invoice list), patient search/registration, and the appointment list in one place, so counter staff can sell medicines and bill consultations without leaving the POS area.

## Pages (per-page help files)

- **POS Checkout** (`/pos`) — `components/pos-checkout-page.help.md` — build a cart, apply discount, choose payment, complete the sale.
- **POS Billing** (`/pos/billing`) — `components/pos-billing-page.help.md` — invoice list (shared BillingPage).
- **POS Patients** (`/pos/patients`) — `components/pos-patients-page.help.md` — search/register patients and view appointment history.
- **POS Appointments** (`/pos/appointments`) — `components/pos-appointments-page.help.md` — appointment list (shared AppointmentsPage).

## Shared Actions & Effects

- **Complete sale** — Creates the bill from the cart; clears the cart; for appointment-driven sales, invalidates appointments and returns to the checkout landing.
- **Mark paid / refund / cancel** — Bill status transitions in the billing list; each invalidates the bills cache.
- **Register / edit patient** — PatientFormSheet create/update; the patient list refetches.
- **Generate invoice from a completed appointment** — Opening `/pos?appointmentId=…` pre-fills patient and line items for immediate checkout.

## Events

- **Auto-refresh** — The billing list refetches every 15 seconds to catch sales made elsewhere.
- **Invoice pre-fill** — Checkout with an `appointmentId` search param fetches the invoice preview on mount and loads the patient + line items into the cart; already-invoiced appointments are blocked.
- **Organisation settings** — Discount enablement and max discount percent are read from the organisation profile and cap the discount inputs.
- **Appointment → POS link** — The Queue page navigates to `/pos?appointmentId=…` to bill a completed appointment.

## Features

- Editable cart table with qty steppers and inline pricing.
- Walk-in sales (no patient required).
- Discount modes (% / flat) with organisation caps.
- Payment methods: CASH, CARD (cardholder + validity fields), UPI (UPI ID field).
- Shared page implementations reused from the appointments and billing modules.
