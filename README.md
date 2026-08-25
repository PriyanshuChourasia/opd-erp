# Doctor ERP — Complete Clinic & Hospital Management System

![MyClinic Dashboard](</images/opd.png>)

**One platform. Every patient touchpoint. Zero duplication.**

Doctor ERP is a modern, full-stack clinic and hospital management system that covers the entire patient journey — from walk-in registration to pharmacy checkout — in a single, unified application. Built for **ADMIN**, **DOCTOR**, **RECEPTIONIST**, **PHARMACIST**, **NURSE**, and **DEVELOPER** roles, it replaces scattered spreadsheets, paper registers, and half-baked legacy software with a cohesive, real-time operating system for your clinic.

---

## Why Doctor ERP?

Running a clinic means juggling appointments, prescriptions, billing, inventory, and queues — all at once. Most software handles one piece well and falls apart on the rest. Doctor ERP is different:

- **🔄 End-to-end coverage** — Registration → Appointment Booking → Token Queue → Consultation → Prescription → Lab/Radiology Orders → Billing → Dispensing. No context-switching between five different apps.
- **⚡ Real-time, not stale** — Live queue board auto-refreshes so reception, nurses, and doctors see the same instant state. No shouting across the hallway.
- **🧩 Role-native interfaces** — A POS cashier gets a fast, full-width terminal screen, not a cramped sidebar dashboard. Doctors see their consult workflow. Reception sees the waiting room. Each role, its own view.
- **🔐 Built-in RBAC** — Granular permissions (`resource:action` model) baked into every endpoint. ADMIN gets `*:*`, everyone else gets exactly what they need. Permissions guard + roles decorator pattern.
- **📋 Smart prescriptions** — Typeahead-search the drug catalog, auto-generate lab/radiology/procedure orders, track substitutions, and flag patient allergies — right in the consult flow.
- **📝 Prescription templates** — Reusable template builder with preview. Create, edit, and apply templates to speed up consultations.
- **💰 POS that works** — Patient search, medicine catalog, editable cart, discount ( % or flat ), CASH/CARD/UPI toggle, and receipt-ready billing. All in one screen.
- **🏥 Specialization management** — Manage doctor specializations with search and filtering across the platform.

---

## The Patient Journey

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

## Core Modules

| Module | What it does |
|--------|-------------|
| **Queue Management** | Real-time token queue per doctor, status transitions (WAITING → IN_PROGRESS → SEND_IN → COMPLETED / SKIPPED / NO_SHOW / CANCELLED), 15-second auto-refresh, cancel & reschedule support |
| **Appointments** | Walk-in, scheduled & follow-up types; slot generation from recurring doctor schedules; check-in tracking; edit & reschedule |
| **Consultation** | Full vitals (BP, pulse, SpO₂, temperature °F/°C, weight, height), diagnosis, clinical notes, follow-up scheduling |
| **Patient Vitals** | Dedicated vitals recording with history tracking per patient — temperature in Fahrenheit, blood pressure, pulse, SpO₂, weight, height |
| **Prescriptions & Orders** | Medicine prescribing with catalog search + substitution tracking; lab, radiology & procedure orders with status lifecycle |
| **Prescription Templates** | Reusable template builder with rich preview — create, edit, and apply templates to speed up consultations |
| **Print Prescription** | One-click prescription PDF generation for printing or sharing with patients |
| **Medicine Catalog** | Drug master with brand/generic name, composition, strength, form & manufacturer; autocomplete search |
| **Billing / POS** | Standalone & appointment-scoped billing; discount engine; CASH/CARD/UPI payment modes; refund audit trail |
| **Pharmacy Dispensing** | Per-medicine quantity dispense, partial fulfillment, substitution tracking linked to original prescription |
| **Roles & Permissions** | CRUD for roles and permissions; ADMIN wildcard; every endpoint authorization-gated with RBAC middleware + permissions guard |
| **Doctor Schedules** | Weekly recurring schedules per doctor; slot-duration config; auto-generates bookable appointment slots |
| **Specializations** | Manage medical specializations; search, filter, and assign to doctors |
| **Patient Allergies** | Track patient allergies with full allergy catalog; allergy-aware prescribing |
| **Diagnoses & Systems** | Diagnosis catalog with ICD-style systems; attach diagnoses to consultations |
| **Documents** | Upload registry for lab reports, radiology images, doctor certificates, and profile photos |
| **Developer Platform** | Module registry (`GET /modules`), live database schema explorer (`GET /database-schema`) — introspect the API at runtime |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Backend** | NestJS 11 + TypeScript — single unified service (no schema duplication) |
| **Database** | PostgreSQL 16 + Prisma ORM 5 (34 data models) |
| **Auth** | JWT (access + refresh with rotation & theft detection), bcryptjs, Passport strategies |
| **Frontend** | React 19 + Vite 6 + TanStack Router (file-based) + TanStack Query + Redux Toolkit |
| **Styling** | Tailwind CSS v4 + shadcn/ui (Radix Nova) — CSS-first config, no PostCSS |
| **Monorepo** | Turborepo + npm workspaces |
| **Validation** | Zod + class-validator on API, react-hook-form + zod on frontend |
| **Docker** | Docker Compose with PostgreSQL 16 Alpine + API service + persistent uploads volume |

