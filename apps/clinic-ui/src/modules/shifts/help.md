# Shifts — Work Shift Management

## What is this page?

The Shifts page (`/shifts`) manages work shift definitions used for employee scheduling. Shifts define start/end times, break windows, and whether a shift spans overnight. These shifts can be assigned to EmployeeSchedules for doctors, nurses, receptionists, and other staff.

## What actions can be done?

- **Create shift** — Add a new shift with name, code (e.g. "MOR", "EVE"), start/end times, optional break window, description, and overnight toggle.
- **Edit shift** — Modify any shift's details including times, break window, and active status.
- **Delete shift** — Remove a shift definition (only if not assigned to any schedule).
- **Toggle active/inactive** — Activate or deactivate a shift without deleting it.
- **Search** — Search shifts by name, code, or description.

## What features does it hold?

- **Paginated DataTable** — Shift name/code, start/end times, break window, overnight indicator, active status badge.
- **Code-based identification** — Each shift has a unique short code (MOR, AFT, FUL, EVE) for quick reference.
- **Break time management** — Optional break start/end times within the shift.
- **Overnight flag** — Indicates whether a shift spans midnight (e.g. 22:00–06:00).
- **Active/inactive toggle** — Disable shifts without deleting them.
- **Form validation** — Zod schema validation ensuring required fields and valid time ranges.
