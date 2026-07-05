# OPD ERP — Full Software Blueprint

Single-file spec of the entire system as it exists today, written to be handed to a fresh
build session as the seed prompt for a v2 rebuild. Captures product scope, architecture,
data model, API surface, frontend structure, workflows, and known weaknesses to fix next time.

---

## 1. Product Overview

A clinic/hospital management ERP covering the full patient journey:

```
Registration → Appointment Booking → Queue/Token → Consultation (vitals + diagnosis)
  → Prescription (medicines + lab/radiology/procedure orders) → Billing/POS → Pharmacy Dispensing
```

Target users (roles): **ADMIN**, **DOCTOR**, **RECEPTIONIST**, **PHARMACIST**, **NURSE**.

---

## 2. Tech Stack

| Layer | Choice |
|---|---|
| Monorepo | Turborepo (npm workspaces), `apps/*` + `packages/*` |
| Backend | Express 4 + TypeScript (ESM, `"type": "module"`), Prisma 5 ORM, PostgreSQL |
| Auth | JWT (access 15m + refresh 7d), bcrypt (12 rounds), Zod validation (auth-api only) |
| Frontend | Vite 6 + React 19, TanStack Router (file-based) + TanStack Query (server state) + TanStack Table + Redux Toolkit (auth state only) |
| Styling | Tailwind CSS v3 + hand-written CVA components (not shadcn CLI), HSL CSS custom properties |
| Package manager | npm 11, Node ≥18 |
| Testing / CI | **None** — no test files, no CI config, `tsc --noEmit` is the only quality gate |

---

## 3. Monorepo Architecture

```
                    Browser (clinic-ui :3000/:4000*)
                         │
                         ▼
              ┌─────────────────────┐
              │   auth-api (:5000)  │  ◀── Identity, auth, RBAC, audit, OTP, password reset
              │  Express + Prisma   │
              │  ┌───────────────┐  │
              │  │ Proxy to :4000│──┼──▶ api (:4000)
              │  └───────────────┘  │      Express + Prisma — Clinical CRUD
              └─────────────────────┘

*dev script says --port 4000 in clinic-ui but Vite proxies /api → localhost:4000 (api),
 so in practice clinic-ui and api compete for 4000 unless run with distinct ports — verify before v2.
```

**Two backend services, duplicated schema:**
- `apps/api` (port 4000) — clinical domain (doctors, patients, appointments, prescriptions, orders, billing, dispensing) + its OWN simpler standalone auth (no Zod, no lockout, no refresh rotation).
- `apps/auth-api` (port 5000) — production auth gateway: registration, login, JWT issuance, refresh rotation, password reset, OTP, RBAC CRUD, audit logging, rate limiting. Proxies all clinical routes to `api:4000` via `http-proxy-middleware`, forwarding `Authorization` header. Its Prisma schema **duplicates every clinical model** from `apps/api` — the two schemas must be manually kept in sync on every change (biggest structural risk in the codebase).

**Frontend:**
- `apps/clinic-ui` — Vite SPA, TanStack Router file-based routing, dev proxy `/api` → `http://localhost:4000`. JWT in `localStorage` (`clinic_access_token` / `clinic_refresh_token`).
- `apps/docs` — Next.js docs site (port 3001), largely untouched scaffold.

**Shared packages:**
- `@repo/ui` — button, card, code (barely used by clinic-ui, which has its own `components/ui`).
- `@repo/eslint-config`, `@repo/typescript-config`.

---

## 4. Data Model (Prisma — `apps/api/prisma/schema.prisma`, mirrored in `auth-api`)

### Auth
- `User` (email, password hash, roleId, isActive) `1—*` `RefreshToken`
- `Role` (name, isSystem) `*—*` `Permission` via `RolePermission`
- `Permission` (resource, action) — unique on `[resource, action]`

