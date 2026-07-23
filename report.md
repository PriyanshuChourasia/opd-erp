# Reports — LLM Prompt Playbook

This file is a set of **ready-to-run prompts** for building business reports in this repo, one
report at a time. Each section below is self-contained — copy the prompt block into an agent
session and it has everything needed to build that one report **API endpoint → UI page**, in the
project's existing conventions. Build the reports in the order listed if going through all of them;
each is independent otherwise.

## Shared conventions (all prompts below assume these — don't repeat them per-prompt)

**API side** — new `apps/api/src/reports/` module, added once and reused by every report prompt:
- `reports.module.ts`, `reports.controller.ts`, `reports.service.ts`, `registry.ts`, `dto/` — same
  shape as `apps/api/src/billing/` (see that folder as the reference pattern).
- Controller stays thin (`@Get('reports/<name>') get<Name>(@Query() query: <Name>QueryDto)` →
  delegates to a service method). Follow `apps/api/src/billing/billing.controller.ts` and
  `apps/api/src/dashboard/dashboard.controller.ts`.
- Query DTOs extend `apps/api/src/common/dto/pagination-query.dto.ts`'s `PaginationQueryDto` where
  a list is paginated; for pure-aggregate reports (charts/summaries) a plain DTO with
  `@IsOptional() @IsDateString() from?: string` / `to?: string` / `@IsOptional() @IsString()
  doctorId?: string` is enough — validate with `class-validator`.
- Response contract: `{ data: ... }` for a single aggregate payload, `{ data: [...], total, page,
  limit }` for paginated lists (repo-wide convention, see `AGENTS.md`).
- Prisma access via injected `PrismaService`. Aggregate with `groupBy`/`_sum`/`_count`/`_avg`. Reuse
  the date-bucketing helpers already in `apps/api/src/dashboard/dashboard.service.ts`
  (`startOfDay`, `addDays`, `dateKey`) instead of reinventing them — move them to
  `apps/api/src/common/` if a second module needs them.
- Register `ReportsModule` in `apps/api/src/app.module.ts`'s `imports` array (alongside
  `DashboardModule`). Give it a `registry.ts` implementing `IModuleRegistry` from
  `apps/api/src/common/interfaces/module-registry.interface.ts` (copy the shape of
  `apps/api/src/dashboard/registry.ts`).

**UI side** — new `apps/clinic-ui/src/modules/reports/` module, reused by every report prompt:
- `index.tsx` (barrel export), `help.md`, `components/*.tsx`, `data/{api.ts,interface.ts,hooks.ts}`
  — same shape as `apps/clinic-ui/src/modules/dashboard/`.
- `data/api.ts` — typed fetcher(s) via `apiFetch<T>()` from `@/lib/api` (see
  `modules/dashboard/data/api.ts`).
- `data/interface.ts` — TS types mirroring the API's `data` payload shape.
- `data/hooks.ts` — TanStack Query hook(s): `useQuery({ queryKey: ["reports", "<name>", filters],
  queryFn, staleTime: 30_000 })` (see `modules/dashboard/data/hooks.ts`).
- Page component: shadcn `Card`/`CardHeader`/`CardTitle`/`CardContent`, `Skeleton` for the loading
  state, an explicit empty state (e.g. "No data for this range") when `data` is an empty array —
  don't silently render a blank chart. Follow `modules/dashboard/components/dashboard-page.tsx`.
- Charts via `recharts`, styled with the repo's CSS vars (`--viz-sequential`, `--border`,
  `--muted-foreground`, etc. — see `modules/dashboard/components/revenue-trend-chart.tsx`) and the
  `dataviz` skill's palette/contrast rules. Tables use the shadcn `Table` component for row-level
  breakdowns instead of a chart where the data is naturally tabular (e.g. aging bills).
- Route: new file `apps/clinic-ui/src/routes/_dashboard/reports/<name>.tsx` using
  `createFileRoute("/_dashboard/reports/<name>")({ staticData: { title: "<Title>" }, component:
  <Name>ReportPage })` (see `routes/_dashboard/dashboard.tsx`).
- Nav: add `{ to: "/reports/<name>", label: "<Title>", icon: <LucideIcon> }` to the appropriate
  group array in `apps/clinic-ui/src/layouts/app-sidebar.tsx` (a new "Reports" group, or fold into
  an existing one — your call per prompt).

