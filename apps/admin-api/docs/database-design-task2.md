# TASK 2 — Database & ERD Design for the Licensing / Multi-Tenant Platform

**Scope:** Database design ONLY. Spring Boot + Java + PostgreSQL + JPA (task 3 will produce
entities/migrations).

This document defines the complete, production-ready database model for the licensing and
multi-tenant core of the Doctor ERP platform:

```
Customer → Organization/Tenant → License entitlement → Users → Roles → Permissions
```

It converts the approved Task 1 architecture into a concrete relational schema. **No Java
entities, controllers, repositories, DTOs, JWT code, React, or Flutter code is produced here.**

---

## 1. Database Strategy

### Options evaluated

| Strategy | Description | Pros | Cons |
|----------|-------------|------|------|
| **Shared DB + Shared tables + `organization_id`** | One PostgreSQL database, one set of tables, tenant rows distinguished by an `organization_id` column on every tenant-scoped table | Cheapest ops; single schema for migrations; easy cross-tenant analytics (admin); simple connection pooling; easiest to start | Requires strict, disciplined tenant scoping in every query; risk of accidental cross-tenant leaks must be mitigated |
| **Separate Schema (schema-per-tenant)** | One database, many PostgreSQL schemas, one per tenant; tables created per tenant | Strong isolation; can restore/drop one tenant | 1,000s of schemas degrade catalogue/connection performance; DDL per tenant; migrations run N times; hard to run global reporting; backup complexity; overkill for v1 |
| **Separate Database (db-per-tenant)** | A full database per customer | Maximum isolation; per-tenant backups/restore | Heaviest ops; connection pool explosion; migration fan-out; global reporting impossible; most expensive; overkill |

### Decision

**ONE Database → SHARED Tables → `organization_id` column → TENANT ISOLATION.**

This is the correct choice for version 1 because:

- The platform is a **licensing + RBAC core** with a single global admin (the "platform owner") that
  must view/manage all organizations and their entitlements in one place. That global view is
  trivial with shared tables and impossible/awkward with per-tenant schemas.
- Expected tenant count is modest (ERP is sold to clinics; not millions of tenants). The table-per-
  tenant arguments (backup isolation, very high tenant counts) are not the primary requirement.
- Migration velocity is high early on; a single schema keeps migrations simple and atomic.
- Connection pooling, backups, and observability are far simpler with one database.
- All the isolation we need is achievable and enforced, and each risk is mitigated in Section 23
  and Section 18 (tenant-scoping + composite indexes + application-layer scoping + DB roles).

**Single source of truth for the strategy: every tenant-scoped table carries a non-nullable
`organization_id` (UUID) foreign key, and composite (organization, …) unique constraints hold
tenant-scoped uniqueness.**

---

## 2. Platform Tables

Platform-scoped tables are owned by the software vendor (not a tenant). They describe customers,
what they bought (licenses), the general catalog (plans and features), and license history.

**Decision — create all of these tables:**

| Table | Necessary? | Why |
|-------|-----------|-----|
| `customers` | ✅ Yes | The vendor-facing account entity (a customer may own many organizations). |
| `licenses` | ✅ Yes | The entitlement that binds a customer/organization to a plan + term. |
| `license_plans` | ✅ Yes | Normalized catalog of purchaseable plans (BASIC / PRO / ENTERPRISE). Avoids a free-text `plan` string. |
| `license_features` | ✅ Yes | Normalized catalog of features (ACCOUNTING, INVENTORY, …). |
| `license_feature_mapping` | ✅ Yes | Which features a plan/lifetime entitlement includes (the extensible many-to-many). |
| `license_renewals` | ✅ Yes | Immutable history of every renewal; preserves prior expiry, amount, reference, actor. |

There is **no separate `organizations` entry here** because organizations are tenant-scoped
(Section 3). `customers` and `licenses` are platform-scoped.

### 2.1 `customers`

The vendor's paying customer (a company or individual who purchases licenses). Platform-scoped.

```
id                  UUID            PK, platform-generated, not a sequence
code                VARCHAR(40)     NOT NULL, globally unique (human-friendly, e.g. CUS-00123)
customer_type       VARCHAR(20)     NOT NULL  (CHECK: company | individual)
company_name        VARCHAR(255)    NULL  (required when customer_type = company)
first_name          VARCHAR(100)    NULL  (required when individual)
last_name           VARCHAR(100)    NULL
email               VARCHAR(255)    NOT NULL, globally unique (login/contact identity)
phone               VARCHAR(40)     NULL
tax_number          VARCHAR(100)    NULL
status              VARCHAR(20)     NOT NULL DEFAULT 'active'  (active|inactive|blacklisted|archived)
billing_address     TEXT            NULL
billing_city        VARCHAR(100)    NULL
billing_state       VARCHAR(100)    NULL
billing_country     VARCHAR(100)    NULL
billing_pincode     VARCHAR(20)     NULL
currency            VARCHAR(10)     NOT NULL DEFAULT 'USD'
created_at          TIMESTAMPTZ     NOT NULL
updated_at          TIMESTAMPTZ     NOT NULL
created_by          UUID            NULL  FK users.id (platform admin who created it)
updated_by          UUID            NULL  FK users.id
deleted_at          TIMESTAMPTZ     NULL  (soft delete, see Section 15)
```

- **PK:** `id` (UUID)
- **FK:** `created_by` → `users.id` (SET NULL), `updated_by` → `users.id` (SET NULL)
- **UNIQUE:** `code`, `email`
- **INDEX:** `(status)`
- **CHECK:** `customer_type IN ('company','individual')`, `status IN (...)`
- **ON DELETE:** soft delete only (Section 15). Customers hold licensing/financial history and must
  never be hard-deleted while `license_renewals` reference them.

### 2.2 `licenses`

The entitlement that grants a customer's organization the right to use the software for a term and
plan. This table **ties a license to exactly one organization** (the tenant whose software access
the license controls) and to the customer who purchased it.

```
id                  UUID            PK
license_number      VARCHAR(40)     NOT NULL, globally unique (see Section 10)
activation_secret_hash VARCHAR(64)  NULL, globally unique   (see Section 10)
customer_id         UUID            NOT NULL  FK customers.id
organization_id     UUID            NOT NULL  FK organizations.id
plan_id             UUID            NOT NULL  FK license_plans.id
status              VARCHAR(20)     NOT NULL DEFAULT 'created'  (created|active|suspended|expired|revoked)
issue_date          DATE            NULL
start_date          DATE            NULL
expiry_date         DATE            NULL
max_users           INT             NOT NULL DEFAULT 1
max_devices         INT             NOT NULL DEFAULT 1
notes               TEXT            NULL
activated_at        TIMESTAMPTZ     NULL
activated_by        UUID            NULL  FK users.id
revoked_at          TIMESTAMPTZ     NULL
revoked_by          UUID            NULL  FK users.id
revoke_reason       VARCHAR(255)    NULL
created_at          TIMESTAMPTZ     NOT NULL
updated_at          TIMESTAMPTZ     NOT NULL
created_by          UUID            NULL  FK users.id
updated_by          UUID            NULL  FK users.id
```

- **PK:** `id`
- **FK:** `customer_id` → `customers.id` (**RESTRICT**), `organization_id` → `organizations.id`
  (**RESTRICT**), `plan_id` → `license_plans.id` (**RESTRICT**), `activated_by`/`revoked_by`/
  `created_by`/`updated_by` → `users.id` (SET NULL)
- **UNIQUE:** `license_number`, `activation_secret_hash`
- **INDEX:** `(organization_id)`, `(customer_id)`, `(status)`, `(start_date, expiry_date)`
- **CHECK:** `max_users >= 1`, `max_devices >= 1`, `status IN (...)`

**Relationship requirement (Section 2.9):** A license identifies the organization whose access it
controls via `organization_id`. Business tables (accounts, entries, vouchers) will reference
`organization_id`, **never** `licenses.id`, so the license can expire/be revoked without touching
business data.

### 2.3 `license_plans`

Catalog of purchaseable plans. Platform-scoped, seeded data (BASIC / PRO / ENTERPRISE).

```
id                  UUID            PK
code                VARCHAR(40)     NOT NULL, globally unique  (BASIC | PRO | ENTERPRISE)
name                VARCHAR(100)    NOT NULL
description         TEXT            NULL
price               NUMERIC(14,2)   NULL  (list price; renewals may price differently)
currency            VARCHAR(10)     NOT NULL DEFAULT 'USD'
is_active           BOOLEAN         NOT NULL DEFAULT true
sort_order          INT             NOT NULL DEFAULT 0
created_at          TIMESTAMPTZ     NOT NULL
updated_at          TIMESTAMPTZ     NOT NULL
created_by          UUID            NULL  FK users.id
updated_by          UUID            NULL  FK users.id
```

- **PK:** `id`
- **UNIQUE:** `code`
- **INDEX:** `(is_active, sort_order)`

### 2.4 `license_features`

Catalog of features that can be granted/denied per license. Platform-scoped, seeded
(ACCOUNTING, INVENTORY, SERVICES, MOBILE_APP, MULTI_BRANCH, ADVANCED_REPORTS, …).