### Clinical core
- `Doctor` (specialization, licenseNumber unique, email unique)
- `Patient` (allergies: String[], emergencyContact, bloodGroup, gender)
- `DoctorSchedule` — weekly recurring schedule per doctor: `dayOfWeek`, `startTime`/`endTime`, `slotDuration` (default 15m), `maxPatients`; unique `[doctorId, dayOfWeek]`. Backend generates bookable slots from this.
- `Appointment` — `type` (WALK_IN / SCHEDULED / FOLLOW_UP), `status` (SCHEDULED → CONFIRMED → CHECKED_IN → IN_PROGRESS → COMPLETED, or CANCELLED/NO_SHOW), `tokenNumber`, `checkedInAt`, `followUpOf` (self-referential chain, string not FK)
- `QueueEntry` — one per appointment, per-doctor daily token sequence; unique `[doctorId, queueDate, tokenNumber]`; status WAITING → IN_PROGRESS → COMPLETED/SKIPPED/NO_SHOW
- `MedicineCatalog` — third-party/local drug master (brandName, genericName, composition, strength, form, manufacturer); `source` enum LOCAL/EXTERNAL/CUSTOM; indexed on brandName/genericName/composition for autocomplete
- `Prescription` — 1:1 with Appointment; full vitals (systolic, diastolic, weight, temperature, pulse, spO2, respiratoryRate, height), diagnosis, clinicalNotes, followUpDate/Notes
- `Medicine` — line item on a Prescription, optional FK to `MedicineCatalog`, tracks substitution (`isSubstituted`, `substitutedFrom`)
- `LabOrder`, `RadiologyOrder`, `ProcedureOrder` — investigation orders off Appointment/Prescription, `status` PENDING/COMPLETED/CANCELLED, each with its own result/report notes field

### Billing / POS
- `Bill` — optionally tied to Appointment and/or Prescription; `status` DRAFT/PENDING/PAID/CANCELLED/REFUNDED; subtotal/tax/discount/total; refund fields
- `BillItem` — generic line item (`type` + `refId` lets it reference medicines, lab tests, consultation fee, etc.)
- `Refund` — separate audit trail against a Bill (amount, reason, processedBy)

### Pharmacy
- `DispensingRecord` — 1:1 with Prescription; status PENDING/PARTIAL/DISPENSED/CANCELLED
- `DispensingItem` — per-medicine dispensed quantity, substitution tracking

### Desk queue (schema exists, **no API routes wired yet** — dead model)
- `DeskVisit` — generic multi-desk token queue (`DeskType`: REGISTRATION/CONSULTATION/PHARMACY/LAB/BILLING) — appears designed to generalize `QueueEntry` beyond doctor consultation but is currently unused by any route.

### Auth-api extra models (not in `apps/api`)
`AuditLog`, `PasswordReset`, `OtpSession` — see §6.

---

## 5. Backend API Surface

### `apps/api` (port 4000) — mounted in `src/app.ts`, all except `/api/auth` require `authenticate`
```
/api/auth                 (standalone login, no Zod/lockout/rotation)
/api/doctors              /api/patients            /api/appointments
/api/prescriptions        /api/medicine-catalog     (+ /search autocomplete)
/api/doctor-schedules     (+ /:doctorId/slots?date= slot generation)
/api/queue                (+ /next/:doctorId, /:id/status transitions)
/api/lab-orders           /api/radiology-orders     /api/procedure-orders
/api/billing              (+ /from-appointment/:id auto-generate, /:id/status, /:id/refund)
/api/dispensing           (auto-status from dispensed quantities)
/api/roles                /api/permissions          (no authenticate — gap, see §9)
```
Response shape convention: `{ data }` for single items, `{ data: [...], total, page, limit }` for lists.
Errors: Prisma codes mapped in `errorHandler` — `P2002`→409, `P2025`→404, `P2003`→400, else 500.

