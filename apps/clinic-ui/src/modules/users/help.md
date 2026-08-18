# Users — Staff Accounts

## What is this page?

The Users page (`/organisation/users`) manages staff login accounts — name, email, username, role assignment, and active/dropped status.

## Actions & Effects

- **Add User** — Opens the add sheet. Effect: calls `createUser` (with role selection); invalidates `users`; toasts "User created successfully".
- **Edit (pencil)** — Opens the sheet pre-filled from `fetchUser`. Effect: saving calls `updateUser` (name, email, role); invalidates `users`; toasts "User updated successfully".
- **Deactivate (X + confirm)** — Calls `deleteUser` (soft delete). Effect: the account can no longer log in; toasts "User deactivated — can be restored anytime".
- **Restore (Dropped view)** — Calls `restoreUser`. Effect: reactivates the account; toasts "User restored successfully".
- **Show Dropped toggle** — Switches the list between active and deactivated users. Effect: refetches with `isActive` filter.
- **Search** — Filters by name, email, or username. Effect: refetches and resets pagination.

## Events

- **Data fetch** — Runs on mount, search change, filter change, and pagination change.
- **Role assignment** — Editing loads the user's roles (`fetchUserRoles`) for pre-filling.

## Features

- Paginated DataTable: user (name, email, username), role badges, status, last active, and actions.
- Drop/restore lifecycle with a separate dropped view.
- Create/edit sheet with role assignment.
