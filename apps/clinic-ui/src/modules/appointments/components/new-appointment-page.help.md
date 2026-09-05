# New Appointment — Booking Form (new-appointment-page)

## What is this page?

The New Appointment page (`/appointments/new`) is the full booking form. It registers or selects a patient, picks a doctor and date, chooses a consultation type, and confirms the fee. A patient info card and invoice-style fee summary are shown live as the form fills. There is no time-slot selection — a booking is recorded for the chosen date only.

## Actions & Effects

- **Date picker / Tomorrow / next-day shortcuts** — Sets the appointment date and clears the selected doctor. Effect: the chosen date is sent with the booking.
- **Patient search** — Type ≥1 char to search patients by name/phone (limit 8). Effect: selecting a patient fetches full patient details (fetchPatient) which auto-populates allergies and the info card; clears the selection to change patient.
- **Register Patient** — Opens the PatientFormSheet. Effect: on save, the new patient is selected and `registrationFee` resets to default.
- **Edit patient (pencil)** — Opens the PatientFormSheet pre-filled for editing. Effect: saving updates the patient record.
- **Allergy select** — Adds/removes allergies on the booking. Effect: on booking, if the selected patient's saved allergies differ, `updatePatient` is called first so the patient record is kept in sync.
- **Doctor search** — Searches all doctors by name or specialization. Effect: selecting a doctor auto-fills the consultation fee and enables booking.
- **New Doctor** — Opens the "Add New Doctor" sheet. Effect: creating a doctor with login credentials calls `createDoctorWithUser`; the new doctor is auto-selected and its consultation fee is used; doctor and schedule caches are invalidated.
- **Consultation type** — 6 types: Walk-in, Consultation, Specialist, Emergency, Follow-up, Teleconsultation. Effect: sets `form.type`; required before booking.
- **Fee / Registration fee inputs + ₹ preset chips** — Edits the fee amounts. Effect: the Total updates live; registration fee defaults from the organisation setting.
- **Notes** — Optional free text saved with the appointment.
- **Book** — Requires patient + doctor + type. Effect: calls `createAppointment`; invalidates the `appointments` cache; toasts success; navigates back to the appointments list (or receptionist appointments).
- **Book & Pay** — Same validation, then opens the PaymentSheet. Effect: creates the appointment, calls `checkoutAppointment` with payment method/discount/tax; invalidates `appointments` and `billing`; toasts success; navigates back.
- **Cancel** — Returns to the appointments list without saving.

## Events

- **Patient details fetch** — Selecting a patient triggers `fetchPatient`; the allergy list and patient info card update from the response.
- **No time-slot picking** — Booking requires only patient + doctor + date + type. Appointments store a nominal 09:00 time; actual visit order is set later by queue check-in, not by the booked time.
- **Visit history** — Selecting a patient fetches their last 10 appointments; completed ones appear under "Past visits".

## Features

- Two-column layout: left = patient → allergies → doctor → consultation type → notes; right = patient info card + fee summary.
- Patient info card with gender, age/DOB, blood group, email, address, emergency contact, allergy chips, and past-visits accordion.
- Invoice-style fee summary with consultation fee, registration fee presets (₹50–500), and live total.
- Booking completes from patient + doctor + date + type — no slot grid.
