# Billing — Invoice Management

## What is this page?

The Billing page (`/billing`) manages all financial invoices generated from patient visits. Invoices are created either through the appointment checkout flow or the POS system. This page provides a complete overview of the clinic's billing status.

## What actions can be done?

- **View invoices** — Browse the paginated list of all invoices with invoice number, patient, payment method, status, date, and total amount.
- **Mark as paid** — Change a PENDING or PARTIAL invoice to PAID status.
- **Refund** — Process a refund on a paid invoice.
- **Cancel invoice** — Cancel a pending or partial invoice.
- **Search** — Search invoices by patient name or invoice number.
- **Filter by status** — View PAID, PENDING, PARTIAL, REFUNDED, or CANCELLED invoices.

## What features does it hold?

- **Paginated DataTable** — Invoice #, patient name, payment method icon (CASH/CARD/UPI), status badge, date, and total amount in ₹.
- **Status badges** — Color-coded: PAID (green), PENDING (amber), PARTIAL (blue), REFUNDED (gray), CANCELLED (red).
- **Payment method indicators** — Visual icons for CASH, CARD, and UPI payment methods.
- **Auto-refresh** — Invoice data refreshes every 15 seconds.
- **Invoice line items** — Each invoice contains detailed line items (consultation fees, medicines, lab tests, etc.).
- **Auto-generated invoice numbers** — Sequential invoice numbers in `INV-YYMM-XXXXX` format.