```
id                  UUID            PK
code                VARCHAR(60)     NOT NULL, globally unique  (e.g. ACCOUNTING)
name                VARCHAR(100)    NOT NULL
description         TEXT            NULL
module_id           UUID            NULL  FK application_modules.id (optional grouping)
is_active           BOOLEAN         NOT NULL DEFAULT true
created_at          TIMESTAMPTZ     NOT NULL
updated_at          TIMESTAMPTZ     NOT NULL
```

- **PK:** `id`
- **UNIQUE:** `code`
- **FK:** `module_id` → `application_modules.id` (SET NULL)

### 2.5 `license_feature_mapping`

Links a `license` to the concrete features (and limits) granted for this particular purchase.
This is the extensible model that replaces boolean columns like `accounting_enabled`.

```
id                  UUID            PK
license_id          UUID            NOT NULL  FK licenses.id
feature_id          UUID            NOT NULL  FK license_features.id
value               BOOLEAN         NOT NULL DEFAULT true   (true = feature ON for this license)
limit_value         INT             NULL                    (optional numeric cap, e.g. maximum branches)
created_at          TIMESTAMPTZ     NOT NULL
updated_at          TIMESTAMPTZ     NOT NULL
```

- **PK:** `id`
- **FK:** `license_id` → `licenses.id` (**CASCADE** — features are meaningless without the license),
  `feature_id` → `license_features.id` (**RESTRICT**)
- **UNIQUE:** `(license_id, feature_id)`
- **FK delete rule:** when a license is deleted (rare, soft-deleted only), its mappings cascade.
  Feature deletions are restricted.

### 2.6 `license_renewals`

Immutable audit trail of every license renewal / activation / status change that alters the term.
History is **never overwritten**; each renewal is a new row.

```
id                  UUID            PK
license_id          UUID            NOT NULL  FK licenses.id
previous_expiry_date DATE           NULL
new_expiry_date     DATE            NULL
previous_plan_id    UUID            NULL  FK license_plans.id
new_plan_id         UUID            NULL  FK license_plans.id
amount              NUMERIC(14,2)   NULL
currency            VARCHAR(10)     NOT NULL DEFAULT 'USD'
transaction_reference VARCHAR(120)  NULL  (payment gateway ref)
renewed_by          UUID            NULL  FK users.id
renewed_at          TIMESTAMPTZ     NOT NULL  (default now())
notes               VARCHAR(500)    NULL
```

- **PK:** `id`
- **FK:** `license_id` → `licenses.id` (**RESTRICT** — do not silently delete a license that has
  renewal history), `previous_plan_id`/`new_plan_id` → `license_plans.id` (SET NULL),
  `renewed_by` → `users.id` (SET NULL)
- **INDEX:** `(license_id, renewed_at)`
- **Deletion rule:** this is an audit/financial record — **never physically deleted** (Section 15).

---

## 3. Organization Tables

The `organizations` table is the tenant boundary. Every tenant-scoped business table will carry an
`organization_id`.

### 3.1 `organizations`

**Decision:** only one table is required. A separate `organization_settings` table is **not**
added in v1 — organization-level configuration that is genuinely per-tenant and non-schema-critical
is stored as a single nullable `settings JSONB` column. This avoids a one-to-one join for data that
is rarely queried relationally and keeps v1 lean. Re-evaluate if settings become heavily queried or
versioned.

> Note: `organizations` keeps only its own contact/address/status/profile fields. **License
> information (plan, expiry, max_users) is NOT duplicated here** — those live on `licenses`.
> The tenant enforcement layer reads the license via the organization, not by copying fields.

```
id                  UUID            PK
organization_code   VARCHAR(40)     NOT NULL, globally unique  (see Section 13)
legal_name          VARCHAR(255)    NOT NULL
display_name        VARCHAR(255)    NOT NULL
email               VARCHAR(255)    NULL
phone               VARCHAR(40)     NULL
address             TEXT            NULL
city                VARCHAR(100)    NULL
state               VARCHAR(100)    NULL
country             VARCHAR(100)    NULL
pincode             VARCHAR(20)     NULL
timezone            VARCHAR(100)    NOT NULL DEFAULT 'UTC'
locale              VARCHAR(20)     NOT NULL DEFAULT 'en'
currency            VARCHAR(10)     NOT NULL DEFAULT 'USD'
status              VARCHAR(20)     NOT NULL DEFAULT 'active'  (active|inactive|suspended|terminated)
settings            JSONB           NOT NULL DEFAULT '{}'      (per-tenant config, extensible)
created_at          TIMESTAMPTZ     NOT NULL
updated_at          TIMESTAMPTZ     NOT NULL
created_by          UUID            NULL  FK users.id
updated_by          UUID            NULL  FK users.id
deleted_at          TIMESTAMPTZ     NULL  (soft delete)
```

- **PK:** `id`
- **FK:** `created_by`/`updated_by` → `users.id` (SET NULL)
- **UNIQUE:** `organization_code`
- **INDEX:** `(status)`
- **CHECK:** `status IN (active,inactive,suspended,terminated)`
- **Relationships:** one `organizations` has many `users`, many `licenses`, many `roles`; owned by
  (`customer` whose purchase entitled it, tracked through `licenses.customer_id`).

---

## 4. User / RBAC Tables

```
users  ──< user_role >──  roles  ──< role_permission >──  permissions
  │
  └──< user_permission >──  permissions          (per-user overrides/grants)
```

### 4.1 `users`

A user belongs to exactly one organization (see Section 5). `users` is the auth principal for the
application (JWT subject).

```
id                  UUID            PK
organization_id     UUID            NOT NULL  FK organizations.id
name                VARCHAR(255)    NOT NULL
email               VARCHAR(255)    NOT NULL
password_hash       VARCHAR(255)    NOT NULL   (bcrypt/argon2id)
phone               VARCHAR(40)     NULL
gender              VARCHAR(20)     NULL
date_of_birth       DATE            NULL
address             TEXT            NULL
city                VARCHAR(100)    NULL
state               VARCHAR(100)    NULL
country             VARCHAR(100)    NULL
pincode             VARCHAR(20)     NULL
avatar_url          VARCHAR(500)    NULL
status              VARCHAR(20)     NOT NULL DEFAULT 'active'  (active|inactive|suspended|locked)
email_verified_at   TIMESTAMPTZ     NULL
last_login_at       TIMESTAMPTZ     NULL
must_change_password BOOLEAN        NOT NULL DEFAULT false
created_at          TIMESTAMPTZ     NOT NULL
updated_at          TIMESTAMPTZ     NOT NULL
created_by          UUID            NULL  FK users.id
updated_by          UUID            NULL  FK users.id
deleted_at          TIMESTAMPTZ     NULL  (soft delete)
```

- **PK:** `id`
- **FK:** `organization_id` → `organizations.id` (**RESTRICT**), `created_by`/`updated_by` →
  `users.id` (SET NULL)
- **UNIQUE:** see Section 22 Scenario 2 — **`(lower(email), organization_id)`** is the unique
  constraint (email unique **within** an organization). Drop the legacy global user-email unique.
- **INDEX:** `(organization_id)`, `(organization_id, status)`, `(organization_id, created_at)`,
  `(email)` (for platform lookup)
- **CHECK:** `status IN (...)`
- **Deletion:** soft delete + `status='inactive'`; RBAC pivots cascade on hard delete only.

### 4.2 `roles`

Roles are **tenant-scoped** (an organization defines its own roles). Slugs/names are unique per
organization.

```
id                  UUID            PK
organization_id     UUID            NOT NULL  FK organizations.id
name                VARCHAR(100)    NOT NULL
slug                VARCHAR(100)    NOT NULL  (e.g. admin, doctor, receptionist)
description         TEXT            NULL
is_system           BOOLEAN         NOT NULL DEFAULT false  (system roles cannot be deleted/renamed)
created_at          TIMESTAMPTZ     NOT NULL
updated_at          TIMESTAMPTZ     NOT NULL
created_by          UUID            NULL  FK users.id
updated_by          UUID            NULL  FK users.id
```

- **PK:** `id`
- **FK:** `organization_id` → `organizations.id` (**CASCADE** — roles belong to the org and are
  meaningless without it; orgs are soft-deleted/terminated, never hard-cascaded in practice),
  `created_by`/`updated_by` → `users.id` (SET NULL)
- **UNIQUE:** `(organization_id, name)`, `(organization_id, slug)`
- **INDEX:** `(organization_id, is_system)`

### 4.3 `permissions`

Permissions form a **global, platform-defined catalog** (not tenant-scoped) because they describe
capabilities that exist across the software. Tenant assignment happens through roles.

```
id                  UUID            PK
name                VARCHAR(150)    NOT NULL   (human label, e.g. "Create Invoice")
slug                VARCHAR(150)    NOT NULL   (e.g. invoice.create)
module_id           UUID            NULL  FK application_modules.id  (grouping)
description         TEXT            NULL
created_at          TIMESTAMPTZ     NOT NULL
updated_at          TIMESTAMPTZ     NOT NULL
```

- **PK:** `id`
- **FK:** `module_id` → `application_modules.id` (SET NULL)
- **UNIQUE:** `slug` (and `name` if desired globally unique)
- **INDEX:** `(module_id)`

### 4.4 `user_roles` (pivot: user ↔ role)