---

## Getting Started

```bash
# Clone
git clone <repo-url>
cd doctor-erp

# Install
npm install

# Set up environment
cp apps/api/.env.example apps/api/.env

# Push database schema
cd apps/api && npx prisma db push && cd ../..

# Seed demo data (10 doctors, users for each role, patients, medicines…)
cd apps/api && npx prisma db seed && cd ../..

# Start dev (all apps in parallel)
npm run dev

# Start a single app
npm run dev -- --filter=api        # NestJS backend on :4000
npm run dev -- --filter=clinic-ui  # React SPA on :3000
```

### Docker

```bash
# Start Postgres + API in containers (Postgres on host port 5433)
docker-compose up -d

# Run migrations inside the container
docker-compose exec api npx prisma migrate deploy

# Seed demo data
docker-compose exec api npx prisma db seed
```

### Demo Logins (after seeding)

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@demo.com | password |
| Doctor | doctor@demo.com | password |
| Receptionist | receptionist@demo.com | password |
| Pharmacist | pharmacist@demo.com | password |

---

## Architecture

```
   Browser (clinic-ui :3000, Vite proxies /api AND /uploads → :4000)
                    │
                    ▼
         ┌─────────────────────┐          ┌──────────────────┐
         │    api (:4000)      │  Prisma  │ postgres :5433   │
         │  NestJS + Passport  ├─────────►│ (docker or local │
         │  JWT + static       │          │  doctor_erp_v2)  │
         │  /uploads serving   │          └──────────────────┘
         └─────────────────────┘
```

---

## Project Structure

```
doctor-erp/
├── docker-compose.yml            # postgres_db (:5433 host) + api service + uploads volume
├── README.md                     # This file
├── apps/
│   ├── api/                      # NestJS 11 backend (port 4000)
│   │   ├── prisma/
│   │   │   ├── schema.prisma     # 34 models (User, Doctor, Patient, Appointment, Prescription…)
│   │   │   └── seed.ts           # Rich demo data — `npx prisma db seed -- --fresh` wipes & reseeds
│   │   └── src/
│   │       ├── main.ts           # Bootstrap: /health, /uploads static, CORS, global pipes
│   │       ├── app.module.ts     # ConfigModule(global) + 30+ feature modules
│   │       ├── auth/             # JWT strategy, guards, roles decorator, register/login/me
│   │       ├── common/           # paginate() util, module-registry, slot-generator, filters
│   │       └── [30+ modules]     # appointments, queue, prescriptions, billing, dispensing…
│   └── clinic-ui/                # React 19 + Vite + TanStack Router (port 3000)
│       └── src/
│           ├── lib/api.ts        # Typed API client (~1900 lines — the API contract mirror)
│           ├── lib/roles.ts      # Role-based routing logic
│           ├── layouts/          # Per-role chrome: admin, doctor, POS, receptionist, patient, developer
│           ├── modules/          # 30+ domain feature dirs
│           ├── components/       # shadcn/ui + shared components
│           └── routes/           # File-based routing with pathless role layouts
└── packages/                     # Shared: eslint-config, typescript-config, ui (unused)
```

---

## Target Users

- **🏥 Multi-speciality clinics** — Manage multiple doctors, schedules, and patient flows from one console
- **🩺 Single-doctor practices** — Lightweight enough for a solo practitioner, powerful enough to grow with
- **💊 Pharmacy-integrated clinics** — Prescribe, dispense, and bill in the same system — no manual handoffs
- **🧪 Diagnostic centres** — Lab, radiology, and procedure order management built right in

---

## Screenshots

![Doctor ERP Dashboard](</images/opd.png>)

---

## Roadmap

### ✅ Completed

- [x] Full patient-journey data model & API surface (34 Prisma models)
- [x] Role-based auth with JWT access/refresh tokens
- [x] Live queue with SEND_IN, cancel, and reschedule support
- [x] Appointments — walk-in, scheduled, follow-up with edit & reschedule
- [x] Consultation workflow with patient vitals (°F/°C)
- [x] Prescription printing (PDF generation)
- [x] Prescription template builder with preview
- [x] POS billing with discount engine & multi-payment modes
- [x] Pharmacy dispensing with partial fulfillment
- [x] Specialization management
- [x] Patient allergy tracking & allergy-aware prescribing
- [x] Diagnosis catalog with ICD-style systems
- [x] Document uploads (lab reports, certificates, profile photos)
- [x] Developer platform (module registry + live schema explorer)
- [x] Demo data seeding with rich sample data
- [x] Docker Compose deployment setup

### 🔜 Planned

- [ ] Real-time WebSocket queue (replacing polling)
- [ ] Payment gateway integration (Razorpay / Stripe)
- [ ] Multi-branch / multi-clinic scoping
- [ ] Soft-delete + full audit trail on clinical records
- [ ] Automated test suite & CI pipeline
- [ ] SMS / email notifications (appointment reminders, prescription ready)
- [ ] Patient portal enhancements (online booking, report downloads)

---

<p align="center">
  Built with TypeScript • NestJS • React 19 • Prisma • Tailwind CSS v4 • Turborepo
</p>
