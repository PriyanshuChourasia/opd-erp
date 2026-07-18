# Auth — Login & Registration

## What is this page?

The authentication module provides two public-facing pages: a **Landing Page** (`/`) and a **Login Page** (`/login`). The Landing Page serves as the public marketing homepage with a registration form for new users. The Login Page is a split-screen form where existing users sign in with their email and password.

## What actions can be done?

- **Sign in** — Enter email and password to authenticate. On success, the user is redirected to their role-based home page (Receptionist → `/pos`, everyone else → `/dashboard`).
- **Register** (Landing Page only) — New users can fill out a registration form with first name, last name, email, phone, and password to create an account.
- **Fill demo credentials** — Quick-select from pre-filled demo accounts (Super Admin, Admin, Doctor, Receptionist, Assistant) to auto-fill the login form.
- **Forgot password** — Link to the password reset flow (not yet implemented).

## What features does it hold?

- **Role-based redirect** — After login, users are automatically routed to the appropriate page based on their role (`getHomeRoute()` in `lib/roles.ts`).
- **Demo account buttons** — One-click to pre-fill email/password for any demo role.
- **JWT authentication** — Tokens are stored in `localStorage` as `clinic_access_token` and `clinic_user`.
- **Auto-redirect if authenticated** — If a user visits `/login` or `/` while already logged in, they are redirected to their home page.
- **Branding & workflow overview** — The landing page showcases clinic features, workflow steps, and capabilities.
