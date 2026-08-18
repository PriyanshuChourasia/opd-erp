# Profile — My Account

## What is this page?

The Profile page (`/profile`) lets the logged-in user view and update their own account details (first/last name, email) and change their password.

## Actions & Effects

- **Edit Profile** — Enters edit mode for name/email fields. Effect: saving calls the profile update API; shows a success message on completion.
- **Change Password** — Opens the password form (current password, new password, confirm). Effect: validates that the new password matches the confirmation; calls the password-change API; shows a success or error message.
- **Cancel** — Discards unsaved edits and returns to the read-only view.

## Events

- **Profile load** — The form initializes from the logged-in user's stored details.
- **Validation** — New password must match confirm; API errors surface as inline error messages.

## Features

- Read-only profile summary with an Edit toggle.
- Separate change-password form with confirmation.
- Success/error toast or inline message feedback on every save.
