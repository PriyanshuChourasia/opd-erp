# Doctors — Doctor Management

## What is this page?

The Doctors page (`/doctors`) manages the clinic's doctor roster. It allows administrators to register new doctors (optionally with a linked user account), manage professional credentials, set up weekly work schedules, and handle verification status.

## What actions can be done?

- **Create doctor with user account** — Register a new doctor with professional details (specialization, registration number, qualification, fee) and optionally create a linked login account (username, email, password) in one step.
- **Edit doctor** — Update professional fields (specialization, fee, qualification, experience, verification status).
- **Manage weekly schedule** — Open the schedule editor to set working hours for each day of the week with shift presets (Morning 08:00–14:00, Afternoon 14:00–20:00, Full Day 08:00–20:00, Custom).
- **Manage addresses** — Add, edit, or set primary address for a doctor (clinic address, home address, etc.).
- **Link to my profile** — A logged-in doctor can link their doctor profile to their user account.
- **Update verification status** — Change doctor verification from PENDING → VERIFIED, REJECTED, or SUSPENDED.
- **Search** — Search doctors by specialization, registration number, or name.

## What features does it hold?

- **Paginated DataTable** — Doctor ID, specialization, registration number, consultation fee, verification status badge, and action buttons.
- **Verification status badges** — Color-coded: PENDING (amber), VERIFIED (green), REJECTED (red), SUSPENDED (gray).
- **Schedule editor sheet** — Day-by-day schedule management with shift presets and custom time ranges.
- **Address manager sheet** — Polymorphic address management with type selection (CLINIC, HOME, BILLING).
- **User account linking** — Create a user account linked to the doctor via `userableType: "Doctor"` for login access.
- **Consultation fee** — Set per-doctor consultation fee used in appointment booking and billing.
