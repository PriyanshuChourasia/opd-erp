# OPD Flow — Fixing Report

Companion to `OPD_FLOW_GAP_ANALYSIS.md`. That doc says *what's* missing; this one says *how* and *in what order* to fix it, broken into steps so work can be picked up incrementally without a big-bang rewrite.

Confirmed before writing this: neither app currently has any print/PDF library (`react-to-print`, `jspdf`, `@react-pdf`) or realtime library (`socket.io`, `@nestjs/websockets`) installed — both are greenfield additions, not "wire up an existing thing."

---

## Step 1 — Printable appointment confirmation slip

**Fixes:** Stage 3. **Effort:** Small. **Depends on:** nothing.

- Add `react-to-print` (or a plain `window.print()` + a `@media print` stylesheet — simplest, zero new deps) to `apps/clinic-ui`.
- Build a `ConfirmationSlip` component (patient name, doctor, department, date/time, token, fee) rendered off the same appointment object already returned by `POST /appointments`.
- Trigger it from a "Print Slip" button in `appointments-page.tsx` right after a booking succeeds, and again from the appointment row's action menu for re-prints.
- No backend change needed — all the data (`fee`, `tokenNumber`, doctor/patient names) already exists on the `Appointment` response.

## Step 2 — Visit number generated at check-in (separate from the booking token)

**Fixes:** Stage 4. **Effort:** Small–Medium. **Depends on:** nothing.

- [ ] Add a `visitNumber` column to `Appointment` (Prisma migration), generated only when status transitions to `CHECKED_IN` (not at booking, unlike `tokenNumber`).
- [ ] Add the generation to `AppointmentsService.update` (`apps/api/src/appointments/appointments.service.ts`): when the incoming status is `CHECKED_IN` and `visitNumber` is null, generate one (can reuse the same date+doctor-initials+counter pattern as `generateTokenNumber`).
- [ ] Surface it in the reception UI (`appointments-page.tsx`) once a status flips to `CHECKED_IN`, and print it on a simple check-in slip using the Step 1 print plumbing.

## Step 3 — Registration fee vs. appointment/consultation fee

**Fixes:** Stage 3 + 4. **Effort:** Small–Medium. **Depends on:** nothing.

- Add `registrationFee` alongside the existing `fee` on `Appointment` (or on `Doctor`, if the registration fee is a fixed per-doctor amount rather than per-visit) in the Prisma schema.
- Doctor profile screen: add a `registrationFee` field for doctors who charge it (`Doctor` model + doctor edit form).
- Booking sheet: when the selected doctor has a `registrationFee`, show it as a separate line item alongside the consultation fee, collected/recorded at confirmation instead of folded into the single `fee`.
- This only needs a schema/UI change — no new infra.

## Step 4 — Explicit "Confirm Appointment" action (real gate, not just a dropdown value)

**Fixes:** Stage 3. **Effort:** Small. **Depends on:** Step 1 (prints the slip), Step 3 (shows the reg. fee at this point).

- Replace the generic status dropdown's `CONFIRMED` option with a dedicated "Confirm" button that: marks the appointment `CONFIRMED`, records the registration fee if applicable, and immediately opens the Step 1 print dialog.
- This is the first small step toward Step 9's real state machine — do it here as a single well-defined transition before generalizing.

## Step 5 — Doctor-facing UI for procedure / lab / radiology orders

**Fixes:** Stage 7. **Effort:** Medium. **Depends on:** nothing — backend CRUD already exists (`apps/api/src/procedure-orders`, `lab-orders`, `radiology-orders`).

- This is pure frontend work since the backend is done. Add three sections (or one tabbed "Orders" panel) to the doctor consultation screen (`apps/clinic-ui/src/modules/doctor/components/doctor-pos-page.tsx`), next to the existing prescription builder:
  - Lab test order: searchable test picker → `POST /lab-orders`.
  - Radiology order: study picker → `POST /radiology-orders`.
  - Procedure order: procedure picker → `POST /procedure-orders`.
- Reuse the existing patient-facing read-only lab-orders viewer (`patient-lab-orders-page.tsx`) as a reference for the data shape.
- Bundle "Complete & Prescribe" to also submit any pending orders in the same action.

## Step 6 — Patient history panel on the doctor consultation screen

