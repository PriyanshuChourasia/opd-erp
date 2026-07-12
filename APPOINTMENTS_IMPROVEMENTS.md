# Appointments Page — Suggested Improvements

Findings from reviewing `apps/clinic-ui/src/modules/appointments/components/appointments-page.tsx`
(and the backend it talks to: `apps/api/src/appointments/*`). Ordered roughly by severity.
Items marked **[Done]** were implemented; see the priority list at the bottom for what's left.

## 1. Bugs / data gaps

- **[Done] Doctor name is never shown — only the registration number.** `appointments-page.tsx:176`,
  `:286`, `:324` all render `doctor.medicalRegistrationNo` because that's all that's available.
  Root cause: `Doctor` (`schema.prisma`) has **no relation to `User`** — the link is a loose,
  untyped `User.userableType/userableId` pair, not a Prisma `@relation`. So
  `GET /appointments` can't `include` a doctor's name even if we wanted to; there's a separate
  "User-Doctor Linkage" lookup elsewhere in `lib/api.ts` that this page never calls. A
  receptionist booking or reviewing appointments currently has no way to tell doctors apart by
  name — only by reg. number. This is the highest-value fix: either add a real `Doctor.userId`
  relation, or have `appointments.service.ts` join through the linkage table and return
  `doctor.name` in the payload.
  *Fixed via `apps/api/src/common/utils/doctor-names.ts` — a batched lookup joining `User` by
  `userableType/userableId`, wired into `DoctorsService` and `AppointmentsService`. No schema
  change; still worth a real `Doctor.userId` relation eventually.*

- **Token numbers aren't allocated atomically.** `appointments.service.ts` `create()` does a
  `findFirst` for the last token then `+1` in a separate `create()` call — two concurrent
  bookings for the same doctor/day can read the same `lastEntry` and get the same token number.
  Low-traffic today, but worth a DB-level guard (unique constraint on
  `(doctorId, date::date, tokenNumber)` or a serializable transaction) before this is used at a
  busy front desk.

- **No reschedule.** Once booked, `PATCH /appointments/:id/status` only changes status —
  doctor, date, and slot are immutable. Moving a patient to a different slot today means
  Cancel + rebook, which loses the original token and looks like two separate visits in
  reporting.

## 2. Workflow gaps

- **[Done] No search on the appointments table itself.** The toolbar only filters by doctor
  (button list) and a single date. There's no way to find "this patient's appointment" without
  knowing the date, and no free-text search by patient name/phone/token — front desks will need
  this constantly once appointment volume grows past a day's list.
  *Fixed: `search` query param (patient name/phone contains, or exact token number) on
  `GET /appointments`, with a debounced search box in the toolbar. The date filter is disabled
  while a search is active so results aren't accidentally scoped to one day.*

- **Status flow is strictly linear with no correction path.** `NEXT_APPT_STATUS`
  (`appointments-page.tsx:40`) only allows moving forward
  (`SCHEDULED → CONFIRMED → CHECKED_IN → IN_PROGRESS → COMPLETED`). A mis-click (e.g.
  accidentally marking IN_PROGRESS) has no way back except direct DB edits. *Not done — still
  open.*

- **[Done] Cancellation has no reason field.** Cancelling just flips status — no audit trail of
  *why* (patient request vs. no-show vs. doctor unavailable), which matters once someone wants
  cancellation-rate reporting.
  *Fixed: `Appointment.cancellationReason` column, optional reason input shown inline in the
  cancel-confirm row, only persisted when status is CANCELLED.*

- **CONFIRMED step adds friction for walk-ins.** Walk-in registrations go through the same
  `SCHEDULED → CONFIRMED` step as a pre-booked appointment, even though there's nothing to
  "confirm" for a patient already standing at the counter. Consider letting `WALK_IN` type skip
  straight to `CHECKED_IN`.

## 3. Feature gaps tied to invoicing (follow-on from the Appointment → Bill link just added)

- **[Done] Fee is a static frontend lookup, not the doctor's actual rate.**
  `CONSULTATION_TYPES` (`appointments-page.tsx:31`) hardcodes a fee per *type*, but
  `Doctor.consultationFee` already exists in the schema per *doctor*. Two specialists with
  different rates currently show the same default fee unless the receptionist manually
  overrides it — easy to bill the wrong amount.
  *Fixed: selecting a doctor now defaults `fee` to that doctor's `consultationFee` (shown in the
  dropdown too); the consultation-type buttons remain a manual override if clicked afterward.*

- **[Done] No bulk "generate invoices for today's completed appointments."** Right now
  invoicing is one appointment at a time via the receipt icon added earlier. For end-of-day cash
  reconciliation (and eventually feeding Zoho/Tally), a "Generate all pending invoices" action
  on this page would match how a front desk actually closes out a day.
  *Fixed: a "Generate N invoices" button appears in the header whenever the current view has
  COMPLETED, unbilled appointments; it checks them out sequentially (not parallel — invoice
  numbers are allocated by counting existing bills, so concurrent calls could race onto the same
  number) via the one-click `POST /appointments/:id/checkout` endpoint.*

- **Invoice badge isn't a link.** Once an appointment is billed, the invoice number renders as
  a static `Badge` (`appointments-page.tsx:207`) — there's no bill detail page to link to yet
  (`BillingPage` is list-only). Worth building a minimal invoice detail view so the badge can
  navigate somewhere.

- **No path for post-invoice changes.** If a completed+invoiced appointment needs to be
  cancelled (patient dispute, wrong entry), there's currently no defined flow — the bill and
  the appointment status can drift out of sync since nothing links a `CANCELLED` appointment
  back to refunding its `Bill`.

## 4. Smaller polish

- **[Done]** Icon-only action buttons (`Check`, `UserCheck`, `UserX`, `X`, `Receipt`, `FileText`)
  relied on `title` for a tooltip but had no `aria-label` — screen readers announced nothing
  useful. Added `aria-label` to all of them.
- Native `<select>` elements are used for Department/Doctor while the rest of the design system
  uses shadcn `Select` components elsewhere — inconsistent styling. *Not done — deferred, lowest
  risk/value ratio of the polish items.*
- **[Done]** Date filter defaulted to "today" with no quick shortcuts. Added **Today** /
  **Tomorrow** buttons next to the date picker (a "This week" range shortcut would need the
  backend to accept a date range, not just a single day — left for later).
- No visible role gating in the UI — any logged-in user can cancel or complete any appointment
  regardless of role. *Not done — deferred, needs a decision on which roles should be allowed
  which transitions.*

## Remaining / not done in this pass

- **Reschedule support** — still the biggest gap. Changing doctor/date/slot on an existing
  appointment requires cancel + rebook today.
- **Token allocation race** — `findFirst` + `+1` is still not atomic.
- **Invoice detail page** — the invoice badge is still a static, non-clickable label.
- **Post-invoice cancellation path** — cancelling an already-billed appointment still doesn't
  touch its `Bill`.
- **CONFIRMED step for walk-ins**, **status-correction (undo) path**, **shadcn `Select` swap**,
  **role gating in the UI** — all deferred polish/workflow items from the list above.

## What shipped in this pass

1. Doctor name resolution (backend batched lookup + frontend fallback chain).
2. Fee defaults to the selected doctor's `consultationFee`.
3. Patient name/phone/token search on the appointments table.
4. Bulk "Generate N invoices" action using the one-click checkout endpoint.
5. Cancellation reason capture.
6. Icon-button `aria-label`s + Today/Tomorrow date shortcuts.
