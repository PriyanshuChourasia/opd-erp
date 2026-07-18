# Point of Sale (POS) — Checkout & Billing

## What is this page?

The POS page (`/pos`) is a full-width cashier terminal for processing patient sales. Unlike the dashboard layout, POS has no sidebar — it uses a slim top bar with navigation tabs (POS, Patients, Appointments, Billing) for a focused checkout workflow. This is the primary screen for Receptionist role users.

## What actions can be done?

- **Search and select patient** — Search by name or phone, or use "Walk-in" for unregistered patients.
- **Add medicines to cart** — Search the medicine catalog by name and add items to the cart with quantity and price.
- **Add custom items** — Add non-medicine line items (e.g. consultation fee, lab test) with custom names and prices.
- **Edit cart items** — Change quantity or unit price for any cart line.
- **Remove items** — Delete items from the cart.
- **Apply discount** — Toggle between percentage (%) or flat amount discount and enter the value.
- **Select payment method** — Toggle between CASH, CARD, or UPI.
- **Complete sale** — Process the payment and generate an invoice.
- **Pre-fill from appointment** — Access via `/pos?appointmentId=xxx` to auto-populate the checkout from a completed appointment's invoice preview.

## What features does it hold?

- **Full-width layout** — No sidebar; maximizes the cashier workspace.
- **Patient search** — Real-time search with patient selection.
- **Medicine catalog search** — Search by name with results showing price, category, and stock info.
- **Shopping cart** — Editable table with quantity, unit price, line total, and remove buttons.
- **Discount system** — Toggle between percentage and flat discount with live total calculation.
- **Order summary sidebar** — Shows subtotal, discount, and grand total in ₹.
- **Payment method toggle** — Visual CASH/CARD/UPI toggle buttons.
- **Invoice generation** — Creates a bill with line items, tax, and payment method.
- **Appointment integration** — Can be launched from an appointment's checkout action to pre-fill patient and consultation fee.
