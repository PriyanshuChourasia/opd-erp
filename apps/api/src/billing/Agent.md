# Billing Module — Agent Help

## Overview
Handles billing and invoicing — bill creation, listing, status updates, and removal.

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/billing` | Create a new bill |
| GET | `/billing` | List bills (with filters) |
| GET | `/billing/:id` | Get bill details |
| PATCH | `/billing/:id/status` | Update bill payment status |
| DELETE | `/billing/:id` | Delete a bill |

## DTOs
- `CreateBillDto` — appointmentId?, patientId, items (itemId, type, quantity, rate, amount), totalAmount, discount?, tax?, paymentMethod?, notes?
- `UpdateBillStatusDto` — status (PENDING, PAID, PARTIALLY_PAID, CANCELLED, REFUNDED)
- `FindBillsQueryDto` — patientId?, appointmentId?, status?, dateFrom?, dateTo?, page?, limit?

## Architecture
- `BillingController` → `BillingService`
- Bills can be standalone or linked to appointments.
- Supports itemized billing with multiple line items.

## Important Notes
- Bill items can reference different entity types (consultation, medicine, lab, radiology, procedure).
- Payment status transitions: PENDING → PAID / PARTIALLY_PAID, or CANCELLED / REFUNDED.
- Total amount is calculated from items + tax - discount.
- Bills are created during appointment checkout or independently.
