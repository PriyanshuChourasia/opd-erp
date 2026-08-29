# Doctors — Staff Management

## What is this page?

The Doctors page (`/doctors`) manages the clinic's doctors — their professional profile, linked login account, weekly schedule, addresses, documents, and active/dropped status.

## Actions & Effects

- **Add Doctor** — Opens the add sheet. Effect: creating calls `createDoctorWithUser` (professional fields + login credentials); invalidates `doctors`; toasts "Doctor created successfully".
- **Edit (pencil)** — Loads the doctor + linked user and opens the sheet pre-filled. Effect: saving calls `updateDoctorWithUser`; invalidates `doctors`; toasts "Doctor updated successfully".
- **Drop (X + confirm)** — Calls `deleteDoctor` (soft delete). Effect: doctor becomes inactive and moves to the Dropped view; toasts "Doctor dropped — can be restored anytime".
- **Restore (Dropped view)** — Calls `restoreDoctor`. Effect: reactivates the doctor; toasts "Doctor restored successfully".
- **Show Dropped toggle** — Switches the list between active and dropped doctors. Effect: refetches with `isActive` filter.
- **Search** — Filters by name, registration no, or specialization. Effect: refetches and resets pagination.
- **Weekly schedule (calendar icon)** — Opens the schedule sheet. Effect: per-day enable/start/end times are saved via `createEmployeeSchedule`/`updateEmployeeSchedule`/`deleteEmployeeSchedule` (run sequentially to avoid overlap-validation races); templates and shift presets apply times to all enabled days; invalidates schedules; toasts "Schedule saved successfully".
- **Addresses (map icon)** — Opens the AddressManager for the doctor. Effect: add/edit/delete/set-primary addresses for the doctor.
- **Documents (folder icon)** — Opens the document sheet. Effect: upload profile photo/qualification docs; uploads are pending until saved, then attached to the doctor.

## Events

- **Linked user fetch** — Editing loads the doctor's user account (name, email, username, mobile) to pre-fill the form.
- **Overlap fallback** — If a schedule create fails with a 400 overlap error, the app falls back to updating the existing schedule for that day.
- **Specialization templates** — Schedule templates matching the doctor's specialization are suggested.

## Features

- Paginated DataTable: doctor, specialization, registration no, verification status, consultation fee, and row actions.
- Drop/restore lifecycle with a separate dropped view.
- Weekly schedule editor with day toggles, shift presets, and templates.
- Address and document management embedded per doctor.
