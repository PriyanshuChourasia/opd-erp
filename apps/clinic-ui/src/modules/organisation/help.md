# Organisation — Clinic Settings

## What is this page?

The Organisation page (`/organisation`) manages the clinic's profile (name, address, contact, registration number), the one-time patient registration fee, discount rules, and quick links to users, roles, and permissions. It also embeds the clinic's addresses.

## Actions & Effects

- **Edit Profile / Set Up Organisation** — Opens the settings sheet. Effect: on save calls `updateOrganisation`; invalidates `organisation`; toasts "Organisation updated successfully".
- **Registration fee** — Sets the one-time fee charged per patient on their first appointment. Effect: the default registration fee shown in booking forms updates everywhere (appointments, receptionist).
- **Discount settings** — Toggle discounts on/off, set max discount %, and default type (% or flat). Effect: caps the discount inputs in POS checkout and controls whether discount is shown.
- **Manage addresses** — Embedded AddressManager. Effect: add/edit/delete/set-primary addresses for the organisation.
- **Quick actions** — Navigate to Users, Roles & Permissions, or the organisation profile. Effect: route navigation only.
- **Stat cards** — Total users and active roles counts. Effect: informational.

## Events

- **Data fetch** — Organisation, user count, and role count queries run on mount.
- **Cross-module effect** — Organisation settings (name/address/phone, registration fee, discount rules) are consumed by billing (invoice header), appointments (registration fee default), and POS (discount caps).

## Features

- Organisation details card with all key fields.
- Users and Roles stat cards.
- Settings sheet with registration fee and discount configuration.
- Embedded address management.
