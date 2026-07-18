# Profile — User Profile Management

## What is this page?

The Profile page (`/profile`) allows logged-in users to view and manage their personal account information. It displays the user's profile card with their role, permissions, and account details, and provides forms to update personal info and change passwords.

## What actions can be done?

- **Edit personal information** — Update first name, last name, and email address.
- **Change password** — Enter current password, new password, and confirmation to update the account password.
- **View account info** — See role name, number of permissions assigned, and account creation date.

## What features does it hold?

- **Profile header card** — Displays user avatar (initials-based), full name, email, and role badge.
- **Personal info form** — Editable fields for first name, last name, and email with validation.
- **Password change form** — Secure password change with current password verification and confirmation.
- **Account info panel** — Shows role, permission count, and member-since date.
- **Form validation** — Zod schema validation on all form fields.
- **Success feedback** — Toast notifications on successful updates.