```
id                  UUID            PK
user_id             UUID            NOT NULL  FK users.id
role_id             UUID            NOT NULL  FK roles.id
assigned_by         UUID            NULL  FK users.id
assigned_at         TIMESTAMPTZ     NOT NULL DEFAULT now()
created_at          TIMESTAMPTZ     NOT NULL
updated_at          TIMESTAMPTZ     NOT NULL
```

- **PK:** `id`
- **FK:** `user_id` → `users.id` (**CASCADE**), `role_id` → `roles.id` (**CASCADE**),
  `assigned_by` → `users.id` (SET NULL)
- **UNIQUE:** `(user_id, role_id)`
- **Note:** it is strongly recommended to keep `user_id` and `role_id` **within the same
  organization**. This is enforced in the application layer (the validator checks
  `role.organization_id == user.organization_id`). A partial unique index can optionally enforce it:
  `UNIQUE (user_id, role_id) WHERE (...)`.

### 4.5 `role_permissions` (pivot: role ↔ permission)

```
id                  UUID            PK
role_id             UUID            NOT NULL  FK roles.id
permission_id       UUID            NOT NULL  FK permissions.id
created_at          TIMESTAMPTZ     NOT NULL
updated_at          TIMESTAMPTZ     NOT NULL
```

- **PK:** `id`
- **FK:** `role_id` → `roles.id` (**CASCADE**), `permission_id` → `permissions.id` (**RESTRICT**)
- **UNIQUE:** `(role_id, permission_id)`

### 4.6 `user_permissions` (direct user grants, optional in v1)

Allows granting a permission directly to a user (in addition to through roles). Kept for symmetry
with the existing pivot; used sparingly.

```
id                  UUID            PK
user_id             UUID            NOT NULL  FK users.id
permission_id       UUID            NOT NULL  FK permissions.id
granted_by          UUID            NULL  FK users.id
granted_at          TIMESTAMPTZ     NOT NULL DEFAULT now()
created_at          TIMESTAMPTZ     NOT NULL
updated_at          TIMESTAMPTZ     NOT NULL
```

- **PK:** `id`
- **FK:** `user_id` → `users.id` (**CASCADE**), `permission_id` → `permissions.id` (**RESTRICT**),
  `granted_by` → `users.id` (SET NULL)
- **UNIQUE:** `(user_id, permission_id)`

### 4.7 Auth / session support tables (included)

**Decision — include all three.** They are justified for a production JWT-based app:

- **`refresh_tokens`** — JWT access tokens expire; a refresh token enables rotation / revocation
  (log-out-everywhere). Required for production auth UX.
- **`user_sessions`** — tracks active client sessions/devices (see-max-devices enforcement, audit,
  revoke-a-device).
- **`login_attempts`** — protects against brute force / credential stuffing (rate limiting).

#### 4.7.1 `refresh_tokens`

```
id                  UUID            PK
user_id             UUID            NOT NULL  FK users.id
token_hash          VARCHAR(255)    NOT NULL, unique   (store HASH, never the raw token)
expires_at          TIMESTAMPTZ     NOT NULL
revoked_at          TIMESTAMPTZ     NULL
replaced_by         UUID            NULL  FK refresh_tokens.id  (rotation chain)
user_agent          VARCHAR(255)    NULL
ip_address          VARCHAR(45)     NULL
created_at          TIMESTAMPTZ     NOT NULL
updated_at          TIMESTAMPTZ     NOT NULL
```

- **PK:** `id`
- **FK:** `user_id` → `users.id` (**CASCADE** — sessions/refresh are transient; loose if user
  deleted), `replaced_by` → `refresh_tokens.id` (SET NULL)
- **UNIQUE:** `token_hash`
- **INDEX:** `(user_id, revoked_at)`

#### 4.7.2 `user_sessions`

```
id                  UUID            PK
user_id             UUID            NOT NULL  FK users.id
device_name         VARCHAR(255)    NULL
device_type         VARCHAR(20)     NULL   (web|mobile|pos)
ip_address          VARCHAR(45)     NULL
user_agent          TEXT            NULL
last_active_at      TIMESTAMPTZ     NULL
expires_at          TIMESTAMPTZ     NULL
revoked_at          TIMESTAMPTZ     NULL
created_at          TIMESTAMPTZ     NOT NULL
updated_at          TIMESTAMPTZ     NOT NULL
```

- **PK:** `id`
- **FK:** `user_id` → `users.id` (**CASCADE**)
- **INDEX:** `(user_id, revoked_at)`
- Supports the `max_devices` license limit: count of active sessions per organization/user.

#### 4.7.3 `login_attempts`

```
id                  UUID            PK
email               VARCHAR(255)    NOT NULL   (identifier used)
user_id             UUID            NULL  FK users.id (resolved when successful/known)
organization_id     UUID            NULL  FK organizations.id
success             BOOLEAN         NOT NULL DEFAULT false
ip_address          VARCHAR(45)     NULL
user_agent          TEXT            NULL
attempted_at        TIMESTAMPTZ     NOT NULL DEFAULT now()
```

- **PK:** `id`
- **FK:** `user_id` → `users.id` (SET NULL), `organization_id` → `organizations.id` (SET NULL)
- **INDEX:** `(email, attempted_at)`, `(ip_address, attempted_at)`
- **Deletion:** purge old rows periodically (retention job); not an audit table.

---

## 5. User–Organization Relationship

### Option A — `users.organization_id` (One User → One Organization)
### Option B — `users` + `organizations` + `user_organizations` (One User → Many Organizations)

**DECISION: Option A for version 1** — a single `users.organization_id` (NOT NULL).

Rationale:

- **Tenant isolation & security:** a user belongs to exactly one tenant. This makes
  cross-tenant access structurally impossible — there is no "which org am I acting as" ambiguity,
  and every `JOIN`/scope filter is deterministic. Multi-org membership multiplies the surface for
  tenant leakage.
- **Simplicity:** no membership pivot, no "active organization" state, no per-request tenant switch,
  no boundary checks across multiple orgs. JWT carries a single `organization_id` claim.
- **DB complexity:** one FK column instead of a pivot + current-org selection logic.
- **User experience:** v1 ERP roles are per-tenant employees; a single org is the normal, expected
  model.

**Future path:** keep the design open. If multi-org membership is ever required, a
`user_organizations` pivot can be added **without destroying Option A** — treat
`users.organization_id` as the "home/default" organization and the pivot as additional memberships.
This is a non-breaking evolution, so we do not pay for it in v1.

**Security note:** even in the future, the request's resolved organization must ALWAYS come from a
verified context (not an arbitrary client-supplied value), and every tenant-scoped query must
include that organization in its predicate.

---

## 6. Primary Key Strategy

### Options: `BIGSERIAL` vs `UUID` (v4) vs `UUIDv7`

| | BIGSERIAL | UUID v4 | UUID v7 |
|--|-----------|---------|---------|
| Order-preserving | ✅ (monotonic) | ❌ random | ✅ time-ordered |
| Index locality (B-tree) | Excellent | Poor (random inserts fragment) | Excellent (time-ordered) |
| Uniqueness without a central sequence | ❌ | ✅ | ✅ |
| Security (not guessable, not enumerable) | ❌ (IDs enumerate resources) | ✅ | ✅ (but website/JS-safe) |
| URL/API exposure safety | ❌ reveals counts/ids | ✅ | ✅ |
| Distributed generation (offline inserts) | ❌ | ✅ | ✅ |
| Storage size | 8 bytes | 16 bytes | 16 bytes |

### Decision

**`UUID v7` as the primary key for all tables, column `id`, default `gen_random_uuid()`-style v7
generation.**

Rationale:

- **Security:** UUIDs are not enumerable, do not leak tenant counts or creation order as sequence
  numbers would.
- **Index performance:** UUIDv7 is time-ordered, so B-tree inserts stay local (like BIGSERIAL) —
  avoiding the page-fragmentation problem of random UUIDv4 while retaining UUIDs' security and
  distributed-generation benefits. This is the key reason v7 beats v4 for this project.
- **Distributed / intercepting systems:** mobile (Flutter) and future offline/edge clients can
  generate IDs without a central sequence; PII/user IDs stay safe if exposed.
- **Scalability / sharding future:** v7's time prefix keeps writes monotonic and simplifies future
  partitioning by time.

### Convention

- **Every table** uses `id UUID PRIMARY KEY DEFAULT uuid_generate_v7()` (or a JPA-assigned v7).
- **Foreign keys** of each table use the same `UUID` type as the referenced `id`.
- **One ID strategy everywhere.** Do not mix `BIGSERIAL` and UUID (no strong reason exists).
- Ensure the PostgreSQL extension `pgcrypto`/`pg_uuidv7` (or app-side generation) is available in
  Task 3 migration setup.

> Final: `id UUID PRIMARY KEY` for all tables.

---

## 7. Common Columns

The default audit/metadata columns are **`created_at` and `updated_at` (TIMESTAMPTZ, NOT NULL)** on
every table that holds mutable business/reference data. The others are applied selectively.

