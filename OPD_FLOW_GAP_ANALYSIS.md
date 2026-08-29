# OPD Flow Gap Analysis

Compares the current implementation against the target OPD flow (`opd flow chart.pdf`, provided by the user). Findings are based on reading the actual current source in `apps/api` and `apps/clinic-ui` — not the stale `PROJECT_BLUEPRINT.md`/`AGENTS.md` docs, which describe an older/aspirational architecture.

Verdict per stage: ✅ Done · 🟡 Partial · ❌ Missing

---

## Stage 1 — Patient Booking
*Patient books appointment via walk-in / phone / website (reception)*

🟡 **Partial**

- ✅ Reception can book an appointment: department → doctor → date → real slot → consultation type/fee → notes (`apps/clinic-ui/src/modules/appointments/components/appointments-page.tsx`), backed by `POST /appointments` (`apps/api/src/appointments/appointments.service.ts`), which also auto-creates the queue entry.
- ❌ No walk-in / phone / website **channel distinction**. Everything goes through the same in-app reception form; there's a `WALK_IN` enum value used only for direct queue-add, not a real booking-source field.
- ❌ No patient-facing self-booking (website) flow — the `_patient` portal routes are read-only.

---

## Stage 2 — Patient Registration
*New patient → create profile; existing patient → search & select*

✅ **Done**

- New patient form (`patient-form-sheet.tsx`) captures name, phone, email, DOB, gender, blood group, address, emergency contact, documents/photo. Persisted via `PatientsService.create`.
- Existing-patient search & select is wired directly into the booking sheet (debounced search by name/phone/email).
- 🟡 Minor gap: full structured address can only be added *after* the patient is saved, not during initial registration. No duplicate-patient detection/merge.

---

## Stage 3 — Appointment Confirmation
*Printable acknowledgement slip; some doctors take a registration fee*

❌ **Missing entirely**

- No printable slip of any kind exists anywhere in the app — confirmed no print/PDF library (`react-to-print`, `jspdf`, `puppeteer`, `@react-pdf`, `window.print`) in either app.
- No dedicated confirmation step or screen — `CONFIRMED` is just one value in a flat status dropdown, with no gate forcing confirmation before check-in.
- No separate **registration fee** concept — only one generic `fee` field on `Appointment`, set at booking time. No payment capture tied to confirmation.

---

## Stage 4 — Patient Arrival & Check-in
*Verify booking, generate visit number, appointment fee taken*

🟡 **Partial**

- `CHECKED_IN` exists as a status value, selectable from the same generic dropdown as every other status — no dedicated check-in screen or booking-verification step.
- ❌ No separate **visit number**. The only identifier is `tokenNumber`, generated at booking/queue-add time, not at arrival.
- ❌ No fee capture tied to check-in — fees are only actually invoiced later via a generic checkout/POS flow, decoupled from arrival.

---

## Stage 5 — Queue Management
*Token added to queue; real-time screen display*

🟡 **Partial**

- ✅ Real queue system: `QueueEntry` model, token auto-generation, per-doctor/day uniqueness, full status lifecycle (`WAITING → IN_PROGRESS → COMPLETED/SKIPPED/NO_SHOW`). Reception UI to add/advance/skip/no-show/delete, filter by doctor (`queue-page.tsx`).
- ❌ **Not actually real-time.** No WebSocket/SSE/socket.io anywhere in the codebase — the "live" queue is just polling every 10–15 seconds.
- ❌ **No public waiting-room display screen.** No kiosk/TV-style "Now serving #X" screen exists — both queue views (reception, doctor) require authenticated login. This is one of the flowchart's explicit requirements and has zero implementation today.

---

## Stage 6 — Doctor Consultation
*Patient called by doctor; doctor views patient history if available*

🟡 **Partial — the key feature named in the flowchart is missing**

- ✅ Doctor can view their live queue and start a consultation (`doctor-pos-page.tsx`, moves entry to `IN_PROGRESS`).
- ❌ **No patient history shown during consultation.** The consultation screen only shows the current patient's name/phone/token — not past prescriptions, past visits, lab/radiology/procedure orders, or allergies. There's no backend "patient history" aggregate endpoint either. This is a direct, named gap against the flowchart.

---

## Stage 7 — Prescription & Advice
*Doctor writes prescription, adds medicine, procedures; saved to history*

🟡 **Partial**

- ✅ Real prescription builder: diagnosis, medicine search/add (from a real `Medicine` catalog), dosage/duration/instructions/quantity per line, notes, submitted via `POST /prescriptions` and genuinely persisted to patient history (viewable later).
- ❌ **"Procedures" not implemented in the prescription UI.** Backend has full CRUD for `ProcedureOrder`, `LabOrder`, `RadiologyOrder`, but there is **no doctor-facing UI to place any of these orders** — only a read-only patient-side lab-orders viewer exists. A doctor cannot order a lab test, scan, or procedure today.
- ❌ No vitals capture (BP/weight/temperature/pulse) anywhere in the model or UI.
- ❌ No prescription print/PDF output.

---

## Cross-cutting gaps (affect multiple stages)

1. **No printing/PDF capability anywhere** — no booking slips, no prescription printouts, no invoices/bills.
2. **No real-time technology** — every "live" view is polling (10–15s), not push-based.
3. **No public queue/token display screen** for the waiting room.
4. **No patient-history aggregation** for doctors at consultation time.
5. **Lab/Radiology/Procedure ordering has backend support but no doctor-facing UI** — a fully built capability that's unreachable in practice.
6. **No registration-fee vs appointment-fee distinction**, and no fee collection tied to the confirmation/check-in steps specifically — it's all folded into a single fee set at booking and invoiced later.
7. **Status transitions are an unguarded flat dropdown** — any appointment status can be set at any time, no workflow/state-machine enforcement server-side.
8. **Root docs are stale**: `PROJECT_BLUEPRINT.md` and `AGENTS.md` describe an older/aspirational architecture and should not be trusted as current-state references; some module `help.md` files also overstate what's actually implemented.

---

## Suggested priority order (highest patient-facing impact first)

1. Public queue/token display screen (waiting-room TV) — stage 5, explicitly requested in the flowchart, currently zero implementation.
2. Patient history view on the doctor consultation screen — stage 6, explicitly requested, currently zero implementation.
3. Printable appointment confirmation slip — stage 3.
4. Doctor-facing UI for lab/radiology/procedure orders — stage 7 (backend already exists, this is UI-only work).
5. Visit-number generation + fee capture at check-in, distinct from booking — stage 4.
6. Real-time push updates (replace polling) for queue/appointments — cross-cutting, stage 5.
