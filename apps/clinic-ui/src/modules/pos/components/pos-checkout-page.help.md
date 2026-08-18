# POS Checkout — Point of Sale (pos-checkout-page)

## What is this page?

The POS Checkout page (`/pos`) is the cash-register screen. Staff search a patient (or leave blank for walk-in), add medicines from the catalog into a cart, apply discounts, choose a payment method, and complete the sale — which creates the bill. When opened with an `appointmentId` search param (from the Queue or Appointments page), it pre-fills the patient and the appointment's invoice line items so a completed consultation can be billed immediately.

## Actions & Effects

- **Patient search** — Type ≥1 char to search by name/phone. Effect: selecting a patient attaches them to the sale (badge shows their name); clearing makes it a walk-in sale.
- **Medicine search** — Live search of the medicine catalog. Effect: clicking a medicine adds it to the cart (qty 1, unit price from catalog) and clears the search box.
- **Cart line edits** — Each line has a description input, qty stepper (−/+, min 1), unit-price input, and remove (trash) button. Effect: subtotal and total recalculate live from cart contents.
- **Discount mode toggle (% / Flat)** — Switches how the discount value is interpreted. Effect: percent discounts are capped at the organisation's `maxDiscountPercent` (default 50%); flat discounts are capped at the subtotal.
- **Discount value input** — Sets the discount amount. Effect: total = subtotal − discount (never below 0).
- **Payment method** — CASH / CARD / UPI buttons. Effect: CARD reveals cardholder name + start/expiry month fields; UPI reveals a UPI ID field; CASH needs nothing extra.
- **Complete sale** — Requires a non-empty cart. Effect: calls `createBill` with patient (optional), appointment (optional), items, discount, and payment method; toasts "Sale completed successfully"; clears the cart and patient; if the sale was for an appointment, invalidates `appointments` and navigates back to `/pos` (the checkout list).
- **Already-invoiced guard** — If the appointment already has a bill, the page blocks checkout and shows the invoice number with a "Back to checkout" button.

## Events

- **Invoice pre-fill** — When `appointmentId` is present, fetches the invoice preview on mount. Effect: if not already invoiced, the patient and line items are loaded into the cart automatically.
- **Organisation settings** — Fetched on load to determine discount enablement and the max discount percent; discount input is capped by these values.

## Features

- Two-column layout: cart builder (patient + medicine) and a sticky order summary.
- Editable cart table with inline qty/price controls.
- Walk-in support (no patient required).
- Appointment-driven invoicing with pre-filled consultation fees.
- Organisation-controlled discount caps.
