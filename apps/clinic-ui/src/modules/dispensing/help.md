# Dispensing — Pharmacy Dispensing Records

## What is this page?

The Dispensing page (`/dispensing`) shows a read-only log of all medicines that have been dispensed to patients. Each record tracks which medicine was given, the quantity, batch number, expiry date, and who dispensed it. This serves as the pharmacy's dispensing audit trail.

## What actions can be done?

- **View dispensing records** — Browse the paginated list of all dispensed medicines.
- **Search** — Search by medicine name, patient name, or batch number.
- **Filter by date** — View dispensing records for a specific date range.

## What features does it hold?

- **Paginated DataTable** — Medicine name, quantity dispensed, batch number, expiry date, dispensed timestamp, and dispensed-by staff member.
- **Read-only** — Dispensing records are created automatically when prescriptions with DISPENSED status are processed.
- **Batch tracking** — Each dispensing record includes the medicine batch number for traceability.
- **Expiry tracking** — Expiry dates are recorded for inventory management.
- **Audit trail** — Records which staff member dispensed each medication.
- **Linked to prescriptions** — Each dispensing record is linked to the source prescription for full traceability.