| Column | When used | When omitted |
|--------|-----------|--------------|
| `id` | Every table (UUID v7 PK) | — |
| `created_at` | Every table | — |
| `updated_at` | Every table except **immutable** rows (`license_renewals`, `login_attempts`) | immutable/append-only tables store `created_at` only |
| `created_by` | Tables where knowing who created the row matters and an actor always exists: `users`, `roles`, `customers`, `organizations`, `licenses`, `documents` | platform catalog refs where the creator is not business-relevant or is always the system (`license_plans`, `license_features`, `permissions`, `countries`, `states`) |
| `updated_by` | Tables that allow editorial updates by humans: `users`, `roles`, `customers`, `organizations`, `licenses` | catalogs/ref data (maintained by seed or system) |
| `deleted_at` | Soft-deletable tables (Section 15): `users`, `customers`, `organizations`, `documents`, and future tenant resources | immutable audit/financial tables (`license_renewals`, `login_attempts`) which must never be soft-deleted intermittently |
| `organization_id` | Every tenant-scoped table | platform-scoped tables (`customers`, `licenses`, `license_plans`, `license_features`, `permissions`, `countries`, `states`, `login_attempts` at platform level) |

**Rule of thumb:** `created_at`/`updated_at` are universal; `created_by`/`updated_by` are added only
where a meaningful actor owns or edits the row; `deleted_at` only where soft delete is the chosen
strategy (Section 15); `organization_id` only on tenant-scoped tables (Section 18).

*Critical audit history is NOT stored only in these columns — it is captured by the dedicated
`audit_logs` table designed later (Section 16).*

---

## 8. Status Strategy

### Options: PostgreSQL ENUM vs VARCHAR(+CHECK) vs Reference table

| | PG ENUM | VARCHAR + CHECK | Reference table |
|--|---------|------------------|------------------|
| Typed, DB-validated | ✅ | ✅ (via CHECK) | ✅ |
| Add a new status | `ALTER TYPE` (lock/rewrite) | just update CHECK | insert row |
| Query plan / storage | compact | small, text length varied | join required |
| Overhead | none | tiny | extra table + join per read |
| Fits "a handful, rarely changes"? | ✅ | ✅ | overkill |

### Decision

**`VARCHAR(20)` + `CHECK (status IN (...))` for all statuses.**

Rationale:

- Statuses here are a **small, closed, rarely-changing set** (`active|inactive|suspended|expired|
  revoked|locked|terminated|blacklisted|archived|created`).
- A CHECK constraint gives the same DB-level validation as an ENUM **without** the `ALTER TYPE`
  rewrite/lock penalty and without the coupling that ENUMs create in ORMs and code.
- Reference tables are rejected: they add a join for zero benefit on tiny closed sets. **Exception:**
  if a status were ever data-driven per tenant (it is not here), a reference table would be revisite
  **Business statuses that vary by workflow** (e.g. future voucher/document states) may use their
  own CHECK or a documented string set per table — still not per-status reference tables unless a
  business reason (dynamic workflow) appears.

---

## 9. License Database Model

### Decision

```text
customers ──< licenses >── organizations
              │
              ├──< license_feature_mapping >── license_features
              │
              └──< license_renewals
license_plans <── licenses.plan_id
```

- A **customer** (platform entity) purchases licenses.
- A **license** grants entitlement to **exactly one organization** (`organization_id NOT NULL`).
  This satisfies the key requirement: *a license identifies the organization whose software access
  it controls*.
- **Business tables reference `organization_id`, never `license_id`** — so license expiry/revocation
  never degrades or deletes business data (Sections 2.2, 22 Scenario 3/5).
- **Plan** is normalized to `license_plans` and referenced by `licenses.plan_id` (and captured
  snapshot-style in `license_renewals` for history).
- **Features** are normalized to `license_features` and attached per license through
  `license_feature_mapping` (extensible, no boolean column explosion — Section 12).
- **Renewals** are append-only rows under the license (Section 11).

### Relationships

- `customers` 1 ─── N `licenses`
- `organizations` 1 ─── N `licenses`
- `licenses` N ─── 1 `license_plans`
- `licenses` N ─── N `license_features` (via `license_feature_mapping`)
- `licenses` 1 ─── N `license_renewals`

---

## 10. License Number Strategy

### Requirements
Globally unique · not derived from DB sequence · not easily guessable · safe to display · searchable ·
DB unique constraint.

### Decision

- **`license_number`** — the human-readable, customer-facing identifier, e.g. **`LIC-2026-AB82K91X`**.
  - Format: `LIC-YYYY-<8 random chars from an unambiguous alphabet (no 0/O/1/I)>`.
  - The suffix is cryptographically-random (>= 40 bits) so it cannot be enumerated.
  - Stored as `VARCHAR(40)`, **UNIQUE NOT NULL** — this is the search key.
- **`activation_secret`** — a **separate** field, distinct from the license number, used to prove
  entitlement at activation time (and for offline/mobile activation).
  - **Do NOT store the raw secret.** Only store `activation_secret_hash` (SHA-256) in
    `licenses.activation_secret_hash`, **UNIQUE NULL** (a license may not be activated yet, hence
    nullable). The raw secret is shown to the customer once at issue time and only its hash is
    persisted.
  - Uses: the customer proves possession of the secret when activating; the app binds an
    organization to a license.

**Why separate:** the license number is an identifier that appears in invoices, support tickets, and
search — it should not double as a credential. Separating them means exposing the license number
never leaks the activation secret, and rotating the secret (e.g. after a leak) does not change the
license number.

- Add a **CHECK** that `license_number` matches the pattern `^LIC-[0-9]{4}-[A-Z0-9]{8}$`.

---

## 11. License Renewal Model

`license_renewals` (Section 2.6) is an **append-only history table**. It records, per renewal:

- `previous_expiry_date` → `new_expiry_date` (previous vs new term)
- `previous_plan_id` → `new_plan_id` (plan changes, nullable for same-plan renewals)
- `amount`, `currency`, `transaction_reference` (financial trace)
- `renewed_by` (actor), `renewed_at` (timestamp), `notes`

**Design rules:**
- **History is never overwritten**: each renewal is a new row; the `licenses.expiry_date` /
  `start_date` / `plan_id` reflect only the **current** entitlement.
- The current license row is the *projection*; the renewals are the *record*. This gives both a fast
  current-state read (`licenses`) and a complete, audit-grade history (`license_renewals`).
- `license_renewals` is **immutable** (no `updated_at`, no delete paths) and never physically
  deleted (financial/audit record).

**Activation vs renewal:** the first row (activation) may record `previous_*` as NULL and the
initial term; subsequent rows record each renewal. Optionally a `type` column
(`activation|renewal|extension|reactivation`) can be added — recommended to keep the audit
self-describing.

---

## 12. License Feature Model

**Decision:** normalized, extensible model — **NOT** boolean columns.

**Rejected anti-pattern:**

```text
licenses
    accounting_enabled
    inventory_enabled
    services_enabled
    mobile_enabled
    reports_enabled
    ...
```

**Chosen:**

```text
license_plans            (BASIC | PRO | ENTERPRISE)  — the catalog
license_features         (ACCOUNTING | INVENTORY | SERVICES | MOBILE_APP | MULTI_BRANCH | ADVANCED_REPORTS | ...)
license_feature_mapping  (license_id, feature_id, value, limit_value)
```

**Why normalized:**

- Adding/removing/enabling a feature later is a **catalog insert + mapping insert** — no migration
  and no column per feature.
- A **single license can be customized** beyond its plan's default set (enterprise negotiations) —
  each license stores exactly the features it actually carries via `license_feature_mapping`.
- Numeric limits (e.g. `MULTI_BRANCH` limit = 5) are captured in `limit_value` without new columns.
- Future "feature toggles per plan" can inherit defaults from a plan→features mapping without
  changing `licenses`.

**Recommendation for v1 scope:** introduce `license_feature_mapping` at the **license** level
(fully per-purchase). Optionally add a `plan_feature` catalog later to seed defaults; not required
in v1. This keeps the model flexible without over-building.

---

## 13. Tenant-Scoped Uniqueness

**Global uniqueness (platform scope):**
- `customers.code`, `customers.email`
- `licenses.license_number`, `licenses.activation_secret_hash`
- `license_plans.code`
- `license_features.code`
- `permissions.slug` (and `name`)
- `organizations.organization_code`
- `countries.code`

**Tenant-scoped uniqueness (unique within an organization):**
- `users` → `(organization_id, lower(email))` — email unique per org (Section 22 Scenario 2)
- `roles` → `(organization_id, name)` and `(organization_id, slug)`

**Documented future tenant-scoped unique constraints** (business tables designed in later tasks,
but recorded here as the standard to follow):

| Table (future) | Tenant-scoped unique |
|----------------|----------------------|
| accounts | `(organization_id, account_code)` |
| services | `(organization_id, service_code)` |
| inventory_items | `(organization_id, sku)` |
| vouchers | `(organization_id, voucher_number)` |
| documents | `(organization_id, name)` where applicable |

**Rule:** every tenant-scoped field that is "code-like" or "number-like" gets a **composite unique
constraint `(organization_id, <field>)`**, never a bare global unique. This lets
`SKU-001` exist in Organization A and Organization B simultaneously.

---

## 14. Foreign Key & Delete Rules

**General policy — avoid blind `CASCADE` on business/financial records.** A record's disappearance
should not destroy dependent business data. Rules per relationship:

