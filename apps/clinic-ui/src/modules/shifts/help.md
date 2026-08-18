# Shifts — Work Shift Definitions

## What is this page?

The Shifts page (`/organisation/shifts`) manages work-shift definitions (name, start time, end time). Shifts are referenced by the doctor schedule editor, where a shift can be applied to a doctor's weekly timetable.

## Actions & Effects

- **Add Shift** — Opens the add sheet. Effect: calls `createShift`; invalidates `shifts`; toasts "Shift created successfully".
- **Edit (pencil)** — Opens the sheet pre-filled from `fetchShift`. Effect: saving calls `updateShift`; invalidates `shifts`; toasts "Shift updated successfully".
- **Delete (X + confirm)** — Calls `deleteShift`. Effect: invalidates `shifts`; toasts "Shift deleted successfully".
- **Search** — Filters shifts by name. Effect: refetches and resets pagination.

## Events

- **Data fetch** — Runs on mount, search change, and pagination change.
- **Cross-module effect** — Shifts appear in the Doctors page schedule editor; "apply shift to all days" copies a shift's times onto every enabled day.

## Features

- Paginated DataTable: shift name, start time, end time, actions.
- Add/Edit slide-over sheet.
