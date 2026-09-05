# Edit Appointment — Update Booking (edit-appointment-page)

## What is this page?

The Edit Appointment page (`/appointments/$appointmentId/edit`) loads an existing appointment and lets staff change its patient, doctor, date, consultation type, fees, notes, and allergies. It is the same layout as New Appointment but pre-filled from the saved record. There is no time-slot selection — the appointment keeps its date-level booking.

## Actions & Effects

- **Load existing appointment** — On mount, fetches the appointment by ID. Effect: the form is pre-filled with patient, doctor, type, fee, registration fee, date, notes, and the patient's allergies.
- **Date / next-day shortcuts** — Change `form.date`; the selected doctor is cleared.
- **Patient change** — Search and select a different patient. Effect: fetches full details, replaces allergies and the info card; the appointment will be re-pointed to the new patient's record (patient ID is updated when the form is submitted).
- **Edit patient (pencil)** — Opens the PatientFormSheet to edit the linked patient's details.
- **Doctor change** — Re-picks a doctor and auto-fills the fee.
- **Consultation type / fees / notes** — Editable as on New Appointment.
- **Save Changes** — Requires patient + doctor + type. Effect: if the patient's allergies changed, `updatePatient` runs first; then `updateAppointment` saves doctor, date, type, fee, registration fee, and notes; invalidates `appointments`, the appointment detail, and `queue` caches; toasts success; navigates back to the appointments list.
- **Save & Pay** — Saves the appointment then calls `checkoutAppointment` with the payment sheet values. Effect: additionally invalidates `billing`; toasts success; navigates back.
- **Cancel / Back to Appointments** — Discards changes and returns to the list.

## Events

- **Appointment fetch** — Runs on mount; shows a loading state until the record returns, and an "Appointment not found" state if the ID is invalid.
- **Visit history** — Fetching the selected patient's past appointments drives the "Past visits" panel.

## Features

- Same booking form as New Appointment, pre-filled and editable.
- Token-number badge next to the title when the appointment has one.
- Allergy sync — changes to allergies also update the patient record.
- Save and Save & Pay actions with the shared PaymentSheet.