| From → To | ON DELETE | Rationale |
|-----------|-----------|-----------|
| `customers.created_by` → `users.id` | SET NULL | actor no longer exists; keep record |
| `customers.updated_by` → `users.id` | SET NULL | same |
| `licenses.customer_id` → `customers.id` | RESTRICT | do not delete a customer with licenses/renewals; business record |
| `licenses.organization_id` → `organizations.id` | RESTRICT | do not delete an org with licenses; license defines access |
| `licenses.plan_id` → `license_plans.id` | RESTRICT | plans are reference data |
| `licenses.activated_by` → `users.id` | SET NULL | keep license |
| `licenses.created_by/updated_by/revoked_by` → `users.id` | SET NULL | keep license |
| `license_feature_mapping.license_id` → `licenses.id` | CASCADE | mapping meaningless without license |
| `license_feature_mapping.feature_id` → `license_features.id` | RESTRICT | feature is catalog |
| `license_renewals.license_id` → `licenses.id` | RESTRICT | never drop audit history with license |
| `license_renewals.plan_id` → `license_plans.id` | SET NULL | preserve renewal with snapshot |
| `license_renewals.renewed_by` → `users.id` | SET NULL | preserve renewal |
| `organizations.created_by/updated_by` → `users.id` | SET NULL | keep org |
| `users.organization_id` → `organizations.id` | RESTRICT | do not silently orphan/delete users |
| `users.created_by/updated_by` → `users.id` | SET NULL | keep user |
| `roles.organization_id` → `organizations.id` | CASCADE | roles are tenant-owned; live and die with (terminated) org |
| `roles.created_by/updated_by` → `users.id` | SET NULL | keep role |
| `permissions.module_id` → `application_modules.id` | SET NULL | keep permission |
| `user_roles.user_id` → `users.id` | CASCADE | membership only with user |
| `user_roles.role_id` → `roles.id` | CASCADE | membership only with role |
| `user_roles.assigned_by` → `users.id` | SET NULL | keep membership |
| `role_permissions.role_id` → `roles.id` | CASCADE | grant only with role |
| `role_permissions.permission_id` → `permissions.id` | RESTRICT | permission is catalog |
| `user_permissions.user_id` → `users.id` | CASCADE | grant only with user |
| `user_permissions.permission_id` → `permissions.id` | RESTRICT | permission is catalog |
| `user_permissions.granted_by` → `users.id` | SET NULL | keep grant |
| `refresh_tokens.user_id` → `users.id` | CASCADE | transient token lives with user |
| `refresh_tokens.replaced_by` → `refresh_tokens.id` | SET NULL | rotation chain preserved |
| `user_sessions.user_id` → `users.id` | CASCADE | transient session lives with user |
| `login_attempts.user_id` / `organization_id` → | SET NULL | keep audit-ish row |
| `documents.documentable_id` (polymorphic) | — | app-managed, documented in later task |
| `documents.uploaded_by` → `users.id` | SET NULL | keep document |

**ON UPDATE:** all FKs reference immutable UUID PKs, so `ON UPDATE CASCADE` is never needed —
the referenced key never changes. Leave ON UPDATE as RESTRICT/NO ACTION (the default).

---

## 15. Soft Delete Strategy

| Class | Tables | Policy |
|-------|--------|--------|
| **Deletable (hard or soft)** | `user_roles`, `role_permissions`, `user_permissions`, `license_feature_mapping`, `refresh_tokens`, `user_sessions` | Pivot/transient rows — safe to delete (already CASCADE or periodic purge) |
| **Soft deletable only** (`deleted_at`) | `users`, `customers`, `organizations`, `documents` (+ future: employees, services, inventory_items, suppliers, patients) | Retain row for history/reference; filter with `WHERE deleted_at IS NULL` in normal queries |
| **Deactivate only (no physical delete, no soft delete)** | `licenses` | Use `status` (`active|suspended|expired|revoked`) + `revoked_at`; never delete — it anchors license history |
| **Never deleted (immutable/audit/financial)** | `license_renewals`, `login_attempts` (retained for a retention period) | Append-only or retention-purged by job, never user-deletable |

**Principles:**
- **users/customers/organizations** are soft-deleted (toggle `status=inactive` too) so historical
  references and documents stay intact; related business records are **not** cascaded away.
- **Financial / licensing truth** (`licenses`, `license_renewals`) is never physically deleted —
  data must persist for compliance and history even if a customer leaves (Scenario 5).
- **Pivot rows** can be removed freely because they encode current assignments, not history.
- Use **partial unique indexes** so soft-deleted rows can reuse unique values where intended
  (e.g. `UNIQUE (organization_id, lower(email)) WHERE deleted_at IS NULL`).

---

## 16. Audit Fields

**Two layers:**

1. **Record metadata on the table** (Section 7): `created_at`, `updated_at` on every table;
   `created_by`/`updated_by` where a meaningful actor exists (`users`, `roles`, `customers`,
   `organizations`, `licenses`, `documents`). Sensitive/status changes (activate, revoke, suspend)
   also carry explicit action columns on the entity itself (`licenses.revoked_at/revoked_by/
   revoke_reason`, `licenses.activated_at/activated_by`).

2. **Dedicated `audit_logs` table (designed with the later audit task, referenced here):**
   captures who/what/when for critical mutations even where no per-row `created_by` exists.

```
audit_logs (reference model — full spec in the audit task)
  id            UUID PK
  tenant_id     UUID      (organization_id)
  actor_id      UUID      (user who performed the change)
  action        VARCHAR   (CREATE|UPDATE|DELETE|ACTIVATE|REVOKE|LOGIN|...)
  entity_type   VARCHAR   (e.g. 'license', 'user', 'role')
  entity_id     UUID
  before        JSONB
  after         JSONB
  ip_address    VARCHAR(45)
  user_agent    TEXT
  created_at    TIMESTAMPTZ
```

**Rule:** `audit_logs` is **append-only**, never updated or deleted, and must not rely on application
code alone for critical history — DB-level triggers or an explicit audit service persist these rows.
`created_at`/`updated_at` on records is for Operational metadata; `audit_logs` is for **authoritative
audit**.

---

## 17. Indexing Strategy

Index **what queries actually need**, favoring composite indexes that lead with
`organization_id` on tenant tables. Do not blindly index every column.

### Platform tables

| Table | Index | Supports |
|-------|-------|----------|
| `customers` | UNIQUE `code`; UNIQUE `email`; `(status)` | lookups, status listing |
| `licenses` | UNIQUE `license_number`; UNIQUE `activation_secret_hash`; `(organization_id)`; `(customer_id)`; `(status)`; `(start_date, expiry_date)` | activation by number/hash; org & customer lookups; expiry scans |
| `license_plans` | UNIQUE `code`; `(is_active, sort_order)` | catalog listing |
| `license_features` | UNIQUE `code`; `(module_id)` | catalog |
| `license_feature_mapping` | UNIQUE `(license_id, feature_id)`; `(feature_id)` | per-license feature read; reverse lookup |
| `license_renewals` | `(license_id, renewed_at)` | history per license, ordered |

### Tenant tables (lead with `organization_id`)

| Table | Index | Supports |
|-------|-------|----------|
| `organizations` | UNIQUE `organization_code`; `(status)` | tenant lookup/listing |
| `users` | UNIQUE `(organization_id, lower(email))` (partial, non-deleted); `(organization_id)`; `(organization_id, status)`; `(organization_id, created_at)`; `(email)` (platform-wide search) | login by email+org; tenant user listing by status/date; platform admin search |
| `roles` | UNIQUE `(organization_id, name)`; UNIQUE `(organization_id, slug)`; `(organization_id, is_system)` | tenant roles; listing |
| `permissions` | UNIQUE `slug`; `(module_id)` | RBAC catalog |
| `user_roles` | UNIQUE `(user_id, role_id)`; `(role_id)` | user's roles; role membership listing |
| `role_permissions` | UNIQUE `(role_id, permission_id)`; `(permission_id)` | role grants; reverse lookup |
| `user_permissions` | UNIQUE `(user_id, permission_id)`; `(permission_id)` | direct grants |
| `refresh_tokens` | UNIQUE `token_hash`; `(user_id, revoked_at)` | revoke-all, rotation cleanup |
| `user_sessions` | `(user_id, revoked_at)` | active-device count/enforcement |
| `login_attempts` | `(email, attempted_at)`; `(ip_address, attempted_at)` | brute-force rate limiting |

**Composite-index justification:** `(organization_id, status)` serves "list active users of a
tenant"; `(organization_id, created_at)` serves tenant-scoped pagination; `(organization_id, code)`
enforces + serves tenant-scoped unique lookups. The leading `organization_id` also lets PostgreSQL
partition by tenant later without rewriting.

---

## 18. Platform vs Tenant Scope

### Identity / scope table

