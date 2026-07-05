# AGENTS.md — OPD ERP

## Status

v2 rebuild in progress. The v1 stack (Express `apps/api` + `apps/auth-api` + TanStack Router
`apps/clinic-ui`, dual-Prisma-schema) was deleted on 2026-07-02 and is being replaced with a
single unified NestJS backend + a fresh TanStack Router frontend. See `PROJECT_BLUEPRINT.md`
at the repo root for the full v1 data model, API surface, and the list of v1 weaknesses this
rebuild exists to fix (schema duplication, two auth implementations, no tests, etc.) — treat
it as the spec for what to (re)build, not as current code.

`apps/api` has module/controller/service skeletons for the full v1 feature set (auth, doctors,
patients, appointments, prescriptions, billing, dispensing, etc. — see `app.module.ts`), all
Nest-CLI-generated and currently **empty** (no route handlers, no Prisma models beyond the
`Placeholder` stub). `apps/clinic-ui` has a real design system (Tailwind v4 + shadcn/ui + zod +
react-hook-form) and five live routes: `/` (landing/intro + register form), `/login`,
`/dashboard` (+ sidebar app), and `/pos` (separate layout, cashier screen). All forms/mutations
call real, correctly-shaped endpoints on the empty `apps/api` controllers, so they currently
404 — that's expected, not a bug, and will start working as each controller gets real handlers.

## Build / Test / Lint

All commands run from the monorepo root.

```
npm install              # install all workspace deps
npm run dev               # start all apps in dev mode (turbo dev)
npm run build              # production build all apps (turbo build)
npm run lint                # lint all apps (turbo lint)
npm run check-types          # type-check all apps (turbo check-types)
npm run format                 # prettier format all TS/TSX/MD files
```

**Filter to a single app:**

```
npm run dev -- --filter=api
npm run dev -- --filter=clinic-ui
```

**Per-app scripts (inside each app directory):**

| App | Dev | Build | DB |
|-----|-----|-------|-----|
| `apps/api` | `nest start --watch` | `nest build` | `npx prisma migrate dev`, `npx prisma db push`, `npx prisma studio` |
| `apps/clinic-ui` | `vite --port 3000` | `tsc --noEmit && vite build` | — |

**Environment:** Copy `apps/api/.env.example` to `apps/api/.env`. Single PostgreSQL database
— `doctor_erp` (the v1 database of the same name still exists locally with v1 seed data;
either reuse it or point at a fresh one — the v2 schema starts empty except for a throwaway
`Placeholder` model that exists only so `prisma generate` has something to generate).

## Architecture

```
        Browser (clinic-ui :3000, Vite dev proxy /api → :4000)
                         │
                         ▼
              ┌─────────────────────┐
              │     api (:4000)     │  Single NestJS service:
              │  Nest + Prisma      │  identity/RBAC + clinical domain,
              │  global prefix /api │  one Prisma schema (no duplication)
              └─────────────────────┘
```

### Apps

- **`apps/api`** (NestJS, port 4000) — Single backend service for everything: auth/RBAC and
  clinical domain, replacing the v1 split of `apps/api` + `apps/auth-api`. Global route prefix
  `api` (set in `main.ts`), CORS enabled. Currently wired: `ConfigModule` (global), `PrismaModule`
  (global, `PrismaService` extends `PrismaClient`), `HealthModule` → `GET /api/health`.
  CommonJS (not ESM) — Nest's decorator/reflect-metadata pipeline is more reliable under
  CommonJS, so this app deliberately does not set `"type": "module"` even though the rest of
  the repo does.
- **`apps/clinic-ui`** (Vite + TanStack Router, port 3000) — SPA. TanStack Router file-based
  routing (routes in `src/routes/`, generated tree at `src/routeTree.gen.ts` — **note: this is
  a v2-plugin-version change from v1, where it generated at the app root; do not edit it**),
  TanStack Query for server state (staleTime 30s, retry 1), Redux Toolkit for auth state only
  (typed hooks in `src/store/hooks.ts`). **Tailwind v4** (CSS-first config via `@import
  "tailwindcss"` + `@theme` in `src/index.css` — no `tailwind.config.js`/`postcss.config.js`,
  Tailwind runs through the `@tailwindcss/vite` plugin instead) + **shadcn/ui** components in
  `src/components/ui/` (`radix-nova` style/preset — see `components.json`; components are
  CLI-generated via `npx shadcn@latest add <name>`, don't hand-edit them, re-run the CLI with
  `--overwrite` instead). Forms use **react-hook-form + zod** (`@hookform/resolvers/zod`)
  composed with shadcn's `Field`/`FieldLabel`/`FieldError`/`FieldGroup` primitives — **not**
  the classic shadcn `Form` component, which is an empty stub in this CLI/registry version (see
  Tips below). Dev proxy `/api` → `http://localhost:4000`. JWT will go in `localStorage` as
  `clinic_access_token` (slice already reads/writes this key; no backend endpoint issues real
  tokens yet).

