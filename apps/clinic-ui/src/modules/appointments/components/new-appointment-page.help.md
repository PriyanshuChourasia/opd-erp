# New Appointment — Booking Form (new-appointment-page)

## What is this page?

The New Appointment page (`/appointments/new`) is the full booking form. It registers or selects a patient, picks a doctor and time slot within the doctor's schedule, chooses a consultation type, and confirms the fee. A patient info card and invoice-style fee summary are shown live as the form fills.

## Actions & Effects

- **Date picker / Tomorrow / next-day shortcuts** — Sets `form.date` and clears doctor + slot. Effect: re-computes which doctors are scheduled that day (`availableDoctorIds`) and reloads slots for the selected doctor.
- **Patient search** — Type ≥1 char to search patients by name/phone (limit 8). Effect: selecting a patient fetches full patient details (fetchPatient) which auto-populates allergies and the info card; clears the selection to change patient.
- **Register Patient** — Opens the PatientFormSheet. Effect: on save, the new patient is selected and `registrationFee` resets to default.
- **Edit patient (pencil)** — Opens the PatientFormSheet pre-filled for editing. Effect: saving updates the patient record.
- **Allergy select** — Adds/removes allergies on the booking. Effect: on booking, if the selected patient's saved allergies differ, `updatePatient` is called first so the patient record is kept in sync.
- **Doctor search** — Lists only doctors scheduled on the chosen date, showing their hours. Effect: selecting a doctor auto-fills the consultation fee, loads the slot grid, and enables booking.
- **New Doctor** — Opens the "Add New Doctor" sheet. Effect: creating a doctor with login credentials calls `createDoctorWithUser`; the new doctor is auto-selected and its consultation fee is used; doctor and schedule caches are invalidated.
- **Slot selection** — Time input + 30-minute slot grid from the doctor's schedule hours. Effect: slot is validated against schedule bounds, the current time (past slots blocked for today), and already-booked slots (shown struck-through); selecting a slot sets `form.slot`.
- **Consultation type** — 6 types: Walk-in, Consultation, Specialist, Emergency, Follow-up, Teleconsultation. Effect: sets `form.type`; required before booking.
- **Fee / Registration fee inputs + ₹ preset chips** — Edits the fee amounts. Effect: the Total updates live; registration fee defaults from the organisation setting.
- **Notes** — Optional free text saved with the appointment.
- **Book** — Requires patient + doctor + slot + type. Effect: calls `createAppointment`; invalidates `appointments` and `doctor-slots` caches; toasts success; navigates back to the appointments list (or receptionist appointments).
- **Book & Pay** — Same validation, then opens the PaymentSheet. Effect: creates the appointment, calls `checkoutAppointment` with payment method/discount/tax; invalidates `appointments`, `doctor-slots`, and `billing`; toasts success; navigates back.
- **Cancel** — Returns to the appointments list without saving.

## Events

- **Patient details fetch** — Selecting a patient triggers `fetchPatient`; the allergy list and patient info card update from the response.
- **Doctor availability** — On load and on date change, all doctors' EmployeeSchedules are fetched to determine who works on the selected day.
- **Slot availability** — `fetchDoctorSlots(doctorId, date)` runs when a doctor and date are chosen; booked slots are marked unavailable.
- **Visit history** — Selecting a patient fetches their last 10 appointments; completed ones appear under "Past visits".

## Features

- Two-column layout: left = patient → allergies → doctor → slot/type → notes; right = patient info card + fee summary.
- Patient info card with gender, age/DOB, blood group, email, address, emergency contact, allergy chips, and past-visits accordion.
- Invoice-style fee summary with consultation fee, registration fee presets (₹50–500), and live total.
- Schedule-aware slot grid with booked/past slots disabled.
