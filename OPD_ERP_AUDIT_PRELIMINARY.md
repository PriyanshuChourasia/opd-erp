# OPD ERP — Preliminary Audit Notes (pre-"START AUDIT")

> Status: **understanding + running findings only** — the full 23-section audit has not been run yet.
> Source: direct reading of `apps/api/prisma/schema.prisma` (~70 models) and the `apps/api/src` services.
> Nothing below has been executed; every finding is from code reading and should be confirmed by a test.
> Date: 2026-09-28

---

## 1. Understanding of the current system

**Shape:** NestJS modular monolith + Prisma/PostgreSQL, React SPA. Local-disk uploads. No queue, cache, or background workers — everything is synchronous in-request.

**Tenancy:** `Organization` is the tenant, wrapped by platform licensing (`Customer`, `LicensePlan`, `License`, `LicenseFeatureMapping`, `LicenseRenewal`). `Company` holds letterhead/tax/token settings. There is no Branch/Facility level.

**Auth / access:** JWT access token (15m, no refresh flow). `JwtAuthGuard` + `TenantContextGuard` + `PermissionsGuard` on nearly every controller. The tenant is resolved from the JWT. Permissions come **only** from `User.roleId → RolePermission`.

**Clinical:** `Patient`, `Appointment` (+ `AppointmentHistory`), `QueueEntry`, `PatientVitals`, `Prescription` (+ `PrescriptionHistory` versioned snapshots, `PrescriptionItem`), `LabOrder` / `RadiologyOrder` / `ProcedureOrder` (single free-text `result` field each), `Allergy` and `Diagnosis` catalogs (+ `DiagnosisSystem`).

**Money:** `Bill` / `BillItem`, plus an append-only `Payment` ledger (direction `PAYMENT` / `REFUND`). Every bill, payment, and refund auto-posts to a double-entry engine (`AccountNature → AccountGroup → Ledger → Voucher → Journal → JournalLine`, `VoucherReference`) inside the same DB transaction.

**Inventory:** `StockItem` (1:1 with `Medicine`) → `StockBatch` → `StockLedgerEntry` with running balances. FEFO (first-expiry-first-out) stock-out. Purchases post Inventory/Creditor entries. Bill items of type `MEDICINE` trigger stock-out + COGS posting.

**Walk-in:** creating a queue entry creates a `WALK_IN` Appointment + `QueueEntry` in one transaction. Tokens are minted under a Postgres advisory lock.

### Objectively good so far
- Append-only `Payment` ledger instead of a mutable "paid" flag.
- Journal engine enforces debit = credit and non-negative, single-sided lines.
- Batch-level stock + an immutable stock movement ledger.
- Prescription version snapshots (`PrescriptionHistory`).
- Advisory-locked token generation inside the same transaction as the insert.
- Tenant resolved from the JWT, never from the request body.

---

## 2. Contradictions (flagged immediately)

1. **`AGENTS.md` is badly stale.** It says 29 models, opt-in guards, and RBAC only in `users`. Reality: ~70 models, guards nearly everywhere, and a permissions guard. Anyone (human or AI) reading the docs gets the wrong security picture.
2. **Duplicate sources of truth:**
   - Allergies × 3: `Patient.allergies String[]`, `PatientAllergy` (catalog join), `PatientAllergyRecord` (free text).
   - Blood group × 2: `Patient.bloodGroup` string + `bloodGroupId`.
   - Address × 2: `Patient.address` string + polymorphic `Address`.
   - Specialization × 2: `Doctor.specialization` string + `DoctorSpecialization` join.
   - Stock quantity × 3: `Medicine.currentStock`, `StockBatch.currentQty`, `StockLedgerEntry.runningBalanceQty`.
   - Role assignment × 2: `User.roleId` + `UserRole`.
   - Invoice-number generators × 2: `INV-YY-nnnnn` per financial year (billing) and `INV-YYMM-nnnnn` global count (appointments), both writing the same unique `Bill.invoiceNo`.
3. **Money units disagree.** Accounting comments say "in paise", but billing writes `bill.total` straight into journal lines, and the refund error message formats the same numbers as ₹. `StockItem.gstRate` is documented as "in paise (1800 = 18%)" — that is basis points, not paise.

---

## 3. Running findings list

Kept numbered so the same issue is not reported twice in the final audit.