### `apps/auth-api` (port 5000)
```
/auth/*            login, register, logout, refresh (rotation), me
/users/*           admin user management
/roles/*           /permissions/*   RBAC CRUD
/audit/*           audit log query
/otp/*             OTP login flow
/password-reset/*  forgot/reset flow
+ proxy: forwards every apps/api clinical path listed above to :4000, forwarding Authorization header
```
Middleware stack: `authenticate`, `authorize`, `errorHandler`, `rateLimiter`, `requestId`, `securityHeaders`.
Services layer: `userService`, `tokenService`, `roleService`, `permissionService`, `otpService`, `passwordResetService`, `auditService`. All inputs validated with Zod (`validators/schemas.ts`).

---

## 6. Auth & RBAC (full detail lives in `apps/auth-api/ARCHITECTURE.md`, 1300 lines)

- **Permission format:** `resource:action` — actions `read|create|update|delete|manage`; resources include `doctors, patients, appointments, prescriptions, roles, users, medicine_catalog, doctor_schedules, queue, lab_orders, radiology_orders, procedure_orders, billing, dispensing`.
- **Single role per user**, no stacking. Absence of a permission = deny (no explicit deny records). `ADMIN` gets `*:*` wildcard.
- **Access token** (15m, stateless, HS256): `{id, name, email, roleId, roleName, permissions[], iat, exp, iss: "opd-erp-auth", aud: "opd-erp-api"}`.
- **Refresh token** (7d, stateful — backed by `RefreshToken` DB row): `{id, familyId, iat, exp, iss}`. Rotation is **one-time-use**: each refresh issues a new token and revokes the old one; reuse of a revoked token revokes the entire `familyId` (theft detection).
- **Permission propagation delay:** role/permission changes only take effect at the next access-token refresh (worst case 15 min), since permissions are baked into the token at sign time.
- **Password reset** and **OTP login** are separate flows with their own DB-backed session tables and security controls (see ARCHITECTURE.md §8–9).
- **Audit logging** — auth-api logs auth events (login, logout, password reset, role changes) to `AuditLog` with `ipAddress`/`userAgent`.
- **Critical constraint:** `JWT_ACCESS_SECRET` must be **identical** between `apps/api` and `apps/auth-api` — auth-api signs, api verifies.

---

## 7. Frontend (`apps/clinic-ui`)

**Entry:** `main.tsx` wires TanStack Router + QueryClient (staleTime 30s, retry 1) + Redux `Provider`.

**Routes (file-based, `src/routes/`):**
```
/                              dashboard (stats, today's appointments)
/login                         JWT login
/queue                         live queue, 15s auto-refresh, doctor filter
/patients, /patients/$id       list+register, detail+history tabs+edit
/appointments, /appointments/$id   list+filters+book (slot picker), full consultation view
/appointments/$id/pos          point-of-sale billing scoped to one appointment
/doctors, /doctors/$id         list+add+inline schedule mgmt, detail
/prescriptions, /prescriptions/$id  list, printable Rx view
/medicine-catalog              search + add/edit catalog drugs
/billing                       list + expand line items + mark paid + refund
/dispensing                    list + expand to dispense quantities
/pos                           standalone point-of-sale (patient search, cart, discount %/flat, CASH/CARD/UPI, receipt print)
```

**State:**
- Server state — TanStack Query, all typed fetchers centralized in `lib/api.ts`.
- Client auth state — Redux Toolkit `auth-slice` (`loginThunk`, `loadMeThunk` on refresh, `logoutThunk`); 401 → redirect to `/login`.
- Forms — TanStack Form with inline validators.

**Key UI patterns:**
- `MedicineSearch` — debounced autocomplete (min 2 chars, keyboard nav, "add custom" fallback) against `/medicine-catalog/search`.
- Allergy warning banner — surfaced from `POST /prescriptions` response, shown in red.
- Walk-in auto-token — backend atomically creates a `QueueEntry` when a walk-in `Appointment` is created.
- `components/ui/*` — hand-rolled CVA primitives (button, input, select, badge, card, dialog, skeleton) — not a shadcn install.
- Path alias `@` → `./src`.

---

## 8. Coding Conventions (carried from `AGENTS.md`)

