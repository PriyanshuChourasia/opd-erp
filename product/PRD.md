# Product Requirements Document — Doctor ERP (OPD ERP)

| | |
|---|---|
| **Product** | Doctor ERP — Clinic & OPD Management System |
| **Doc owner** | Product (drafted by AI acting as PM, for team review) |
| **Status** | Draft — v1 |
| **Last updated** | 2026-07-14 |
| **Source of truth for current build state** | `AGENTS.md`, `apps/api/prisma/schema.prisma`, `apps/api/prisma/seed.ts` (this doc is derived from them, not the other way around — if they disagree with this PRD, the code wins and this doc needs updating) |

---

## 1. Executive Summary

Doctor ERP is a single-tenant, full-stack clinic/OPD (out-patient department) management system that covers one patient's entire visit — registration, appointment/queue, consultation, prescription, diagnostic orders, billing, and pharmacy dispensing — in one application with one shared database, replacing the spreadsheets/paper registers/point-solutions clinics currently stitch together.

This PRD describes the product **as it exists in the codebase today** (v2 rebuild, unified NestJS + React stack), not just the aspiration. Where the existing README/marketing copy claims something not yet true in the code (e.g. named Pharmacist/Nurse roles, multi-branch support), this document calls it out explicitly as a gap rather than restating it as fact.

---

## 2. Problem Statement

Small-to-mid-size clinics and single/multi-doctor practices typically run their front desk, doctor consultations, pharmacy, and billing on some mix of paper registers, WhatsApp, Excel, and disconnected point tools (a queue app here, a billing app there). This causes:

- **No single patient record** — vitals, diagnosis, prescriptions, and bills live in different places and don't reconcile.
- **Manual, error-prone billing** — consultation fee, medicine cost, and discounts are calculated by hand at the counter.
- **No visibility into the waiting room** — reception, doctor, and patient all have a different idea of queue position.
- **No RBAC** — either everyone can see everything, or access control is enforced by "please don't touch that" rather than software.
- **Nothing to audit** — no consistent trail of who prescribed what, who billed what, who dispensed what.

Doctor ERP's bet: one schema, one login, one login-to-checkout flow per patient visit, with permissions enforced by the backend, not by convention.

---

## 3. Goals

### 3.1 Product goals
1. Let a receptionist take a walk-in from registration to token queue in under a minute.
2. Let a doctor complete a consultation (vitals → diagnosis → prescription → orders) without leaving one screen.
3. Let the front desk or a dedicated cashier close out a visit (consultation fee + medicines + discount + payment method) as a single bill.
4. Give every role exactly the permissions its job needs — nothing implicit, nothing over-shared.
5. Keep one auditable source of truth per patient, per visit, per prescription, per bill.

### 3.2 Explicit non-goals (for this version)
- Multi-branch / multi-clinic tenancy (the `Organisation` model today is a single clinic-profile record — name/address/contact — not a tenancy boundary; nothing else in the schema is scoped by organisation).
- Insurance claims / TPA workflows.
- Native mobile apps (web-only, responsive).
- Patient-facing self-service portal (booking, viewing own records).

### 3.3 Success metrics (proposed — not yet instrumented)
Since there is no analytics/telemetry in the codebase yet, these are **targets to build toward and instrument for**, not current measurements:

| Metric | Target |
|---|---|
| Time from walk-in registration to queue token issued | < 60 seconds |
| Time from consultation start to prescription saved | < 3 minutes median |
| % of visits billed same-session (no follow-up billing) | > 95% |
| Queue board staleness (time between real state and displayed state) | < 15s (current polling interval; see §9 for the websocket gap) |
| Login → role-correct landing page | 100% (already enforced via `getHomeRoute()`, see §8.9) |

---

## 4. Target Users & Personas