| # | Finding | Where | Severity |
|---|---|---|---|
| F1 | `POST /auth/register` with any valid `organizationCode` joins that org with the **ADMIN** role. | `auth/auth.service.ts` `register()` | 🔴 Privilege escalation |
| F2 | `Role.name` is globally `@unique`, so all tenants share one ADMIN role; editing one tenant's ADMIN permissions changes all tenants. | `schema.prisma` `Role` | 🔴 |
| F3 | `/uploads` is served by `express.static` with no auth — patient documents, doctor IDs, and signatures are public to anyone with the URL. | `main.ts` | 🔴 Data exposure |
| F4 | Most clinical/financial tables (`Appointment`, `Bill`, `Payment`, `Prescription`, `QueueEntry`, `Ledger`, `Voucher`, `Stock*`, `Medicine`) have **no `organizationId`**, and their services don't filter by tenant. Several paths use `company.findFirst()`; the public `/queue/display` returns every tenant's queue. | schema + services | 🔴 Cross-tenant leak |
| F5 | Discounted bills build an **unbalanced journal**: the discount is *credited* to "Other Income" (it should be a debit to a discount-allowed/expense ledger). Credits = subtotal + discount + tax, debit = subtotal − discount + tax. `postJournal` rejects this, so **creating any bill with a discount should fail**. | `billing.service.ts` `createSalesVoucher()` | 🔴 Financial |
| F6 | Receipts and refunds always post to the **CASH** ledger regardless of the payment method (UPI/CARD), which makes bank reconciliation impossible. | `billing.service.ts`, `accounting-bridge.ts` | 🔴 Financial |
| F7 | A refund voucher is linked to the *latest RECEIPT voucher in the whole system*, not the payment being refunded. | `createRefundVoucher()` | 🔴 Financial |
| F8 | `unitPrice` and `tax` come from the client and are trusted by the server. | `billing.service.ts` `create()` | 🔴 Price tampering |
| F9 | Invoice numbers are `count + 1`: they collide under concurrent billing, and the two generators can collide with each other. | billing + appointments | 🟠 |
| F10 | The refund cap is computed **outside** the transaction, so concurrent refunds can over-refund. `addPayment` has no overpayment check, and it recomputes `paidAmount` from PAYMENT rows only, ignoring prior refunds. | `billing.service.ts` | 🔴 |
| F11 | `PATCH /billing/:id` sets any status (e.g. `PAID`) with no payment. Soft-deleting a bill doesn't reverse its vouchers or stock movements. | `billing.service.ts` `update()` / `remove()` | 🔴 |
| F12 | Stock-out reads batches, then decrements them, with no row lock. The FEFO query doesn't exclude **expired batches**. Concurrent sales can oversell and drive `currentQty` negative. | `stock.service.ts` `processStockOut()` | 🔴 Clinical + stock |
| F13 | Dispensing is a free-text log: no link to stock/batch, no check against the prescribed quantity, and records are editable. Pharmacy stock only moves via billing. | `dispensing.service.ts` | 🔴 |
| F14 | `UserRole` and `UserPermission` exist, but the JWT strategy never reads them (dead model / false sense of control). | `jwt.strategy.ts` | 🟠 |
| F15 | Queue status update and the appointment sync aren't in one transaction; queue entries are hard-deleted. | `queue.service.ts` | 🟠 |
| F16 | `patientCode` = name + DOB (PII in an identifier), generated with a count-based race. No duplicate-patient detection on phone/DOB. | `patients.service.ts` | 🟠 |
| F17 | No Visit/Encounter entity. Orders, vitals, and prescriptions hang off the patient (sometimes the appointment), so "one visit" cannot be reconstructed. | schema | 🔴 Domain |
| F18 | No rate limiting, helmet, login lockout, MFA, or refresh tokens; no patient-record access audit log. | `main.ts`, auth | 🔴 Compliance |
| F19 | Money unit mismatch (rupees vs paise) between billing and accounting. See contradiction #3. | billing ↔ accounting | Needs clarification |

**To verify:** whether appointment creation rejects double-booking. A slot-check endpoint exists, but there is no DB constraint backing it, so concurrent bookings may double-book.

---

## 4. Open clarification questions

1. **Jurisdiction:** India-only? (The `+91` default and GST fields suggest so.) If yes, the audit will cover GST invoicing, Schedule H/H1 drug registers, the DPDP Act 2023 (Digital Personal Data Protection), and ABHA/ABDM (national health ID).
2. **Scale target:** is one Organization a single clinic, or a hospital group needing Branch → Department → Store/Pharmacy?
3. **Money unit:** are `Bill`, `Payment`, and `Doctor.consultationFee` in rupees or paise? This decides whether F19 is a real bug or just a wrong comment.
4. **Scope:** are insurance/TPA, corporate billing, the nurse workflow, and OTC (no-prescription) pharmacy sales in scope or explicitly out?

---

*Next step: supply any further material (workflows, screens, business rules), then say **START AUDIT** for the full 23-section review and the "Top 20 Things to Fix" list.*
