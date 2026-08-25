You are performing a full-stack RBAC consolidation on the Doctor ERP monorepo
(`apps/api` = NestJS + Prisma backend, `apps/clinic-ui` = TanStack Router frontend,
Postgres db `doctor_erp_v2`). Work through the phases in order. Each phase ends with a
VERIFY block — do not move to the next phase until it passes. If a verification fails,
STOP and report the actual vs. expected values instead of guessing a fix.

GOAL
Consolidate the "Super Admin" and "Developer" roles into a single role:

- The surviving role keeps Super Admin's identity (id, its 2 users: superadmin@clinic.com,
  admin@clinic.com) but is renamed "Developer".
- It gains the 5 permissions that were unique to the old Developer role (all on resource
  "developer": create/read/update/delete/manage) — 150 + 5 = 155 total.
- The standalone developer@clinic.com user account and the old Developer role row are
  deleted.
- Frontend and demo-seed code are updated so this isn't just a data patch that reverts
  itself or breaks navigation/styling.

Current known ids (re-verify in Phase 0 — do not trust these blindly if time has passed):
Super Admin role id: 149e7556-0a4e-4ff5-ac2a-3d86fadf9f8c
Developer role id:   207eb339-f565-4d38-9a20-8d785c2bc037
DATABASE_URL=postgresql://primesysindia@localhost:5432/doctor_erp_v2

================================================================================
PHASE 0 — Re-verify current state
==================================

