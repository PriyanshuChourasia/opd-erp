# Appointments List — Appointment & Queue (appointments-page)

## What is this page?

The Appointments page (`/appointments`) is the operational list of all appointments. It shows the token number, patient, status, doctor, type, time, fee, and row actions for every appointment, with tabs to switch between Appointments and the live Queue. It also embeds invoice generation, rescheduling, prescription creation, and appointment-slip printing.

## Actions & Effects

- **Book Appointment** (non-receptionist) — Navigates to `/appointments/new`. Effect: opens the booking form.
- **Filter: All / Today / Tomorrow / date picker** — Sets `filterDate` and resets to page 1. Effect: refetches the appointment list for that date (date filter is ignored when a search query is active).
- **Search (patient name, phone, or token #)** — Debounced 300 ms; sets `search` and resets to page 1. Effect: refetches with the search term; a search clears the date filter.
- **Doctor filter search** — Picks a doctor and resets pagination. Effect: list refetches with `doctorId`.
- **Status filter dropdown** — Filters by SCHEDULED / CONFIRMED / CHECKED_IN / IN_PROGRESS / COMPLETED / CANCELLED / RESCHEDULED / NO_SHOW. Effect: refetches with `status`.
- **Created-by (employee) filter** — Filters by the employee who created the appointment. Effect: refetches with `createdById`.
- **Change status dropdown (row)** — Updates the appointment status. Effects: calls `updateAppointmentStatus`; invalidates the `appointments` cache and shows "Appointment status updated". Selecting CANCELLED asks for an optional reason first; selecting RESCHEDULED sets the status directly (change date/doctor via the Eye icon); selecting CHECKED_IN also invalidates the `queue` cache (the patient enters the live queue).
- **Eye (view/edit) icon** — Navigates to `/appointments/$appointmentId/edit`. Effect: opens the edit page for that appointment.
- **Printer icon** — Opens the Appointment Slip Preview dialog. Effect: renders a printable slip; "Download PDF" generates a PDF via html2pdf; "Print" opens a browser print window.
- **Create prescription (COMPLETED rows)** — Opens the Create Prescription sheet. Effect: entering a diagnosis + required doctor's remarks and confirming calls `createPrescription` with a "Verbal Instructions" item; invalidates `prescriptions`; closes the sheet.
- **Generate invoice (COMPLETED + unpaid rows)** — Opens the Invoice Preview sheet with the appointment's line items pre-filled. Effect: adjusting discount/tax/payment method and confirming calls `checkoutAppointment`; invalidates `appointments`; shows "Invoice generated successfully". The row then shows a "Paid" badge with the invoice number.
- **Bulk "Generate N invoices"** — Runs checkout sequentially for all COMPLETED appointments without bills. Effect: creates invoices one at a time (sequential on purpose so invoice numbers don't collide); toasts the number succeeded/failed; invalidates `appointments`.
- **Reschedule** — Open the appointment via the Eye (view/edit) icon and change its date/doctor on the Edit Appointment page; no time-slot selection.
- **Queue tab** — Switches the embedded panel to the Queue page component.

## Events

- **Invoice preview load** — When the preview sheet opens for an appointment, fetches `fetchAppointmentInvoicePreview(id)`; the Generate button stays disabled until the preview returns.
- **Prescription notes lookup** — On load, fetches up to 500 prescriptions and maps the latest notes per patient+doctor, displayed as italic blue text under the patient name.
- **Search debounce** — Typing in the search box triggers a refetch 300 ms after the last keystroke.
- **Doctors/users lists** — Fetched once (limit 100) to populate the filter dropdowns.

## Features

- Paginated DataTable (100 rows/page) with token, patient, status badge, doctor, type, time, fee, and action column.
- Status badges color-coded per status; CHECKED_IN renders as "In-Queue".
- Embedded Appointments / Queue tabs.
- Invoice preview with line items, discount/tax, payment method (CASH/CARD/UPI).
- Appointment slip preview with PDF download and browser print.
- Rescheduling via the appointment's Edit page (no time-slot picking).