- TypeScript strict, `noUncheckedIndexedAccess: true`.
- ESM everywhere; backends use `.js` extensions in relative imports.
- kebab-case files, camelCase vars/fns, PascalCase components/Prisma models/enums.
- Pagination: `page`/`limit` query params server-side; client-side via TanStack Table.
- New clinical route workflow (5 steps): add route in `apps/api/src/routes/*.ts` → register in `apps/api/src/app.ts` → add to proxy `pathFilter` in `apps/auth-api/src/app.ts` → add typed fetcher in `apps/clinic-ui/src/lib/api.ts` → add route file in `apps/clinic-ui/src/routes/`.

---

## 9. Known Weaknesses / Technical Debt (fix these in v2)

1. **Duplicated Prisma schema across two services.** `apps/api` and `apps/auth-api` each own a full copy of every clinical model; every schema change is a manual two-file edit with no automated drift check. A v2 should use a single shared schema package (or a single service) and split by module boundary, not by full duplication.
2. **Two parallel auth implementations.** `apps/api/src/routes/auth.ts` (weak: no Zod, no lockout, no rotation) coexists with the full `auth-api` implementation. Dead weight and a security footgun if the weak one is ever exposed directly.
3. **`/api/roles` and `/api/permissions` in `apps/api` have no `authenticate` middleware** — RBAC admin endpoints are reachable unauthenticated on the clinical service (mitigated only if that service is never exposed directly, which is fragile).
4. **`DeskVisit` model exists in the schema with no routes** — half-finished generalization of the queue system across REGISTRATION/CONSULTATION/PHARMACY/LAB/BILLING desks. Either finish it (real multi-desk queue) or remove it.
5. **No automated tests, no CI.** `check-types` is the only gate. No unit/integration/e2e coverage on billing math, refund flow, queue concurrency, or RBAC enforcement — all high-risk areas.
6. **Permission propagation lag** — role changes take up to 15 minutes to apply because permissions are baked into the access token. Fine for a v1, but a v2 handling real compliance/security needs should support immediate revocation (e.g. permission-version check per request).
7. **No real-time updates.** Queue screen polls every 15s instead of using WebSockets/SSE — noticeable staleness in a live token queue used by reception + doctors simultaneously.
8. **No payment gateway integration** — billing/POS supports CASH/CARD/UPI as labels only, no actual payment processor.
9. **Port collision risk** — `clinic-ui` dev script binds `--port 4000` while its own Vite proxy forwards `/api` to `http://localhost:4000` (the `api` service's port). Needs to be verified/fixed to avoid a same-port dev conflict.
10. **No multi-tenancy / multi-branch support** — single clinic assumed; no `ClinicId`/`BranchId` scoping anywhere in the schema.
11. **No file/image uploads** — no attachment support for lab results, radiology images, or patient documents.
12. **No soft-delete convention** — deletes are hard deletes throughout (relying on Prisma error-code mapping for FK conflicts rather than an `isDeleted` pattern), which loses audit trail for clinical records.
13. **`apps/docs`** is an untouched Next.js scaffold, not real documentation — should be replaced or removed.

---

## 10. Recommendations for a v2 Build Prompt

If rebuilding from scratch, carry forward: the 5-role RBAC model, the full patient-journey data model (§4), the TanStack Router + Query + Redux frontend stack, and the CVA component approach — these worked well. Change:

- Single backend service (or a proper shared `@repo/db` Prisma package) instead of schema duplication.
- One auth implementation, not two.
- WebSocket/SSE for the live queue instead of polling.
- Real payment gateway integration for POS/billing.
- Test suite (unit for billing/RBAC math, integration for the booking→consult→bill→dispense pipeline) from day one, wired into CI.
- Either build out `DeskVisit` into a real multi-desk queue system or drop it from the schema.
- Add multi-branch/clinic scoping if this needs to serve more than one physical location.
- Add soft-delete + full audit trail on clinical records (not just auth events).