| Table | Scope |
|-------|-------|
| `users` | **Tenant** (`organization_id`) |
| `roles` | **Tenant** (`organization_id`) |
| `user_roles` | **Tenant** (via user + role) |
| `role_permissions` | **Tenant** (via role) |
| `user_permissions` | **Tenant** (via user) |
| `refresh_tokens` | **Tenant** (via user) |
| `user_sessions` | **Tenant** (via user) |
| `organizations` | **Tenant** (the boundary itself) |
| `customers` | **Platform** (vendor's customer) |
| `licenses` | **Platform** (vendor's entitlement; `organization_id` links to tenant for enforcement) |
| `license_plans` | **Platform** |
| `license_features` | **Platform** |
| `license_feature_mapping` | **Platform** (per-license) |
| `license_renewals` | **Platform** |
| `permissions` | **Platform** (global capability catalog) |
| `login_attempts` | **Platform** (auth infra; org/user nullable) |
| `countries` / `states` | **Platform** (reference) |
| `documents` | **Tenant** (via documentable owner; add `organization_id` for direct scoping) |

### How the design enforces tenant isolation

- Every **tenant-scoped** table carries `organization_id` (NOT NULL) — ownership is explicit at the
  schema level, not only in application queries.
- **Composite foreign paths keep tenants aligned**: roles, user_roles, role_permissions all inherit
  tenant via their FK chain; app-level and (optionally) a partial unique index enforce that a role
  and its user share the same organization.
- **Business tables in later tasks** follow the same rule: `accounts`, `inventory_items`,
  `services`, `vouchers` all carry `organization_id` and are queried with it in every predicate.
- The **JWT `organization_id` claim** arrives from login; the backend re-validates organization
  status + license entitlement server-side (never trusts the claim alone).
- A `SET search_path`/DB-role per tenant is **not** used (shared-schema strategy). Isolation is
  enforced jointly by: (a) explicit `organization_id` columns, (b) query-building scaffolds that
  append the org to every tenant predicate, (c) composite unique/index leading with org,
  (d) server-side entitlement + RBAC checks. Section 23 covers the residual risk mitigation.

---

## 19. ER Diagram

```text
                               ┌──────────────────────────┐
                               │      customers          │  PLATFORM
                               │  PK id (UUID)           │
                               │  code (UNIQUE)          │
                               │  email (UNIQUE)         │
                               │  status                 │
                               └────────────┬─────────────┘
                                            │ 1
                                            │
                                            │ N (buys)
                                            │
                                            ▼
 ┌──────────────────────┐          ┌──────────────────────────┐
 │    license_plans     │          │        licenses          │  PLATFORM
 │  PK id (UUID)        │◄─────────┤  PK id (UUID)            │
 │  code (UNIQUE)       │     N     │  license_number (UNIQUE)│
 │  price               │     1     │  activation_secret_hash │
 │  is_active           │          │  status                  │
 └──────────────────────┘          │  start_date / expiry_date│
                                   │  max_users / max_devices │
                                   └──────┬───────────┬───────┘
                                          │           │
                    ┌─────────────────────┘           │
                    │ N                               │ N
                    │                                 │
                    ▼                                 ▼
   ┌──────────────────────────┐            ┌──────────────────────────┐
   │   license_renewals       │            │   organizations          │  TENANT BOUNDARY
   │  PK id (UUID)            │            │  PK id (UUID)            │
   │  prev/new expiry         │            │  organization_code       │
   │  prev/new plan           │            │  (UNIQUE)                │
   │  amount / txn_ref        │            │  legal_name/display_name │
   │  renewed_by/at           │            │  status / settings (JSONB)│
   └──────────────────────────┘            └────────────┬─────────────┘
                                                        │ 1
                                                        │ N
                                                        ▼
   ┌──────────────────────────┐            ┌──────────────────────────┐
   │  license_features        │            │         users            │  TENANT
   │  PK id (UUID)            │            │  PK id (UUID)            │
   │  code (UNIQUE)           │            │  organization_id (NOT NULL)
   │  module_id               │            │  email (unique per org)  │
   └───────────┬──────────────┘            │  password_hash           │
               │ ◄───────────────┐         │  status                  │
               │ N    N          │         └──────────────────────────┘
   ┌───────────▼──────────────┐  │                    │ 1
   │ license_feature_mapping  │  │ N                  │ N
   │  PK id (UUID)            │  │                    ▼
   │  license_id / feature_id │  │          ┌──────────────────────────┐
   │  value / limit_value     │  │          │       user_roles         │  TENANT
   │  (license_id+feature_id) │  │          │  PK id (UUID)            │
   └──────────────────────────┘  │          │  user_id / role_id       │
                                 │          └────────────┬─────────────┘
                                 │                       │ N
   ┌──────────────────────────┐  │                       ▼
   │        roles             │  │          ┌──────────────────────────┐
   │  PK id (UUID)            │  │          │    role_permissions      │  TENANT
   │  organization_id (TENANT)│──┘          │  PK id (UUID)            │
   │  name/slug (org-unique)  │             │  role_id / permission_id │
   │  is_system               │             └────────────┬─────────────┘
   └──────────────────────────┘                          │ N
                                                         ▼
                                         ┌──────────────────────────┐
                                         │       permissions         │  PLATFORM
                                         │  PK id (UUID)            │  catalog
                                         │  slug (UNIQUE)           │
                                         │  module_id               │
                                         └──────────────────────────┘

   Supporting (auth/session, TENANT):  refresh_tokens ──◄── users
                                       user_sessions  ──◄── users
                                       user_permissions (users ──◄── permissions)
   Platform infra: login_attempts, countries / states, application_modules / application_features,
                   docs/documents (tenant via owner)
```

### Relationship cardinality (matching the diagram)

- `customers` 1 ─── N `licenses`
- `licenses` N ─── 1 `organizations` (owner)
- `licenses` N ─── 1 `license_plans`
- `licenses` 1 ─── N `license_renewals`
- `licenses` N ─── N `license_features` (via `license_feature_mapping`)
- `organizations` 1 ─── N `users`
- `organizations` 1 ─── N `roles`
- `users` N ─── N `roles` (via `user_roles`)
- `roles` N ─── N `permissions` (via `role_permissions`)
- `users` N ─── N `permissions` (via `user_permissions`)
- `users` 1 ─── N `refresh_tokens` / `user_sessions`

---

## 20. Relationship Summary

```
Customer     1 ─── N License
License      N ─── 1 Organization
License      N ─── 1 LicensePlan
License      1 ─── N LicenseRenewal
License      N ─── N LicenseFeature   (LicenseFeatureMapping)
Organization 1 ─── N User
Organization 1 ─── N Role
User         N ─── N Role             (UserRole)
Role         N ─── N Permission       (RolePermission)
User         N ─── N Permission       (UserPermission; optional direct grants)
User         1 ─── N RefreshToken
User         1 ─── N UserSession
Country      1 ─── N State
ApplicationModule 1 ─── N ApplicationFeature / Permission / LicenseFeature (grouping)
```

---

## 21. Complete Table Specifications

*(UUID columns below use the v7 convention; all `id` = PK.)*

### 21.1 customers

```
id                  UUID            PK (uuid v7)
code                VARCHAR(40)     NOT NULL
customer_type       VARCHAR(20)     NOT NULL DEFAULT 'company'
company_name        VARCHAR(255)    NULL
first_name          VARCHAR(100)    NULL
last_name           VARCHAR(100)    NULL
email               VARCHAR(255)    NOT NULL
phone               VARCHAR(40)     NULL
tax_number          VARCHAR(100)    NULL
status              VARCHAR(20)     NOT NULL DEFAULT 'active'
billing_address/city/state/country/pincode   (see 2.1) NULL
currency            VARCHAR(10)     NOT NULL DEFAULT 'USD'
created_at          TIMESTAMPTZ     NOT NULL
updated_at          TIMESTAMPTZ     NOT NULL
created_by          UUID            NULL
updated_by          UUID            NULL
deleted_at          TIMESTAMPTZ     NULL
```
- PK: `id` · FK: `created_by`,`updated_by` → users(id) SET NULL · UNIQUE: `code`, `email` ·
  INDEX: `status` · CHECK: `customer_type IN (company,individual)`, `status IN (...)`

### 21.2 licenses

```
id                     UUID       PK
license_number         VARCHAR(40) NOT NULL
activation_secret_hash VARCHAR(64) NULL
customer_id            UUID       NOT NULL
organization_id        UUID       NOT NULL
plan_id                UUID       NOT NULL
status                 VARCHAR(20) NOT NULL DEFAULT 'created'
issue_date             DATE       NULL
start_date             DATE       NULL
expiry_date            DATE       NULL
max_users              INT        NOT NULL DEFAULT 1
max_devices            INT        NOT NULL DEFAULT 1
notes                  TEXT       NULL
activated_at           TIMESTAMPTZ NULL
activated_by           UUID       NULL
revoked_at             TIMESTAMPTZ NULL
revoked_by             UUID       NULL
revoke_reason          VARCHAR(255) NULL
created_at             TIMESTAMPTZ NOT NULL
updated_at             TIMESTAMPTZ NOT NULL
created_by             UUID       NULL
updated_by             UUID       NULL
```
- PK: `id` · FK: customer_id→customers RESTRICT; organization_id→organizations RESTRICT;
  plan_id→license_plans RESTRICT; activated_by/revoked_by/created_by/updated_by→users SET NULL ·
  UNIQUE: `license_number`, `activation_secret_hash` · INDEX: `(organization_id)`, `(customer_id)`,
  `(status)`, `(start_date,expiry_date)` · CHECK: `max_users>=1`, `max_devices>=1`,
  `status IN (created,active,suspended,expired,revoked)`, license_number regex

### 21.3 license_plans

```
id            UUID       PK
code          VARCHAR(40) NOT NULL
name          VARCHAR(100) NOT NULL
description   TEXT       NULL
price         NUMERIC(14,2) NULL
currency      VARCHAR(10) NOT NULL DEFAULT 'USD'
is_active     BOOLEAN    NOT NULL DEFAULT true
sort_order    INT        NOT NULL DEFAULT 0
created_at    TIMESTAMPTZ NOT NULL
updated_at    TIMESTAMPTZ NOT NULL
created_by    UUID       NULL
updated_by    UUID       NULL
```
- PK: `id` · FK: created_by/updated_by→users SET NULL · UNIQUE: `code` · INDEX: `(is_active,sort_order)`

### 21.4 license_features

```
id            UUID       PK
code          VARCHAR(60) NOT NULL
name          VARCHAR(100) NOT NULL
description   TEXT       NULL
module_id     UUID       NULL
is_active     BOOLEAN    NOT NULL DEFAULT true
created_at    TIMESTAMPTZ NOT NULL
updated_at    TIMESTAMPTZ NOT NULL
```
- PK: `id` · FK: module_id→application_modules SET NULL · UNIQUE: `code` · INDEX: `(module_id)`

### 21.5 license_feature_mapping

```
id           UUID    PK
license_id   UUID    NOT NULL
feature_id   UUID    NOT NULL
value        BOOLEAN NOT NULL DEFAULT true
limit_value  INT     NULL
created_at   TIMESTAMPTZ NOT NULL
updated_at   TIMESTAMPTZ NOT NULL
```
- PK: `id` · FK: license_id→licenses **CASCADE**; feature_id→license_features **RESTRICT** ·
  UNIQUE: `(license_id, feature_id)` · INDEX: `(feature_id)`

### 21.6 license_renewals

```
id                    UUID    PK
license_id            UUID    NOT NULL
previous_expiry_date  DATE    NULL
new_expiry_date       DATE    NULL
previous_plan_id      UUID    NULL
new_plan_id           UUID    NULL
type                  VARCHAR(20) NOT NULL DEFAULT 'renewal'  (activation|renewal|extension|reactivation)
amount                NUMERIC(14,2) NULL
currency              VARCHAR(10) NOT NULL DEFAULT 'USD'
transaction_reference VARCHAR(120) NULL
renewed_by            UUID    NULL
renewed_at            TIMESTAMPTZ NOT NULL DEFAULT now()
notes                 VARCHAR(500) NULL
```
- PK: `id` · FK: license_id→licenses **RESTRICT**; prev/new_plan_id→license_plans SET NULL;
  renewed_by→users SET NULL · INDEX: `(license_id, renewed_at)` · immuttable (no `updated_at`)

### 21.7 organizations

```
id                UUID         PK
organization_code VARCHAR(40)  NOT NULL
legal_name        VARCHAR(255) NOT NULL
display_name      VARCHAR(255) NOT NULL
email             VARCHAR(255) NULL
phone             VARCHAR(40)  NULL
address/city/state/country/pincode   NULL
timezone          VARCHAR(100) NOT NULL DEFAULT 'UTC'
locale            VARCHAR(20)  NOT NULL DEFAULT 'en'
currency          VARCHAR(10)  NOT NULL DEFAULT 'USD'
status            VARCHAR(20)  NOT NULL DEFAULT 'active'
settings          JSONB        NOT NULL DEFAULT '{}'
created_at        TIMESTAMPTZ  NOT NULL
updated_at        TIMESTAMPTZ  NOT NULL
created_by        UUID         NULL
updated_by        UUID         NULL
deleted_at        TIMESTAMPTZ  NULL
```
- PK: `id` · FK: created_by/updated_by→users SET NULL · UNIQUE: `organization_code` ·
  INDEX: `(status)` · CHECK: `status IN (active,inactive,suspended,terminated)`

### 21.8 users

```
id                  UUID         PK
organization_id     UUID         NOT NULL
name                VARCHAR(255) NOT NULL
email               VARCHAR(255) NOT NULL
password_hash       VARCHAR(255) NOT NULL
phone               VARCHAR(40)  NULL
gender              VARCHAR(20)  NULL
date_of_birth       DATE         NULL
address/city/state/country/pincode  NULL
avatar_url          VARCHAR(500) NULL
status              VARCHAR(20)  NOT NULL DEFAULT 'active'
email_verified_at   TIMESTAMPTZ  NULL
last_login_at       TIMESTAMPTZ  NULL
must_change_password BOOLEAN     NOT NULL DEFAULT false
created_at          TIMESTAMPTZ  NOT NULL
updated_at          TIMESTAMPTZ  NOT NULL
created_by          UUID         NULL
updated_by          UUID         NULL
deleted_at          TIMESTAMPTZ  NULL
```
- PK: `id` · FK: organization_id→organizations RESTRICT; created_by/updated_by→users SET NULL ·
  UNIQUE: `(organization_id, lower(email))` (partial WHERE deleted_at IS NULL) · INDEX:
  `(organization_id)`, `(organization_id,status)`, `(organization_id,created_at)`, `(email)` ·
  CHECK: `status IN (active,inactive,suspended,locked)`

### 21.9 roles

```
id               UUID         PK
organization_id  UUID         NOT NULL
name             VARCHAR(100) NOT NULL
slug             VARCHAR(100) NOT NULL
description      TEXT         NULL
is_system        BOOLEAN      NOT NULL DEFAULT false
created_at       TIMESTAMPTZ  NOT NULL
updated_at       TIMESTAMPTZ  NOT NULL
created_by       UUID         NULL
updated_by       UUID         NULL
```
- PK: `id` · FK: organization_id→organizations **CASCADE**; created_by/updated_by→users SET NULL ·
  UNIQUE: `(organization_id,name)`, `(organization_id,slug)` · INDEX: `(organization_id,is_system)`

### 21.10 permissions

```
id            UUID         PK
name          VARCHAR(150) NOT NULL
slug          VARCHAR(150) NOT NULL
module_id     UUID         NULL
description   TEXT         NULL
created_at    TIMESTAMPTZ  NOT NULL
updated_at    TIMESTAMPTZ  NOT NULL
```
- PK: `id` · FK: module_id→application_modules SET NULL · UNIQUE: `slug` (+ `name`) · INDEX: `(module_id)`

### 21.11 user_roles

```
id          UUID    PK
user_id     UUID    NOT NULL
role_id     UUID    NOT NULL
assigned_by UUID    NULL
assigned_at TIMESTAMPTZ NOT NULL DEFAULT now()
created_at  TIMESTAMPTZ NOT NULL
updated_at  TIMESTAMPTZ NOT NULL
```
- PK: `id` · FK: user_id→users CASCADE; role_id→roles CASCADE; assigned_by→users SET NULL ·
  UNIQUE: `(user_id, role_id)`

### 21.12 role_permissions

```
id             UUID   PK
role_id        UUID   NOT NULL
permission_id  UUID   NOT NULL
created_at     TIMESTAMPTZ NOT NULL
updated_at     TIMESTAMPTZ NOT NULL
```
- PK: `id` · FK: role_id→roles CASCADE; permission_id→permissions RESTRICT ·
  UNIQUE: `(role_id, permission_id)`

### 21.13 user_permissions
```
id             UUID   PK
user_id        UUID   NOT NULL
permission_id  UUID   NOT NULL
granted_by     UUID   NULL
granted_at     TIMESTAMPTZ NOT NULL DEFAULT now()
created_at     TIMESTAMPTZ NOT NULL
updated_at     TIMESTAMPTZ NOT NULL
```
- PK: `id` · FK: user_id→users CASCADE; permission_id→permissions RESTRICT; granted_by→users SET NULL ·
  UNIQUE: `(user_id, permission_id)`

### 21.14 refresh_tokens
```
id          UUID    PK
user_id     UUID    NOT NULL
token_hash  VARCHAR(255) NOT NULL
expires_at  TIMESTAMPTZ NOT NULL
revoked_at  TIMESTAMPTZ NULL
replaced_by UUID    NULL
user_agent  VARCHAR(255) NULL
ip_address  VARCHAR(45) NULL
created_at  TIMESTAMPTZ NOT NULL
updated_at  TIMESTAMPTZ NOT NULL
```
- PK: `id` · FK: user_id→users CASCADE; replaced_by→refresh_tokens SET NULL ·
  UNIQUE: `token_hash` · INDEX: `(user_id, revoked_at)`

### 21.15 user_sessions
```
id             UUID    PK
user_id        UUID    NOT NULL
device_name    VARCHAR(255) NULL
device_type    VARCHAR(20) NULL
ip_address     VARCHAR(45) NULL
user_agent     TEXT    NULL
last_active_at TIMESTAMPTZ NULL
expires_at     TIMESTAMPTZ NULL
revoked_at     TIMESTAMPTZ NULL
created_at     TIMESTAMPTZ NOT NULL
updated_at     TIMESTAMPTZ NOT NULL
```
- PK: `id` · FK: user_id→users CASCADE · INDEX: `(user_id, revoked_at)`

### 21.16 login_attempts
```
id               UUID    PK
email            VARCHAR(255) NOT NULL
user_id          UUID    NULL
organization_id  UUID    NULL
success          BOOLEAN NOT NULL DEFAULT false
ip_address       VARCHAR(45) NULL
user_agent       TEXT    NULL
attempted_at     TIMESTAMPTZ NOT NULL DEFAULT now()
```
- PK: `id` · FK: user_id→users SET NULL; organization_id→organizations SET NULL ·
  INDEX: `(email,attempted_at)`, `(ip_address,attempted_at)`

*(`application_modules`, `application_features`, `countries`, `states`, `documents`, and the future
`audit_logs` are catalog/reference/infra tables; their full specs align with Sections 2–8 and will
be detailed together with the business tables in later tasks. Key specs already implied above:
`application_modules` unique name/slug; `application_features` module_id FK; `countries` unique
code; `states` country_id FK; `documents` polymorphic morphs + uploaded_by.)*

---

## 22. Scenario Validation

### Scenario 1 — Two customers, same account code
Customer A and Customer B both want `ACCOUNT-001`. Because `ACCOUNT-001` lives on a **tenant-scoped**
future table with unique `(organization_id, account_code)` **and not** a global unique, both are
allowed. ✅ **Resolution:** tenant-scoped composite uniqueness (Section 13).

### Scenario 2 — Same email in two different organizations
**Decision: email is UNIQUE PER ORGANIZATION, not globally.** A user's identity is
`(organization_id, email)`. Two different clinics may each have a `john@clinic.com`; this is
legitimate and common in ERP. Unique constraint: `(organization_id, lower(email))` (partial for
soft-deleted). Login must resolve email **within** the requested organization (email alone is not
enough for the global login screen — the org context must be established first, e.g. via
organization code/domain, then authenticate). ✅

> Note: this deliberately **changes** the current `users.email` global-unique and
> `customers.email` platform-global (customers are platform-level, so their email stays globally
> unique).

### Scenario 3 — License expiration
License `status → expired` (or computed from `expiry_date`). The organization and all its business
data remain completely intact — because business tables reference `organization_id`, **not**
`licenses.id`. Enforcement is at the application/auth layer: the tenant-scope checker consults
`licenses.status`/`expiry_date` for that org and refuses new API access. Data is never deleted or
hidden by expiry. ✅

### Scenario 4 — License renewal
Customer renews. The same `organizations.id` and all business data are retained; only the
entitlement changes. A new `license_renewals` row records previous→new term/plan/amount, and
`licenses.expiry_date`/`plan_id`/`status` are updated to reflect the current entitlement. No
business data is touched. ✅

### Scenario 5 — Customer cancellation
License → `REVOKED`/`EXPIRED`. The customer's historical data and the organization persist:
`customers` and `organizations` are soft-deletable but never auto-deleted by license state, and
changing a license never cascades to business rows (RESTRICT rules + business tables do not FK to
`licenses`). Backups/retention keep financial truth. ✅

### Scenario 6 — Cross-tenant access
User from Organization A trying to access Organization B is prevented by:
1. `users.organization_id` (single org) — no membership pivot to exploit.
2. Every tenant-scoped query must include the caller's `organization_id` (from a verified JWT +
   re-validated server-side entitlement), so a user can never reference org B rows.
3. Composite unique/index leading with `organization_id` and RBAC checks bound each action to the
   caller org.
4. No global endpoint returns rows unfiltered by org (all tenant endpoints are org-scoped).
✅

---

## 23. Database Design Risks

| # | Risk | Mitigation |
|---|------|------------|
| 1 | **Tenant data leakage** (most critical) | Explicit `organization_id NOT NULL` on every tenant table; query scaffolding that always appends org predicate; RBAC + server-side entitlement revalidation; composite indexes lead with org; dataset is not partitioned by tenant but org is always mandatory. |
| 2 | **Incorrect unique constraints** (global vs tenant) | Global uniqueness only on true platform identifiers (license_number, org_code, plan/feature/permission codes); tenant-scoped uniqueness via `(organization_id, field)`; documented in Section 13. |
| 3 | **Unsafe cascading deletes** (financial/business data loss) | RESTRICT on licenses→customer/org, renewals→license, users→org, document/file owners; CASCADE only on transient pivots and tenant-owned roles; Section 14 table. |
| 4 | **License/data coupling** | Business tables FK to `organization_id`, never `licenses.id`; license expiry/revocation affects only entitlement checks, never data. |
| 5 | **Poor indexing** | Index only queried predicates; composite `(organization_id, …)` indexes; Section 17. |
| 6 | **Over-normalization** | No reference tables for tiny statuses (CHECK instead); no `organization_settings` table in v1 (single JSONB); no per-plan artifact tables beyond what's needed. |
| 7 | **Under-normalization** | License features NOT booleans on licenses (normalized mapping); license plan normalized; prevents column explosion later. |
| 8 | **Future multi-branch / multi-org** | Multi-org path is additive (`user_organizations` pivot) without redesign; UUIDv7 + org-leading indexes keep partitioning/extension options open; `user_sessions` supports per-device limits. |
| 9 | **Secret exposure** | Activation secret stored only as hash (`activation_secret_hash`), separated from displayable `license_number`; refresh tokens hashed (`token_hash`); passwords bcrypt. |
| 10 | **Email uniqueness ambiguity** | Explicit decision: per-org email uniqueness + org-context login; avoids global collision and enumeration. |
| 11 | **History loss on renewal/revoke** | Append-only `license_renewals` + `audit_logs`; licenses deactivated never deleted. |
| 12 | **Enum re-migration lock issues** | VARCHAR + CHECK instead of PG ENUM avoids `ALTER TYPE` rewrite/serialization on status additions. |

---

## 24. Final Database Architecture

| Decision | Choice |
|----------|--------|
| **Database strategy** | ONE PostgreSQL database, **shared tables**, `organization_id` column → tenant isolation. Single schema; global admin views all tenants. |
| **Primary key strategy** | **UUID v7** (`id UUID PRIMARY KEY`) on every table. Time-ordered (index-locality like bigint) + secure + distributed-generation friendly. |
| **Tenant strategy** | Shared schema + `organization_id NOT NULL` on all tenant-scoped tables; org-leading composite unique/index; application + RBAC + entitlement enforcement. |
| **License strategy** | `licenses` is platform-scoped entitlement bound to ONE `organization_id`; plan normalized via `license_plans`; features via `license_feature_mapping`; history via immutable `license_renewals`. Business tables never reference `licenses`. |
| **Organization strategy** | Single `organizations` tenant table (+ nullable JSONB `settings`); organization_code globally unique; org is the license tenant + user container. |
| **User strategy** | `users` with single `organization_id` (one user → one org in v1); email unique per org; uses/password-hashed; soft deletable; auth via JWT + `refresh_tokens` + `user_sessions` + `login_attempts`. |
| **RBAC strategy** | Roles tenant-scoped (`organization_id`); permissions platform catalog; `user_roles`, `role_permissions`, optional `user_permissions` pivots; role/user org alignment enforced. |
| **Status strategy** | `VARCHAR(20)` + `CHECK status IN (...)` — closed sets, DB-validated, no PG-ENUM lock penalty, no reference tables. |
| **Audit strategy** | Per-record `created_at/updated_at` (+ `created_by/updated_by` where actor matters) for operational metadata; dedicated append-only `audit_logs` (actor/entity/before/after) for authoritative history. |
| **Deletion strategy** | Soft-delete (`deleted_at`) users/customers/organizations/documents; deactivate-only licenses; append-only renewals/audit; CASCADE only on transient pivots/sessions; RESTRICT on financial/license/org critical FKs. |
| **Indexing strategy** | Composite indexes leading with `organization_id` on tenant tables; unique global on platform identifiers; targeted `(status)`, `(org,status)`, `(org,created_at)`, `(org,code)`, `(license_number)`, `(token_hash)`; no blind column indexing. |
| **Feature (license) strategy** | Normalized `license_features` + `license_feature_mapping(license_id, feature_id, value, limit_value)`; extensible, no boolean columns. |
| **License number** | `LIC-YYYY-XXXXXXXX` human-readable + UNIQUE; separate `activation_secret_hash` (SHA-256) — never raw secret. |

---

## 25. Task 2 Status

- ✅ Database strategy defined (shared DB + shared tables + `organization_id`)
- ✅ Platform tables specified (customers, licenses, license_plans, license_features,
  license_feature_mapping, license_renewals)
- ✅ Organization tables specified (organizations)
- ✅ User / RBAC tables specified (users, roles, permissions, user_roles, role_permissions,
  user_permissions, refresh_tokens, user_sessions, login_attempts)
- ✅ User–organization relationship decided (Option A — one user → one org)
- ✅ Primary key strategy decided (UUID v7)
- ✅ Common columns and audit strategy defined
- ✅ Status strategy decided (VARCHAR + CHECK)
- ✅ License model, number strategy, renewal model, feature model defined
- ✅ Tenant-scoped uniqueness documented
- ✅ Foreign-key / delete rules defined
- ✅ Soft-delete strategy defined
- ✅ Indexing strategy defined
- ✅ Platform vs tenant scope classified
- ✅ ER diagram produced
- ✅ Relationship summary produced
- ✅ Complete table specifications produced
- ✅ Scenario validation performed (6 scenarios)
- ✅ Risks identified and mitigated

This design is complete and ready as the foundation for Task 3 (Java/JPA entities + migrations).

TASK 2 STATUS: READY FOR REVIEW
