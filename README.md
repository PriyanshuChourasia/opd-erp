# Doctor ERP — Complete Clinic & Hospital Management System

![OPD ERP Dashboard](</var/folders/cf/8zyqpdhs1l900bf7ll9jp8180000gp/T/TemporaryItems/NSIRD_screencaptureui_7SHwzm/Screenshot 2026-07-05 at 16.18.01.png>)

**One platform. Every patient touchpoint. Zero duplication.**

Doctor ERP is a modern, full-stack clinic and hospital management system that covers the entire patient journey — from walk-in registration to pharmacy checkout — in a single, unified application. Built for **ADMIN**, **DOCTOR**, **RECEPTIONIST**, **PHARMACIST**, and **NURSE** roles, it replaces scattered spreadsheets, paper registers, and half-baked legacy software with a cohesive, real-time operating system for your clinic.

---

## Why Doctor ERP?

Running a clinic means juggling appointments, prescriptions, billing, inventory, and queues — all at once. Most software handles one piece well and falls apart on the rest. Doctor ERP is different:

- **🔄 End-to-end coverage** — Registration → Appointment Booking → Token Queue → Consultation → Prescription → Lab/Radiology Orders → Billing → Dispensing. No context-switching between five different apps.
- **⚡ Real-time, not stale** — Live queue board auto-refreshes so reception, nurses, and doctors see the same instant state. No shouting across the hallway.
- **🧩 Role-native interfaces** — A POS cashier gets a fast, full-width terminal screen, not a cramped sidebar dashboard. Doctors see their consult workflow. Reception sees the waiting room. Each role, its own view.
- **🔐 Built-in RBAC** — Granular permissions (`resource:action` model) baked into every endpoint. ADMIN gets `*:*`, everyone else gets exactly what they need. Refresh-token rotation with theft detection included.
- **📋 Smart prescriptions** — Typeahead-search the drug catalog, auto-generate lab/radiology/procedure orders, track substitutions, and flag patient allergies — right in the consult flow.
- **💰 POS that works** — Patient search, medicine catalog, editable cart, discount ( % or flat ), CASH/CARD/UPI toggle, and receipt-ready billing. All in one screen.

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
| **Queue Management** | Real-time token queue per doctor, status transitions (WAITING → IN_PROGRESS → COMPLETED / SKIPPED / NO_SHOW), 15-second auto-refresh |
| **Appointments** | Walk-in, scheduled & follow-up types; slot generation from recurring doctor schedules; check-in tracking |
| **Consultation** | Full vitals (BP, pulse, SpO₂, temperature, weight, height), diagnosis, clinical notes, follow-up scheduling |
| **Prescriptions & Orders** | Medicine prescribing with catalog search + substitution tracking; lab, radiology & procedure orders with status lifecycle |
| **Medicine Catalog** | Drug master with brand/generic name, composition, strength, form & manufacturer; autocomplete search |
| **Billing / POS** | Standalone & appointment-scoped billing; discount engine; CASH/CARD/UPI payment modes; refund audit trail |
| **Pharmacy Dispensing** | Per-medicine quantity dispense, partial fulfillment, substitution tracking linked to original prescription |
| **Roles & Permissions** | CRUD for roles and permissions; ADMIN wildcard; every endpoint authorization-gated with RBAC middleware |
| **Doctor Schedules** | Weekly recurring schedules per doctor; slot-duration config; auto-generates bookable appointment slots |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Backend** | NestJS 11 + TypeScript — single unified service (no schema duplication) |
| **Database** | PostgreSQL + Prisma ORM 5 |
| **Auth** | JWT (access + refresh with rotation & theft detection), bcryptjs, Passport strategies |
| **Frontend** | React 19 + Vite 6 + TanStack Router (file-based) + TanStack Query + Redux Toolkit |
| **Styling** | Tailwind CSS v4 + shadcn/ui (Radix Nova) — CSS-first config, no PostCSS |
| **Monorepo** | Turborepo + npm workspaces |
| **Validation** | Zod + class-validator on API, react-hook-form + zod on frontend |

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

# Start dev (all apps in parallel)
npm run dev

# Start a single app
npm run dev -- --filter=api        # NestJS backend on :4000
npm run dev -- --filter=clinic-ui  # React SPA on :3000
```

---

## Target Users

- **🏥 Multi-speciality clinics** — Manage multiple doctors, schedules, and patient flows from one console
- **🩺 Single-doctor practices** — Lightweight enough for a solo practitioner, powerful enough to grow with
- **💊 Pharmacy-integrated clinics** — Prescribe, dispense, and bill in the same system — no manual handoffs
- **🧪 Diagnostic centres** — Lab, radiology, and procedure order management built right in

---

## Screenshots

![Doctor ERP Dashboard](</var/folders/cf/8zyqpdhs1l900bf7ll9jp8180000gp/T/TemporaryItems/NSIRD_screencaptureui_7SHwzm/Screenshot 2026-07-05 at 16.18.01.png>)

---

## Roadmap

- [x] Full patient-journey data model & API surface
- [x] Role-based auth with JWT refresh rotation
- [x] Live queue, appointments, consultation & prescription workflows
- [x] POS billing with discount engine & multi-payment modes
- [x] Pharmacy dispensing with partial fulfillment
- [ ] Real-time WebSocket queue (replacing polling)
- [ ] Payment gateway integration (Razorpay / Stripe)
- [ ] Multi-branch / multi-clinic scoping
- [ ] File & image uploads (lab reports, radiology images)
- [ ] Soft-delete + full audit trail on clinical records
- [ ] Automated test suite & CI pipeline

---

<p align="center">
  Built with TypeScript • NestJS • React • Prisma • Tailwind • Turborepo
</p>
