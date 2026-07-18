# Appointments — Booking & Scheduling

## What is this page?

The Appointments page (`/appointments`) handles the full appointment lifecycle — from booking new appointments to tracking their status through check-in, consultation, and completion. It is the central scheduling hub for the clinic.

## What actions can be done?

- **Book new appointment** — Click "New Appointment" to open the booking sheet. Search and select a patient, choose a department and doctor, pick a consultation type, select an available time slot, set the fee, and confirm.
- **Create new patient inline** — From the booking sheet, click "New patient" to open the patient registration form without leaving the page.
- **Advance appointment status** — Move through the workflow: SCHEDULED → CONFIRMED → CHECKED_IN → IN_PROGRESS → COMPLETED.
- **Cancel appointment** — Cancel with an optional reason.
- **Mark no-show** — Mark a patient who didn't arrive as NO_SHOW.
- **Generate invoice (direct)** — For completed appointments, generate a bill directly.
- **Generate invoice (POS)** — Redirect to the POS screen with the appointment pre-filled for checkout.
- **Bulk invoice generation** — Select multiple completed appointments without bills and generate all invoices at once.
- **Filter by doctor** — Click doctor filter chips to view appointments for a specific doctor.
- **Filter by date** — Use Today/Tomorrow buttons or a date picker to filter.
- **Search** — Search by patient name, phone, or token number.

## What features does it hold?

- **Paginated DataTable** — Token #, patient, status, doctor, type, time, fee, and action buttons.
- **6 consultation types** — Walk-in (₹100), Consultation (₹300), Specialist (₹500), Emergency (₹800), Follow-up (₹150), Teleconsultation (₹250).
- **Smart slot picker** — Time slots are generated from the doctor's EmployeeSchedule. Only shows slots when the doctor is scheduled. Unavailable slots are grayed out.
- **Department/doctor cascade** — Selecting a department filters the doctor list. Selecting a doctor loads available slots.
- **Fee auto-fill** — Consultation fee auto-fills based on consultation type or doctor's configured fee.
- **Status workflow badges** — Color-coded badges for each status.
- **Auto-refresh** — Appointments refresh every 15 seconds.
- **Token auto-numbering** — Tokens are automatically assigned per doctor per day.
