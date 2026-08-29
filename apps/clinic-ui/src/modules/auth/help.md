# Auth — Login & Registration

## What is this module?

The Auth module covers the entry screens: the marketing landing page (`/`) with a "set up your clinic" registration form, the login page (`/login`), and a standalone registration page. Successful authentication stores credentials and routes the user to their role's home screen.

## Actions & Effects

- **Sign in (login page)** — Submit email/username + password. Effect: validates with zod; on success calls the login API, stores credentials (Redux), and routes to the role-based home (`getHomeRoute(roleName)`); on failure shows the API error message.
- **Demo account chips** — Clicking a role chip (Super Admin/Admin/Doctor/Receptionist/Assistant) fills the credentials. Effect: pre-fills email + password for quick testing; Super Admin is selected by default.
- **Register (landing page hero form)** — Username, first/last name, email, password, confirm password. Effect: validates (password ≥ 8 chars, matching confirmation); calls `/auth/register`; on success stores credentials and routes to the role home; on failure shows the error inline.
- **Register (register page)** — Same registration flow on its own route.
- **Nav links** — Sign in / Get started / section anchors. Effect: route navigation or smooth scroll to sections.

## Events

- **Form validation** — zod schemas validate fields before submit; field errors render under inputs.
- **Auth state** — Login/register success dispatches `setCredentials`, which drives the app shell's redirect logic (receptionist → `/receptionist`, doctor → `/doctor`, etc.).

## Features

- Split-screen login with workflow steps and brand panel.
- Pre-filled demo accounts for each role.
- Landing page with features, workflow, about, and capabilities sections.
- Responsive layout with mobile logo.
