# POS Appointments — Appointment List (pos-appointments-page)

## What is this page?

The POS Appointments page (`/pos/appointments`) shows the appointment list inside the POS workspace. It is the same implementation as the dashboard Appointments page (it re-exports `AppointmentsPage`), so every action, effect, and event is identical to the shared page — including status changes, filters, invoice generation, rescheduling, prescription creation, and slip printing.

## Actions & Effects

See `modules/appointments/components/appointments-page.help.md` for the full breakdown. Highlights:

- **Book Appointment** — Navigates to the new-appointment flow.
- **Status dropdown (row)** — Advances/cancels/reschedules the appointment; CHECKED_IN also refreshes the queue.
- **Generate invoice / Bulk invoices** — Checkout flows for completed, unpaid appointments.
- **Create prescription** — Records the doctor's remarks as a prescription for a completed appointment.
- **Print slip** — Opens the appointment slip preview in the browser print dialog (save-as-PDF available from there).
- **Filters** — Date, doctor, status, created-by, and free-text search, all resetting pagination on change.

## Events

- **Search debounce** — 300 ms after typing.
- **Invoice preview fetch** — Loads line items before generating an invoice.
- **Prescription notes lookup** — Latest doctor notes per patient+doctor shown under the patient name.
- **Queue tab** — Embeds the Queue page for switching between appointments and the live queue.