**Acceptance checklist for every report** (repeat this per report, don't skip):
- [ ] `npm run check-types` and `npm run lint` pass for both apps.
- [ ] `GET /api/reports/<name>` returns the documented `{ data: ... }` shape against real seed data
  (`apps/api/prisma/seed.ts`).
- [ ] The UI page renders real data (not just the loading skeleton) and the empty state.
- [ ] Nav link navigates to the new route and highlights as active.

---

## 1. Revenue by category & payment method

```
Build a "Revenue by category" report in this NestJS + TanStack Router clinic ERP.

API: In apps/api/src/reports/ (create the module per report.md's shared conventions if it doesn't
exist yet), add `GET /reports/revenue-by-category?from=<ISO date>&to=<ISO date>`. Query DTO:
`from`/`to` optional ISO date strings (default to current month if omitted). In the service, query
`BillItem` joined to `Bill` filtered by `Bill.createdAt` in range and `Bill.status NOT IN
(CANCELLED, REFUNDED)`, grouped by `BillItem.itemType` (CONSULTATION | MEDICINE | LAB | RADIOLOGY |
PROCEDURE | OTHER) summing `amount`. Also groupBy `Bill.paymentMethod` (CASH | CARD | UPI) summing
`Bill.total` over the same filtered set. Return
`{ data: { byCategory: [{ itemType, amount }], byPaymentMethod: [{ paymentMethod, amount }],
totalRevenue } }`.

UI: In apps/clinic-ui/src/modules/reports/ (create per report.md's shared conventions if needed),
add a "Revenue by Category" page: a date-range picker (reuse any existing date range component if
one exists, otherwise two native date inputs), a horizontal bar chart (recharts `BarChart`) for
byCategory, a simple pie or bar for byPaymentMethod, and a total revenue stat line. Wire up route
`/reports/revenue-by-category` and a sidebar nav entry under a "Reports" group (icon: `BarChart3`
from lucide-react).

Follow the exact file/folder conventions and acceptance checklist in report.md.
```

## 2. Outstanding / aging bills

```
Build an "Outstanding bills" report in this NestJS + TanStack Router clinic ERP.

API: Add `GET /reports/outstanding-bills` to the reports module (see report.md conventions). Query
`Bill` where `status IN (PENDING, PARTIAL)`, include `patient` (name, phone) and `createdAt`. In the
service, compute an `ageDays` field (`Math.floor((now - createdAt) / 86400000)`) and bucket each
bill into `0-7`, `8-30`, `31+` day buckets. Return
`{ data: { bills: [{ id, invoiceNo, patientName, patientPhone, total, status, ageDays, createdAt }],
bucketSummary: [{ bucket, count, amount }] } }`, bills sorted by `ageDays` descending.

UI: Add an "Outstanding Bills" page: a stat row showing bucketSummary as 3 cards (0-7/8-30/31+ days,
each with count + amount), and a shadcn `Table` below listing each bill (invoice no, patient, phone,
amount, age in days, status badge) — highlight rows with `ageDays > 30` (e.g. destructive-tinted
badge). No chart needed here, table is the primary view. Route `/reports/outstanding-bills`, nav
icon `AlertCircle`.

Follow the exact file/folder conventions and acceptance checklist in report.md.
```

## 3. Doctor performance

```
Build a "Doctor performance" report in this NestJS + TanStack Router clinic ERP.

API: Add `GET /reports/doctor-performance?from=<ISO date>&to=<ISO date>` to the reports module. For
each `Doctor`, in the date range: count `Appointment`s by status (esp. COMPLETED vs NO_SHOW vs
CANCELLED) via groupBy on `[doctorId, status]`, compute `completedRevenue = completedCount *
doctor.consultationFee` (or better: sum actual `Bill.total` for bills linked via
`Bill.appointmentId` to that doctor's completed appointments, which is more accurate than
fee*count since bills can include discounts/add-ons), and `noShowRate = noShowCount /
totalAppointments`. Return
`{ data: [{ doctorId, specialization, totalAppointments, completedCount, noShowCount, noShowRate,
revenue }] }`, sorted by revenue descending.

UI: Add a "Doctor Performance" page with a shadcn `Table`: doctor (specialization as the
identifying label, since Doctor has no name field directly — join `User` if the schema links
Doctor→User for a display name, otherwise show specialization + registration no.), total
appointments, completed, no-show rate (as a percentage, red-tinted if > 15%), revenue. Add a
horizontal bar chart of revenue by doctor above the table (reuse the `BarList` component pattern
from `modules/dashboard/components/bar-list.tsx` if it fits, otherwise recharts `BarChart`). Route
`/reports/doctor-performance`, nav icon `UserCog`.

Follow the exact file/folder conventions and acceptance checklist in report.md. Before assuming a
Doctor→User relation for display name, check apps/api/prisma/schema.prisma's Doctor model — if
there's no linked name field, fall back to specialization + medicalRegistrationNo as the label and
note this as a known gap in the page (don't invent a name field).
```

## 4. Prescribed vs. dispensed (fulfillment gap)

```
Build a "Prescription fulfillment" report in this NestJS + TanStack Router clinic ERP.

API: Add `GET /reports/prescription-fulfillment?from=<ISO date>&to=<ISO date>` to the reports
module. Query `Prescription` in range, groupBy `status` (ACTIVE | DISPENSED | CANCELLED) with
count. Separately, for prescriptions still `ACTIVE` past a threshold (e.g. createdAt older than 3
days), list them as "unfulfilled" with patient name, doctor, days pending — join `Patient` for
name. Return
`{ data: { statusBreakdown: [{ status, count }], unfulfilled: [{ prescriptionId, patientName,
doctorId, daysPending }] } }`.

UI: Add a "Prescription Fulfillment" page: a donut/bar chart for statusBreakdown (ACTIVE/DISPENSED/
CANCELLED counts — use `--viz-sequential` family colors per the dataviz skill), and below it a
shadcn `Table` of `unfulfilled` prescriptions sorted by `daysPending` descending, so pharmacy staff
can chase down stale ones. Route `/reports/prescription-fulfillment`, nav icon `ClipboardCheck`.

Follow the exact file/folder conventions and acceptance checklist in report.md.
```

## 5. Top medicines by volume and revenue

```
Build a "Top medicines" report in this NestJS + TanStack Router clinic ERP.

API: Add `GET /reports/top-medicines?from=<ISO date>&to=<ISO date>&limit=<n>` to the reports
module (limit defaults to 10). Two queries: (a) `Dispensing` groupBy `medicineName` summing
`quantity`, ordered desc, for "top by volume" — this already exists as a pattern in
`dashboard.service.ts`'s `topMedicines`, reuse the same groupBy shape; (b) `BillItem` where
`itemType = MEDICINE`, groupBy `itemName` summing `amount`, ordered desc, for "top by revenue".
Return `{ data: { byVolume: [{ medicine, quantity }], byRevenue: [{ medicine, amount }] } }`.

UI: Add a "Top Medicines" page with two side-by-side cards, each a horizontal bar list (reuse
`modules/dashboard/components/bar-list.tsx`'s `BarList` component directly — it's already exactly
this shape) — one for byVolume, one for byRevenue. Route `/reports/top-medicines`, nav icon `Pill`.

Follow the exact file/folder conventions and acceptance checklist in report.md.
```

## 6. Patient demographics & new-vs-returning trend

```
Build a "Patient demographics" report in this NestJS + TanStack Router clinic ERP.

API: Add `GET /reports/patient-demographics` to the reports module. Query all `Patient` rows
(`gender`, `bloodGroup`, `dateOfBirth`, `isFollowUp`, `createdAt`). In the service: groupBy
`gender` and `bloodGroup` for distribution counts; bucket ages computed from `dateOfBirth` into
ranges (0-17, 18-35, 36-55, 56+) — skip patients with null `dateOfBirth` from the age bucketing but
still count them in gender/bloodGroup; and bucket `createdAt` into the last 12 months, counting
`isFollowUp = true` vs `false` per month for a new-vs-returning trend line. Return
`{ data: { byGender: [...], byBloodGroup: [...], byAgeGroup: [...], newVsReturningTrend: [{ month,
newCount, followUpCount }] } }`.

UI: Add a "Patient Demographics" page: a line/area chart (recharts) for newVsReturningTrend with two
series (new vs returning, using two distinct viz colors per the dataviz skill's categorical
palette), plus 3 small bar/donut widgets for byGender, byBloodGroup, byAgeGroup. Route
`/reports/patient-demographics`, nav icon `Users`.

Follow the exact file/folder conventions and acceptance checklist in report.md.
```

## 7. Inactive / lapsed patients

```
Build an "Inactive patients" report in this NestJS + TanStack Router clinic ERP.

API: Add `GET /reports/inactive-patients?daysSinceLastVisit=<n>` to the reports module (default 90).
For each `Patient` with `isActive = true`, find their most recent `Appointment.date` (or
`QueueEntry.queueDate`, whichever is more recent) and compute days since. Filter to patients whose
last visit exceeds the threshold (or who have zero visits ever, using `createdAt` as the reference
instead). Return paginated per the shared PaginationQueryDto pattern:
`{ data: [{ patientId, name, phone, lastVisitDate, daysSinceLastVisit }], total, page, limit }`,
sorted by daysSinceLastVisit descending.

UI: Add an "Inactive Patients" page: a shadcn `Table` (name, phone, last visit date, days since,
sortable by days-since) with pagination controls, and a phone number that's easy to copy (for
follow-up call campaigns) — no chart needed, this is an actionable worklist. Route
`/reports/inactive-patients`, nav icon `UserX`.

Follow the exact file/folder conventions and acceptance checklist in report.md.
```

## 8. Diagnostics turnaround (lab / radiology / procedure orders)

```
Build a "Diagnostics turnaround" report in this NestJS + TanStack Router clinic ERP.

API: Add `GET /reports/diagnostics-turnaround?from=<ISO date>&to=<ISO date>` to the reports module.
Across `LabOrder`, `RadiologyOrder`, and `ProcedureOrder` (each has `createdAt`, `resultDate`,
`status`, `category`), for orders with `status = COMPLETED` and a non-null `resultDate`, compute
turnaround in hours (`resultDate - createdAt`). Group by order type (lab/radiology/procedure) and by
`category`, returning average and count. Also return a status breakdown (ORDERED/COLLECTED or
SCHEDULED/PROCESSING/COMPLETED/CANCELLED counts) per order type, to surface backlogs. Return
`{ data: { avgTurnaroundByType: [{ orderType, category, avgHours, count }], statusBreakdown:
[{ orderType, status, count }] } }`.

UI: Add a "Diagnostics Turnaround" page: a grouped bar chart of avgTurnaroundByType (grouped by
orderType, colored by category using the dataviz skill's categorical palette), and a stacked bar or
small-multiple bar set for statusBreakdown per orderType to spot backlogs (large PROCESSING/ORDERED
counts). Route `/reports/diagnostics-turnaround`, nav icon `FlaskConical`.

Follow the exact file/folder conventions and acceptance checklist in report.md.
```

## 9. Appointment mix & cancellation reasons

```
Build an "Appointment mix" report in this NestJS + TanStack Router clinic ERP.

API: Add `GET /reports/appointment-mix?from=<ISO date>&to=<ISO date>` to the reports module. Query
`Appointment` in range: groupBy `type` (WALK_IN/CONSULTATION/SPECIALIST/EMERGENCY/FOLLOW_UP/
TELECONSULTATION) with count; groupBy `status` with count (reuse the pattern already in
`dashboard.service.ts`'s `appointmentStatusBreakdown` but scoped to the date range instead of
all-time); for `status = CANCELLED` rows, groupBy `cancellationReason` (treat null as "Not
specified") with count. Return
`{ data: { byType: [{ type, count }], byStatus: [{ status, count }], cancellationReasons:
[{ reason, count }] } }`.

UI: Add an "Appointment Mix" page: a bar chart for byType, a bar chart or `BarList` for byStatus,
and a horizontal bar list for cancellationReasons (only render this section if
`cancellationReasons.length > 0`, otherwise show "No cancellations in this range"). Route
`/reports/appointment-mix`, nav icon `CalendarClock`.

Follow the exact file/folder conventions and acceptance checklist in report.md.
```

---

## Known gaps — deliberately out of scope

Two reports commonly expected in a pharmacy ERP are **not buildable today** without a schema
change, and no prompt above attempts them:

- **Stock / reorder report** — `Medicine` (`apps/api/prisma/schema.prisma`) has no
  `stockQuantity` or `reorderLevel` field, and there's no stock-movement/purchase model. A
  follow-up prompt would need to add those fields (or a separate `StockMovement` model tracking
  received vs. dispensed quantities) before this is possible.
- **Profit margin report** — `Medicine.price` is the sale price only; there's no `costPrice` field
  and no expense/purchase-order model, so true margin (revenue − cost of goods) can't be computed.
  A follow-up prompt would need to add `Medicine.costPrice` at minimum, and ideally a `Purchase`/
  `Expense` model for non-medicine costs, before attempting a P&L-style report.

Build these only after that schema migration lands — don't fake the numbers by assuming a margin
percentage.