Roles actually seeded in RBAC today (`apps/api/prisma/seed.ts`): **Super Admin, Receptionist, Doctor, Assistant.** (README additionally markets "Pharmacist" and "Nurse" as target roles — those are not distinct seeded roles yet; today a pharmacy-counter user would be given the Receptionist role, and there's no nurse-specific permission set. Treat this as an open backlog item, §12.)

| Persona | Role | Primary jobs | Primary screens |
|---|---|---|---|
| **Clinic Owner / Admin** | Super Admin | Full configuration: users, roles, doctors, medicine catalog, organisation settings | Dashboard, Roles & Permissions, Users, Settings |
| **Front Desk** | Receptionist | Register patients, book/check-in appointments, manage queue, take payment | Queue, Appointments, Patients, POS/Billing |
| **Doctor** | Doctor | Run consultations, write prescriptions, order labs/radiology/procedures | Queue (own list), Consultation, Prescriptions |
| **Clinical support staff** | Assistant | View patients/appointments/medicine catalog (read-only), update queue status | Queue, read-only Patients/Appointments |
| **Cashier at pharmacy/billing counter** | *(currently: Receptionist)* | Search patient, build a cart of medicines + fee, apply discount, take payment, dispense | `/pos` (separate full-width layout, no sidebar) |

---

## 5. Scope — What's Built Today

This section is an honest snapshot of `apps/api/src/*` and `apps/clinic-ui/src/modules/*`, not a promise.

### 5.1 Backend modules present (`apps/api/src/`)
`auth`, `users`, `roles`, `permissions`, `patients`, `doctors`, `appointments`, `queue`, `prescriptions`, `medicine-catalog`, `lab-orders`, `radiology-orders`, `procedure-orders`, `billing`, `dispensing`, `shifts`, `employee-schedules`, `addresses`, `organisation`, `dashboard`, `health`, `common`, `prisma`.

### 5.2 Frontend routes/modules present (`apps/clinic-ui/src/modules/`)
`auth`, `dashboard`, `patient`/`patients`, `doctors`, `appointments`, `queue`, `prescriptions`, `medicine-catalog`, `billing`, `pos`, `dispensing`, `roles-permissions`, `users`, `shifts`, `addresses`, `organisation`, `profile`, plus `development-*` modules that appear to be scaffolding/placeholders for unbuilt sections.

### 5.3 Data model (`apps/api/prisma/schema.prisma`) — 22 models
Identity/RBAC: `User`, `Role`, `Permission`, `RolePermission`, `RefreshToken`.
Clinical core: `Patient`, `Doctor`, `QueueEntry`, `Appointment`, `Prescription`, `PrescriptionItem`, `Medicine`.
Orders: `LabOrder`, `RadiologyOrder`, `ProcedureOrder`.
Commerce: `Bill`, `BillItem`, `Dispensing`.
Scheduling: `Shift`, `EmployeeSchedule` (polymorphic — covers doctors and, by design, any future employee type via `employeeSchedulableType`/`employeeSchedulableId`).
Supporting: `Address` (polymorphic, same pattern), `Organisation` (single clinic-profile record).

### 5.4 Out of scope for this version (from README roadmap, unimplemented)
- Real-time WebSocket queue (current queue view polls; see §9.2)
- Payment gateway integration (Razorpay/Stripe) — billing today records payment method (`CASH`/`CARD`/`UPI`) but doesn't integrate with a live payment processor
- Multi-branch / multi-clinic scoping
- File & image uploads (lab reports, radiology images) — `LabOrder`/`RadiologyOrder` have a `result` text field, no attachment support
- Soft-delete + full audit trail on clinical records
- Automated test suite & CI pipeline (Jest scaffold exists, unused)

---

## 6. Core User Journey

```
Walk-in / Scheduled
      │
      ▼
 Registration ──► Appointment ──► Token Queue ──► Consultation
  (reception)     (slot picker)    (live board)     (vitals + diagnosis)
                                                       │
                                                       ▼
                                              Prescription
                                               ├── Medicines
                                               ├── Lab Orders
                                               ├── Radiology Orders
                                               └── Procedure Orders
                                                       │
                                                       ▼
                                              Billing / POS
                                               ├── Discount % / Flat
                                               ├── CASH / CARD / UPI
                                               └── Receipt
                                                       │
                                                       ▼
                                              Pharmacy Dispensing
                                               └── Partial / Full
```

---

## 7. Roles & Permissions Model

Permissions are `resource:action` pairs. Resources (from `seed.ts`): `patients, appointments, doctors, prescriptions, medicine-catalog, queue, billing, dispensing, users, roles, settings, developer`. Actions: `read, create, update, delete, manage`.

| Role | Grant summary |
|---|---|
| **Super Admin** | Every permission except `developer:*` |
| **Receptionist** | Full CRUD on `patients, appointments, queue, billing`; read-only on `doctors, medicine-catalog` |
| **Doctor** | Read on `patients, appointments, queue, medicine-catalog`; create/update/read on `prescriptions, lab-orders, radiology-orders, procedure-orders` |
| **Assistant** | Read on `patients, appointments, medicine-catalog`; read/update on `queue` |

**Requirement:** every API endpoint must be gated by an RBAC check against this model — no endpoint should be reachable purely because a valid JWT was presented. (Confirm this is actually enforced per-controller as part of QA sign-off, not just documented as intent.)

### 7.1 Auth requirements
- JWT access + refresh tokens, with refresh rotation and theft detection (per README/AGENTS claims — verify test coverage before relying on this for a production security posture).
- Passwords hashed with bcryptjs.
- Login/register land the user on a role-correct home route (`getHomeRoute()` in `lib/roles.ts`) — currently `RECEPTIONIST → /pos`, everyone else → `/dashboard`. This is a **single source of truth** by design; any new role/destination must extend this function, not add ad-hoc redirect checks elsewhere.

---

## 8. Functional Requirements by Module

Status legend: ✅ built · 🟡 partial/needs verification · ⛔ not started.

### 8.1 Patients — ✅
- Register patient (name, phone, gender, blood group, etc.)
- Search/list patients
- View patient detail (appointments, prescriptions, bills history)

### 8.2 Doctors — ✅ (core), 🟡 (verification workflow)
- Doctor profile: qualification, specialization, medical registration number (unique), medical council, years of experience, consultation fee, consultation mode (`OFFLINE`/`ONLINE`/`BOTH`)
- Verification status lifecycle: `PENDING → VERIFIED / REJECTED / SUSPENDED` — the data model supports document URLs (registration certificate, degree certificate, government ID) and a signature field, but the actual upload/verification review UI should be confirmed as built or flagged as backlog.

### 8.3 Appointments — ✅
- Types: `WALK_IN, CONSULTATION, SPECIALIST, EMERGENCY, FOLLOW_UP, TELECONSULTATION`
- Status lifecycle: `SCHEDULED, CONFIRMED, CHECKED_IN, IN_PROGRESS, COMPLETED, CANCELLED, NO_SHOW` (with cancellation reason capture)
- Fee capture per appointment

### 8.4 Queue — ✅ (polling), ⛔ (real-time push)
- Per-doctor daily token queue
- Status: `WAITING, IN_PROGRESS, COMPLETED, SKIPPED, NO_SHOW`
- Current refresh model: client polling (README states 15s interval). **Gap:** no WebSocket/SSE push yet — under real clinic load (multiple simultaneous reception terminals), verify polling doesn't produce visibly stale state or excess API load before calling this "real-time."

### 8.5 Consultation & Prescriptions — ✅
- Prescription: diagnosis, notes, status (`ACTIVE`, `DISPENSED`, `CANCELLED` per seed data)
- Prescription items: medicine, dosage, duration, instructions, quantity
- Vitals capture — claimed in README (BP, pulse, SpO₂, temperature, weight, height); confirm which Prisma model actually persists this, since it's not visible in the model list in §5.3 — **this needs a build-vs-doc reconciliation**, see §12.

### 8.6 Diagnostic Orders (Lab / Radiology / Procedure) — ✅
- Each order type: category, status (`ORDERED, PROCESSING, COMPLETED, CANCELLED`), result text, result date
- No attachment/file support (see §5.4)

### 8.7 Medicine Catalog — ✅
- Name, generic name, category, strength, unit, price
- **Known gap carried from v1 blueprint** (per `AGENTS.md`): catalog historically had no price field for POS to read live — confirm current schema (`price` field exists per seed data) is actually wired into the POS cart's default unit price rather than always defaulting to 0/manual entry.

### 8.8 Billing / POS — ✅
- Standalone and appointment-linked bills
- Line items: `CONSULTATION`, `MEDICINE` (extensible)
- Discount (flat or %), tax, subtotal/total computation
- Payment methods: `CASH, CARD, UPI`
- Status: `PAID, PENDING, PARTIAL, REFUNDED`
- Invoice numbering (`INV-####`)
- `/pos` is a deliberately separate, sidebar-free layout for cashier-speed workflows — not nested inside the main dashboard shell.

### 8.9 Dispensing — ✅
- Per-medicine dispense against a prescription item, with batch number and expiry date capture, partial fulfillment supported

### 8.10 Roles & Permissions Admin — ✅
- CRUD roles, assign permissions, wildcard-style Super Admin

### 8.11 Scheduling (Shifts / Employee Schedules) — ✅
- `Shift` (named shift templates with start/end/break times)
- `EmployeeSchedule` — polymorphic, currently used for doctor weekly recurring availability (replaces the older `DoctorSchedule` model); designed to extend to other staff types later without a schema change

### 8.12 Organisation Settings — ✅ (basic)
- Single clinic profile: name, address, phone, email, website, registration number. Not a multi-tenant boundary (see §3.2).

### 8.13 Dashboard — 🟡
- Module exists on both backend and frontend; scope of actual stat cards / reporting shown should be verified against current implementation before this PRD claims specific KPIs are live.

---

## 9. Non-Functional Requirements

### 9.1 Security
- All mutating endpoints must require authentication + resource:action authorization.
- Secrets (`JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, DB credentials) must never be committed with real values — `.env.example` should stay placeholder-only. (Note: at least one migration/deploy incident in this project's history stemmed from environment/config drift between local and production — see `apps/api/.env.production` vs `docker-compose.yml` mismatch risk; this should get a proper env-management fix as a follow-up, not repeated tribal knowledge.)
- CORS is currently wide-open (`app.enableCors()` with no origin restriction) — acceptable for early development, **should be tightened to an explicit allow-list of known frontend origins before this is treated as production-hardened.**

### 9.2 Reliability / Deployment
- Deployment target: Docker Compose (Postgres + single NestJS API container; frontend served separately via its own Nginx-based Dockerfile/image).
- Migrations must be applied via `prisma migrate deploy` (tracked migration history) — **not** `prisma db push` in any environment that matters, because push-without-a-migration-file is exactly what caused a real production incident (schema drift between local dev and a fresh deploy target, discovered 2026-07-13). This should become a documented, enforced rule (e.g. a CI check that fails if `schema.prisma` changed without a new migration folder).
- Seed data (`prisma/seed.ts`) is idempotent (upserts / count-guards) and safe to run on every container start — this is relied upon by the current Docker CMD chain (`migrate deploy && db seed && start`).

### 9.3 Performance
- No load-tested targets exist yet. Recommend establishing basic ones (e.g. queue list p95 < 300ms, appointment booking p95 < 500ms) once the app has real traffic to measure against.

### 9.4 Observability
- No structured logging, error tracking, or metrics pipeline currently wired in. This is a gap: the incident that motivated this PRD's §9.2 note was diagnosed entirely through raw `docker logs`, which is slow and fragile at production scale.

---

## 10. System Architecture (for context, not a requirement)

| Layer | Technology |
|---|---|
| Backend | NestJS 11 + TypeScript, single service, global `/api` prefix |
| Database | PostgreSQL + Prisma ORM 5 |
| Auth | JWT (access + refresh rotation), bcryptjs, Passport |
| Frontend | React 19 + Vite 6 + TanStack Router (file-based) + TanStack Query + Redux Toolkit (auth state only) |
| Styling | Tailwind CSS v4 (CSS-first config) + shadcn/ui |
| Monorepo | Turborepo + npm workspaces |
| Validation | Zod + class-validator (API), react-hook-form + zod (frontend) |

Full conventions and file-layout detail live in `AGENTS.md` — this PRD intentionally doesn't duplicate that, to avoid the two documents drifting apart.

---

## 11. Release Plan (carried from README roadmap, re-framed as milestones)

| Milestone | Status |
|---|---|
| M1 — Full patient-journey data model & API surface | ✅ Done |
| M2 — Role-based auth (JWT + refresh rotation) | ✅ Done |
| M3 — Live queue, appointments, consultation & prescription workflows | ✅ Done |
| M4 — POS billing (discount engine, multi-payment mode) | ✅ Done |
| M5 — Pharmacy dispensing with partial fulfillment | ✅ Done |
| M6 — Real-time queue via WebSocket (replace polling) | ⛔ Planned |
| M7 — Payment gateway integration (Razorpay/Stripe) | ⛔ Planned |
| M8 — Multi-branch / multi-clinic scoping | ⛔ Planned |
| M9 — File & image uploads (lab/radiology attachments) | ⛔ Planned |
| M10 — Soft-delete + audit trail on clinical records | ⛔ Planned |
| M11 — Automated test suite & CI pipeline | ⛔ Planned |
| M12 (new, recommended) — CI guard against schema/migration drift + basic observability | ⛔ Proposed, not yet on README roadmap |

---

## 12. Open Questions / Decisions Needed

1. **Vitals capture** — README claims full vitals (BP, pulse, SpO₂, temperature, weight, height) are part of consultation. Not obviously present in the 22-model schema list in §5.3 — confirm where this lives (a field set on `Prescription`? A separate model not yet added?) and correct either the product surface or this PRD.
2. **Pharmacist / Nurse roles** — README markets these as target roles; RBAC seed only has Super Admin/Receptionist/Doctor/Assistant. Decide: add dedicated roles with tailored permission sets, or formally scope Receptionist/Assistant to cover these jobs and update external messaging to match.
3. **Multi-clinic roadmap priority** — is multi-branch scoping (M8) a near-term commercial requirement, or purely aspirational? This materially changes whether `Organisation` should get an `organisationId` scoping FK added to every other model now (cheaper) vs. retrofitted later (expensive migration).
4. **CORS hardening timeline** — before or after first real customer deployment?
5. **Env/config management** — should `.env.production` files continue to exist per-app, or move to a single deploy-time secret injection (matching how `docker-compose.yml` already passes `DATABASE_URL` etc. directly as container env vars, bypassing `.env` files entirely in production)? The current dual approach caused confusion during the 2026-07-13 production incident and should be resolved to one pattern.

---

## 13. Appendix

- Marketing-oriented product overview: `README.md`
- Engineering conventions, architecture detail, known gotchas: `AGENTS.md`
- Original v1 data model / API surface (historical reference, not current spec): `PROJECT_BLUEPRINT.md`