psql "$DATABASE_URL" -c "
SELECT id, name, isSystem,
(SELECT count(*) FROM \"RolePermission\" rp WHERE rp.\"roleId\"=r.id) AS perm_count,
(SELECT count(*) FROM \"User\" u WHERE u.\"roleId\"=r.id) AS user_count
FROM \"Role\" r WHERE name IN ('Super Admin','Developer');"
VERIFY: exactly one 'Super Admin' row and one 'Developer' row exist. Capture their ids as
$SUPERADMIN_ID / $DEVELOPER_ID. If perm_count/user_count differ materially from
150/2 and 35/1, stop and re-derive the plan — someone already touched this.

================================================================================
PHASE 1 — Backup
=================

pg_dump "$DATABASE_URL" -t '"Role"' -t '"Permission"' -t '"RolePermission"' 
-t '"User"' -t '"RefreshToken"' -F c -f pre_rbac_merge_backup.dump
VERIFY: file exists and is non-empty.

================================================================================
PHASE 2 — Database: merge, delete, rename
==========================================

2a. Merge the 5 developer-only permissions into Super Admin:
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -c "
INSERT INTO \"RolePermission\" (\"roleId\",\"permissionId\")
SELECT '$SUPERADMIN_ID', rp.\"permissionId\"
FROM \"RolePermission\" rp
WHERE rp.\"roleId\" = '$DEVELOPER_ID'
AND rp.\"permissionId\" NOT IN (
SELECT \"permissionId\" FROM \"RolePermission\" WHERE \"roleId\" = '$SUPERADMIN_ID'
);"
VERIFY: `SELECT count(*) FROM "RolePermission" WHERE "roleId"='$SUPERADMIN_ID';` = 155.

2b. Delete the standalone developer user account:
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -c "
DELETE FROM \"User\" WHERE username = 'developer' AND \"roleId\" = '$DEVELOPER_ID';"
VERIFY: `SELECT count(*) FROM "User" WHERE username='developer';` = 0.
(RefreshToken rows for this user cascade-delete automatically; any createdById/updatedById
it left on other tables is SET NULL automatically — confirmed via the schema's FK rules,
no manual cleanup needed.)

2c. Delete the now-empty old Developer role (must precede 2d — role name is unique):
psql "$DATABASE_URL" -c "SELECT count(*) FROM \"User\" WHERE \"roleId\"='$DEVELOPER_ID';"
VERIFY (precondition): 0. If not, stop — another user is still on this role.
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -c "DELETE FROM \"Role\" WHERE id = '$DEVELOPER_ID';"
VERIFY: `SELECT count(*) FROM "Role" WHERE name='Developer';` = 0.

2d. Rename Super Admin -> Developer:
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -c "
UPDATE \"Role\" SET name = 'Developer' WHERE id = '$SUPERADMIN_ID';"
VERIFY: role $SUPERADMIN_ID now has name='Developer', 155 perms, 2 users.

================================================================================
PHASE 3 — Backend (apps/api)
=============================

No source change is required for the mutation itself: apps/api/src/roles/roles.service.ts
has no isSystem guard, so nothing in the API blocks what Phase 2 just did directly in SQL.
Only touch code here:

3a. apps/api/prisma/seed.ts (demo/seed data — this is the part that will silently UNDO
Phase 2 if anyone runs `db:seed` later, because roles are upserted by `name`):

- Merge `developerPerms` into `superAdminPerms` (single combined permission list).
- Delete the `upsertRoleWithPermissions('Developer', ...)` call and remove `developer`
  from the function's returned object.
- Change the remaining `upsertRoleWithPermissions('Super Admin', ...)` call's name
  argument to `'Developer'`.
- Remove the `developer@clinic.com` line from the seeded-credentials console.log block.
- Update the summary console.log that lists per-role seeded counts to drop Developer.
  VERIFY: `grep -n "Developer\|Super Admin" apps/api/prisma/seed.ts` shows exactly one role
  definition (named 'Developer') and no `developer@clinic.com` reference anywhere.

3b. Sanity-check no other backend code hardcodes the role name string (permission-based
guards should be unaffected, but confirm):
grep -rn "'Super Admin'\|\"Super Admin\"\|'Developer'\|\"Developer\"" apps/api/src
VERIFY: no matches outside of comments/docs. (As of this writing there are none — RBAC
guards in this codebase check permissions, not role name strings.)

================================================================================
PHASE 4 — Frontend (apps/clinic-ui)
====================================

4a. apps/clinic-ui/src/lib/roles.ts:

- `getHomeRoute()`: today `DEVELOPER_ROLES = new Set(["DEVELOPER"])` sends anyone whose
  uppercased role name is "DEVELOPER" to `/developer`. After Phase 2, superadmin@clinic.com
  and admin@clinic.com will match this and be redirected to the Developer overview page
  on login instead of `/dashboard`. Decide deliberately, don't let this happen by accident:
  Option A (recommended default): keep admin users landing on `/dashboard` as before.
  Change the role-name check to key off something that still uniquely identifies "the
  old Developer-only account" — but that account no longer exists, so in practice:
  remove "DEVELOPER" from `DEVELOPER_ROLES` (or delete the branch entirely) since
  after this merge there is no role whose *primary* purpose is the developer landing
  page anymore; the Developer nav section becomes a satellite of the main dashboard,
  reachable via the sidebar `Developer` group (already rendered — see 4c) rather than
  being someone's home route.
  Option B: keep the DEVELOPER_ROLES branch as-is, accept that admin users now land on
  `/developer` at login.
  Pick Option A unless the user says otherwise — confirm with the user before finalizing
  if this prompt is being run non-interactively and the choice materially changes login UX.
- `isSuperAdmin()`: re-run `grep -rn "isSuperAdmin" apps/clinic-ui/src` to confirm it still
  has zero call sites (it did at authoring time). If still unused, delete the function
  entirely rather than leaving permanently-dead/broken code (no role will ever again be
  named "Super Admin"). If a call site now exists, update it to check
  `roleName === 'Developer'` instead.
  VERIFY: `pnpm --filter clinic-ui exec tsc --noEmit` passes after edits.

4b. apps/clinic-ui/src/modules/roles-permissions/data/interface.ts:

- `roleColors` (around line 92) is keyed by role name string. Remove the `"Super Admin"`
  entry (dead — no role will have that name) and repoint `"Developer"` to the red styling
  that "Super Admin" used to have (`"bg-red-100 text-red-700 border-red-200"`), since the
  merged role is still the top-privilege role and should read as such in the Roles &
  Permissions UI, not the previous muted slate.
- Leave the `developer: "Developer"` entry in the resource-label map (~line 46) and the
  `"developer"` entries in `resourceCategories` / `defaultResources` untouched — those
  describe the *permission resource* "developer", unrelated to the role name, and are
  still valid since the 5 developer-resource permissions still exist.
  VERIFY: open the Roles & Permissions page after the DB changes and confirm exactly one
  role row is listed, named "Developer", with a red badge and 155 permissions.

4c. apps/clinic-ui/src/modules/auth/components/login-page.tsx:

- Remove the `{ role: "Developer", email: "developer@clinic.com", password: "Password@123" }`
  entry from `testAccounts` (~line 35) — that login will 401 after Phase 2.
- Leave the `{ role: "Super Admin", email: "superadmin@clinic.com", ... }` entry's label
  text as-is ("Super Admin" here is just UI copy describing the demo button, not a DB
  lookup — no need to rename it to match the new role name unless the user wants the
  demo panel to literally say "Developer").
  VERIFY: login page's demo-account list no longer offers a Developer quick-login, and the
  Super Admin quick-login still authenticates successfully post-migration.

4d. Full grep sweep for anything missed:
grep -rn "Super Admin\|'Developer'\|\"Developer\"" apps/clinic-ui/src --include="*.ts*" 
| grep -v node_modules
VERIFY: every remaining hit is accounted for by 4a/4b/4c or is unrelated (e.g. the
`_developer` route/module files, which are generic page components not tied to the role
name string and don't need changes).

================================================================================
PHASE 5 — End-to-end verification
==================================

* [ ] 5a. Backend: `pnpm --filter api exec tsc --noEmit` (or repo's typecheck script) passes.
  5b. Frontend: `pnpm --filter clinic-ui exec tsc --noEmit && pnpm --filter clinic-ui build`
  passes.
  5c. Manual/API smoke test:

- Log in as superadmin@clinic.com — confirm JWT/user payload reports roleName "Developer",
  confirm landing route matches the Phase 4a decision, confirm sidebar still shows every
  admin section AND the Developer group (module registry, schema explorer, features).
- Log in as admin@clinic.com — same checks.
- Confirm developer@clinic.com can no longer authenticate (expect 401/invalid credentials).
- On the Roles & Permissions page, confirm only one top-level system role remains, named
  Developer, 155 permissions, red badge, and that its delete button is still hidden
  (isSystem protection still applies since isSystem was preserved through the rename).
  5d. Re-run `npx prisma db seed` in a disposable/test context if possible (or at minimum
  re-read the edited seed.ts) to confirm it would NOT recreate a second "Super Admin" or
  "Developer" role — i.e. confirm Phase 3a actually closed the drift risk.

FINAL REPORT
Summarize: permission count before/after, which users were affected, backup file location,
which frontend files were edited and why, the Phase 4a decision made (and why), and the
result of every VERIFY step. Flag anything that failed instead of silently working around it.
