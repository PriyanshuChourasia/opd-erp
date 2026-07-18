# Users Module — Agent Help

## Overview
Manages system users — listing users with search and filtering. User creation is handled by the Auth module.

## Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/users` | JWT | List all users (with filters) |

## DTOs
- `FindUsersQueryDto` — search? (name/email), roleId?, isActive?, page?, limit?

## Architecture
- `UsersController` → `UsersService`
- Read-only listing endpoint — user creation/deletion is done via Auth or seed scripts.

## Important Notes
- Users can be polymorphically linked to entities (e.g., Doctor) via `userableType` / `userableId`.
- The endpoint is useful for populating user selection dropdowns in the UI.
- Only active users are returned by default.
- Passwords are never exposed in responses.