**Fixes:** Stage 6 (the flowchart's explicitly named requirement). **Effort:** Medium. **Depends on:** nothing.

- Backend: add one aggregate endpoint, e.g. `GET /patients/:id/history`, that returns past appointments, past prescriptions (with items), lab/radiology/procedure orders, and allergies for a patient in one call. (`PatientsService.findOne` today only eager-loads `patientAllergies` — extend a new method rather than overloading that one, since the consultation screen needs more than the registration screen does.)
- Frontend: add a collapsible "History" panel to `doctor-pos-page.tsx`, fetched when a queue entry is selected, showing a timeline of past visits/prescriptions/orders and any allergies flagged prominently.
- This is the single highest-value fix relative to effort — it's explicitly named in the flowchart and currently has zero implementation on either side.

## Step 7 — Public waiting-room queue/token display screen

**Fixes:** Stage 5 (the flowchart's explicitly named requirement). **Effort:** Medium. **Depends on:** nothing (can ship on today's polling; upgrade to push in Step 8).

- Backend: add one unauthenticated (or lightly-scoped, e.g. read-only token) endpoint, `GET /queue/display?doctorId=`, returning just `{tokenNumber, status, doctorName}` for today's queue — don't expose full patient data on a public screen.
- Frontend: new route, e.g. `/display/:doctorId` or `/display` (all doctors), outside the authenticated app shell, large-font "Now Serving #X / Next: #Y, #Z" layout, polling every 5–10s to start.
- Meant to run full-screen on a TV/monitor in the waiting room — no login required.

## Step 8 — Replace polling with real push updates (queue + appointments)

**Fixes:** Cross-cutting (upgrades stages 5 and 1). **Effort:** Medium–Large. **Depends on:** Step 7 (display screen is the main beneficiary).

- Add `@nestjs/websockets` + `socket.io` to `apps/api`, one `QueueGateway` emitting on queue-entry create/update/delete (hook into `QueueService`'s existing mutation methods).
- Frontend: `socket.io-client` in `apps/clinic-ui`, subscribe in the queue display (Step 7), receptionist queue page, and doctor queue page; keep the existing polling as a fallback/reconnect safety net rather than removing it outright.
- Do this after Steps 5–7 exist, so there's real UI to make feel "live" — building the transport first with nothing consuming it isn't worth sequencing early.

## Step 9 — Server-side appointment status state machine

**Fixes:** Cross-cutting (data integrity). **Effort:** Medium. **Depends on:** Steps 2–4 (need the real transitions defined first).

- Define the allowed transition graph once Steps 2–4 have made `CONFIRMED`/`CHECKED_IN` real, meaningful transitions: `SCHEDULED → CONFIRMED → CHECKED_IN → IN_PROGRESS → COMPLETED`, plus `CANCELLED`/`NO_SHOW` side-branches.
- Enforce it in `AppointmentsService.update` (reject invalid transitions with a 400) instead of the current unguarded write-whatever-status-is-passed behavior.
- Update the frontend dropdown to only offer valid next-states instead of the full enum.

## Step 10 — Booking channel distinction + patient self-booking

**Fixes:** Stage 1. **Effort:** Large. **Depends on:** nothing structurally, but lowest urgency — reception-only booking already covers the operational need; this is a nice-to-have channel expansion.

- Add a `source` field (`WALK_IN` / `PHONE` / `WEBSITE`) to `Appointment`, set by reception when booking on a patient's behalf.
- For true website self-booking, build a booking action into the existing `_patient` portal routes (currently read-only) — patient picks doctor/date/slot themselves, hits the same `POST /appointments` (perhaps a restricted variant without doctor-only fields).
- Largest effort item here since it touches patient-facing auth/permissions; do it last unless the user specifically wants online booking live soon.

## Step 11 — Vitals capture

**Fixes:** Stage 7 (nice-to-have, referenced in old blueprint, not in the flowchart itself). **Effort:** Small.

- Add `bp`, `weight`, `temperature`, `pulse` fields to `Prescription` (or a new `Vitals` record per visit if a nurse captures them before the doctor sees the patient).
- Add a small form section to the consultation screen. Low priority relative to the flowchart-driven items above — include only if the user wants it.

---

## Suggested execution order

| Order | Step                                       | Fixes              | Effort        |
| ----- | ------------------------------------------ | ------------------ | ------------- |
| 1     | Step 6 — Patient history panel            | Stage 6            | Medium        |
| 2     | Step 7 — Public queue display             | Stage 5            | Medium        |
| 3     | Step 1 — Printable confirmation slip      | Stage 3            | Small         |
| 4     | Step 5 — Lab/radiology/procedure order UI | Stage 7            | Medium        |
| 5     | Step 2 — Visit number at check-in         | Stage 4            | Small–Medium |
| 6     | Step 3 — Registration fee                 | Stage 3/4          | Small–Medium |
| 7     | Step 4 — Explicit confirm action          | Stage 3            | Small         |
| 8     | Step 9 — Status state machine             | cross-cutting      | Medium        |
| 9     | Step 8 — Real-time push (websockets)      | cross-cutting      | Medium–Large |
| 10    | Step 11 — Vitals capture                  | Stage 7 (optional) | Small         |
| 11    | Step 10 — Multi-channel/self-booking      | Stage 1            | Large         |

Steps 1–7 are all independent of each other and can be done in parallel by different people if needed. Steps 8–9 are best done after 1–7 land, since they upgrade/constrain behavior that needs to exist first.
