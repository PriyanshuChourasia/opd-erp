# Receptionist — Front Desk Dashboard

## What is this page?

The Receptionist area (`/_receptionist/receptionist/`) is the landing workspace for desk staff. It combines a quick overview of clinic activity with rapid booking, appointment tracking, and queue management on one screen, via four tabs: Overview, Quick Appointment, Appointments, and Queues.

## Actions & Effects

- **Book a new appointment** — Opens the booking sheet (from Overview or Quick Appointment). Effect: search/register a patient, pick a doctor and consultation type for the chosen date; on confirm calls `createAppointment`; invalidates the appointments and dashboard caches; toasts "Appointment booked successfully". There is no time-slot selection — the booking is recorded for the date, and visit order is set later at queue check-in.
- **Register patient inline** — From the patient search, "Register Patient". Effect: creates the patient, selects them, and resets the registration fee to default; toasts "Patient registered successfully".
- **Create doctor inline** — From the doctor search, "New Doctor". Effect: calls `createDoctorWithUser`; the doctor is auto-selected with their consultation fee; invalidates doctors + schedules; toasts "Doctor created and selected".
- **Book & Pay** — Books the appointment, then opens the PaymentSheet. Effect: additionally calls `checkoutAppointment` (payment method, discount, tax); invalidates billing; toasts "Appointment booked and paid successfully".
- **Visit history hint** — When a returning patient is selected, past completed visits are shown with a suggestion to book Follow-up.
- **Track today's appointments** — Overview shows today's appointments with token, Paid/Unpaid badges, and a totals footer (auto-refresh).
- **Manage queues** — The Queues tab embeds the Queue page (status changes, skip, no-show, delete).

## Events

- **Auto-refresh** — Today's appointments and queue refetch every 15 seconds.

## Features

- 5 stat tiles: today's appointments, patients in queue, registered patients, pending prescriptions, today's revenue.
- Quick booking sheet with inline patient/doctor registration, allergy select, consultation types, fee + registration fee presets, and notes — no slot grid.
- Tabbed layout: Overview / Quick Appointment / Appointments / Queues.