### Packages

- **`@repo/ui`** — Shared React components (button, card, code). Unused by clinic-ui so far,
  which has its own `components/ui/`.
- **`@repo/eslint-config`** — Shared ESLint config (`base`, `next.js`, `react-internal`).
  `apps/api` uses `base`, `apps/clinic-ui` uses `react-internal`.
- **`@repo/typescript-config`** — Shared TS configs. Both new apps extend `base.json` and
  override `declaration`/`declarationMap` to `false` (they're not libraries) plus whatever
  module/moduleResolution their bundler needs (`nodenext` for Nest, `Bundler`/`ESNext` for Vite).

## Key Files & Directories

```
opd-erp/
├── PROJECT_BLUEPRINT.md      # v1 spec: full data model, API surface, RBAC/JWT detail,
│                              #   frontend routes, and known v1 weaknesses to fix in v2
├── turbo.json
├── package.json
├── apps/
│   ├── api/
│   │   ├── prisma/schema.prisma   # Single schema (no more auth-api duplicate). Currently
│   │   │                          #   just a `Placeholder` model — delete it once real
│   │   │                          #   models are added (Prisma requires ≥1 model to generate).
│   │   ├── .env.example
│   │   └── src/
│   │       ├── main.ts             # bootstrap, CORS, global prefix 'api'
│   │       ├── app.module.ts       # ConfigModule + PrismaModule + HealthModule
│   │       ├── prisma/             # PrismaModule (global) + PrismaService
│   │       └── health/             # HealthController → GET /api/health
│   └── clinic-ui/
│       ├── components.json         # shadcn CLI config: style "radix-nova", @/* aliases
│       ├── vite.config.ts          # TanStack Router + @tailwindcss/vite + react plugins,
│       │                           #   @ alias → ./src, dev proxy
│       └── src/
│           ├── main.tsx            # Router + QueryClient + Redux Provider
│           ├── index.css           # @import "tailwindcss" + shadcn's generated @theme /
│           │                       #   oklch color tokens (Tailwind v4 CSS-first config)
│           ├── lib/api.ts          # apiFetch() + searchPatients/searchMedicines/createBill
│           │                       #   typed fetchers, injects JWT header
│           ├── lib/utils.ts        # cn()
│           ├── lib/roles.ts        # getHomeRoute(roleName) — RECEPTIONIST → "/pos", else
│           │                       #   "/dashboard". Single source of truth for role-based
│           │                       #   landing; used at login/register success AND as a
│           │                       #   render-time guard on /dashboard (see below).
│           ├── store/               # Redux: auth-slice (persists BOTH accessToken and user
│           │                        #   to localStorage — clinic_access_token/clinic_user —
│           │                        #   so identity/role survive a refresh) + hooks.ts
│           │                        #   (useAppDispatch/useAppSelector)
│           ├── components/ui/       # shadcn-generated: button, input, label, card, field,
│           │                        #   separator, table, sidebar, breadcrumb, dropdown-menu,
│           │                        #   avatar, badge, tooltip, sheet, skeleton — regenerate
│           │                        #   via `shadcn add`, don't hand-edit
│           ├── components/layout/   # app-sidebar.tsx (dashboard nav + user menu),
│           │                        #   coming-soon.tsx (shared placeholder for unbuilt
│           │                        #   dashboard sections)
│           └── routes/
│               ├── __root.tsx, index.tsx (public landing + register form), login.tsx
│               │   — both forms use react-hook-form + zod + the Field* components, and on
│               │   success navigate to `getHomeRoute(user.roleName)`, not a hardcoded route
│               ├── _dashboard.tsx   # pathless layout: SidebarProvider + AppSidebar + header
│               │                    #   (SidebarTrigger + breadcrumb from route
│               │                    #   staticData.title) wrapping <Outlet/>. NOT auth-guarded
│               │                    #   yet — no backend auth route exists to guard against.
│               ├── _dashboard/      # dashboard.tsx (/dashboard — redirects desk roles to
│               │                    #   /pos via <Navigate/>, see Tips below; otherwise real
│               │                    #   placeholder stat cards) + queue, appointments,
│               │                    #   patients, doctors, prescriptions, medicine-catalog,
│               │                    #   billing, dispensing (<ComingSoon/> placeholders — exist
│               │                    #   so the sidebar Links type-check; replace with real
│               │                    #   pages as each backend module is built)
│               ├── _pos.tsx         # SEPARATE pathless layout from _dashboard — no sidebar,
│               │                    #   slim top bar (brand, Dashboard link, user menu).
│               │                    #   Deliberately distinct chrome for a cashier-terminal
│               │                    #   workflow, not nested inside the dashboard shell.
│               └── _pos/pos.tsx     # /pos — patient search, medicine-catalog search → cart
│                                    #   (shadcn Table, editable qty/price since MedicineCatalog
│                                    #   has no price field yet), discount %/flat toggle,
│                                    #   CASH/CARD/UPI toggle, "Complete sale" → POST
│                                    #   /api/billing (expected 404 for now)
│           routeTree.gen.ts is generated INSIDE src/ (v2 plugin default) — do not edit, don't
│           import from "../routeTree.gen"
└── packages/
    ├── eslint-config/
    ├── typescript-config/
    └── ui/src/
```

## Coding Conventions

- **TypeScript strict mode** everywhere via `@repo/typescript-config/base.json`
  (`noUncheckedIndexedAccess: true` — always guard indexed access).
- **`apps/api` is CommonJS**, everything else in the repo is ESM (`"type": "module"`). This is
  intentional (see Architecture above), not an oversight — don't "fix" it by adding
  `"type": "module"` to `apps/api/package.json`.
- **Naming**: kebab-case files, camelCase vars/functions, PascalCase React components/Nest
  classes/Prisma models/enums.
- **API response shape** (carried over from v1, not yet implemented anywhere): `{ data: ... }`
  for single items, `{ data: [...], total, page, limit }` for lists.
- **Frontend state**: TanStack Query for server state, Redux Toolkit for client auth state only
  (use the typed `useAppDispatch`/`useAppSelector` from `src/store/hooks.ts`, not the untyped
  react-redux hooks directly).
- **Frontend forms**: react-hook-form + zod (`zodResolver`), composed with shadcn's `Field*`
  primitives — see `apps/clinic-ui`'s Architecture entry and Tips below.
- **No test infrastructure wired up yet** in either app (Nest CLI's default Jest scaffold
  exists in `apps/api` but is untouched — no real specs written).

## Tips for AI Agents

- **Role-based landing route: `getHomeRoute()` in `lib/roles.ts` is the single source of
  truth — don't hardcode `/dashboard` as "the" post-login destination.** Currently only
  `RECEPTIONIST` maps to `/pos`; everyone else gets `/dashboard`. It's called in two places
  that must stay in sync: (1) `login.tsx`/`index.tsx`'s mutation `onSuccess`, and (2)
  `_dashboard/dashboard.tsx`'s render-time `<Navigate to="/pos" replace />` guard, which
  catches a desk-role user who navigates to `/dashboard` directly (e.g. via browser history)
  rather than only redirecting at login. If you add more roles/destinations, extend the
  `DESK_ROLES` set / the function's return type, not ad-hoc checks scattered across routes.
- **`/pos` is intentionally a separate layout (`_pos.tsx`), not nested in `_dashboard`.** It
  has no sidebar — full-width cashier workspace, slim top bar instead. `_dashboard`'s
  `AppSidebar` still links to `/pos` (Pharmacy & Billing group) so non-desk roles can reach it
  manually; `_pos.tsx`'s top bar links back to `/dashboard` the same way.
- **`MedicineCatalog` has no price field in the v1 blueprint's schema.** The POS cart's unit
  price is manually editable per line (not pulled from the catalog search result) because of
  this gap — don't "fix" it by trying to read a `.price` field that doesn't exist. If pricing
  gets added to the backend schema, wire it through `searchMedicines`'s response and prefill
  the cart row instead of defaulting to 0.
- **shadcn `Sidebar` text spans need `min-w-0` (or a `grid`/`min-w-0` wrapper), not just
  `truncate`.** Flex children default to `min-width: auto`, so text next to an icon inside a
  `SidebarMenuButton` won't actually shrink/clip when the sidebar collapses to icon width —
  it visibly overflows past the collapsed rail instead. This bit the custom brand-header button
  in `app-sidebar.tsx` (nav items were fine because their `<span>{label}</span>` is the sole
  text node; the header had icon+text siblings). If you add more custom sidebar buttons with an
  icon + text sibling, give the text span `min-w-0 truncate` (see `app-sidebar.tsx`'s header for
  the fixed pattern) — don't assume the button's own `overflow-hidden` handles it.
- **One backend, one schema now.** Unlike v1, there's no auth-api/api split to keep in sync —
  build directly in `apps/api`. Don't recreate the v1 dual-service pattern.
- **`prisma generate` requires ≥1 model.** The schema currently has only the `Placeholder`
  model for exactly this reason. When you add the first real model, delete `Placeholder` and
  re-run `npx prisma generate` (or `db push`/`migrate dev`).
- **`routeTree.gen.ts` lives in `apps/clinic-ui/src/`, not the app root** — this changed
  between the v1 and v2 TanStack Router plugin versions. Import it as `./routeTree.gen` from
  `src/main.tsx`, not `../routeTree.gen`.
- **Tailwind is v4, no PostCSS.** `apps/clinic-ui` has no `tailwind.config.js` or
  `postcss.config.js` — styling config lives entirely in `src/index.css` (`@import
  "tailwindcss"` + shadcn's `@theme`/`:root` blocks) and `vite.config.ts` (`@tailwindcss/vite`
  plugin). Don't reintroduce a `tailwind.config.js`/PostCSS setup; that was the v3 approach
  used before this session's migration. If you hit an npm workspace hoisting issue with any
  build-time-only package (this happened once with `postcss` under the old v3 setup), the fix
  is `npm dedupe` at the repo root.
- **Local `doctor_erp` Postgres database still has v1 data** (patients, doctors, permissions,
  etc. — 6 users, 10 patients, 54 permissions as of 2026-07-02) even though the v1 application
  code was deleted. Don't `prisma db push --accept-data-loss` or drop tables against it without
  checking first — ask before destroying it, in case it's wanted as a reference/import source.
- **PROJECT_BLUEPRINT.md is the target spec, not a changelog** — when rebuilding a v1 feature
  (e.g. patients, appointments, queue), consult it for the data model and API shape, but apply
  the "Recommendations for a v2 Build Prompt" section (single schema, real payments, tests,
  etc.) rather than copying v1 mechanically.
- **`nest-cli.json` pins `"builder": "tsc"` and `"deleteOutDir": false` — don't remove either.**
  Without an explicit builder, this Nest CLI version silently resolves to something other than
  `tsc` and `nest build`/`nest start` no-op (exit 0, no `dist/` written at all — no error). With
  `deleteOutDir: true`, `nest start --watch` races: it can delete `dist/` and launch `node
  dist/main.js` before the first watch-compile finishes emitting, crashing with `Cannot find
  module '.../dist/main'`. Pinning both fixed cold-start reliability but didn't eliminate the
  race 100% — if `npm run dev` in `apps/api` throws that error, just re-run it once.
- **Stale `*.tsbuildinfo` can make `tsc`/`nest build` silently skip emitting.** If you ever
  delete `apps/api/dist` by hand without also deleting `apps/api/tsconfig*.tsbuildinfo`, a
  subsequent build can report "0 errors" and exit 0 while writing nothing, because TS's
  incremental cache still thinks the (now-deleted) output is up to date. `*.tsbuildinfo` is
  gitignored; if this happens, delete it alongside `dist/` and rebuild.
- **shadcn's classic `Form` component is an empty stub in this CLI/registry version** (`npx
  shadcn add form` creates nothing). Use `field` instead (`npx shadcn add field`) — it's a
  framework-agnostic set of styled primitives (`Field`, `FieldLabel`, `FieldError`,
  `FieldGroup`, etc.) that you wire up yourself with `react-hook-form`'s `register()`/
  `formState.errors` and a `zodResolver` schema, as done in `login.tsx`/`index.tsx`. Don't go
  looking for `FormField`/`FormControl`/`useFormField` — they don't exist here.
- **Clear `apps/clinic-ui/node_modules/.vite` after adding a new frontend dependency that a
  route directly imports** (e.g. `react-hook-form`, `zod`). Vite's dependency pre-bundling
  cache can go stale relative to a fresh `npm install` and manifest as `Invalid hook call` /
  `Cannot read properties of null (reading 'useRef')` inside otherwise-correct code — it looks
  like a real bug but is a caching artifact. Restarting the dev server after wiping that folder
  fixes it.
