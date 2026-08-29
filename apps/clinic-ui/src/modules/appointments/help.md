# Appointments — Booking & Scheduling

## What is this module?

The Appointments module handles the full appointment lifecycle — booking, rescheduling, status tracking (SCHEDULED → CONFIRMED → CHECKED_IN → IN_PROGRESS → COMPLETED), invoicing, and slip printing. It is the central scheduling hub of the clinic and is shared by the dashboard (`/appointments`), receptionist, and POS workspaces.

## Pages (per-page help files)

- **Appointments List** (`/appointments`) — `components/appointments-page.help.md` — the operational list with filters, status actions, invoice generation, rescheduling, prescriptions, and printing.
- **New Appointment** (`/appointments/new`) — `components/new-appointment-page.help.md` — the full booking form.
- **Edit Appointment** (`/appointments/$appointmentId/edit`) — `components/edit-appointment-page.help.md` — update an existing booking.

## Shared Actions & Effects

- **Book** — Creates the appointment (token auto-assigned per doctor per day), invalidates the appointments + slot caches, toasts success, navigates to the list.
- **Book & Pay** — Creates the appointment then checkouts it with the payment method; additionally invalidates the billing cache.
- **Advance status** — Changing status calls `updateAppointmentStatus`; CHECKED_IN also refreshes the live queue; CANCELLED optionally records a reason; RESCHEDULED opens the reschedule flow.
- **Generate invoice** — Checkout of a completed appointment creates the bill; the row then shows a Paid badge with the invoice number.
- **Create prescription** — Records diagnosis + doctor's remarks as a prescription (with a "Verbal Instructions" item when no medicines are added).
- **Reschedule** — Changes date/doctor/slot and reloads slot availability.
- **Print slip** — Generates an appointment slip PDF (html2pdf) or prints via the browser.

## Events

- **Auto-refresh** — Appointment lists refresh on data mutations; the receptionist dashboard refreshes every 15 seconds.
- **Search debounce** — 300 ms after typing before refetching.
- **Slot availability** — `fetchDoctorSlots(doctorId, date)` runs whenever doctor or date changes; unavailable/past/booked slots are disabled.
- **Doctor schedule awareness** — Doctors only appear for days they are scheduled (EmployeeSchedule); the doctor's hours are shown in the picker.
- **Prescription notes lookup** — The list shows the latest doctor notes per patient+doctor.

## Features

- Paginated DataTable with token #, patient, status, doctor, type, time, fee, and row actions.
- 6 consultation types: Walk-in (₹100), Consultation (₹300), Specialist (₹500), Emergency (₹800), Follow-up (₹150), Teleconsultation (₹250).
- Fee auto-fill from consultation type or the doctor's configured fee; registration fee preset chips (₹50–₹500) with organisation default.
- Patient info card with allergies and past-visit history.
- Bulk invoice generation for completed, unpaid appointments.
