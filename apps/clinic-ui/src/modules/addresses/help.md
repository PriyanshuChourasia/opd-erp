# Addresses — Address Book Component

## What is this module?

The Addresses module is not a standalone page — it provides the **AddressManager** component embedded in records that have addresses (patients, doctors, organisation). It manages multiple addresses per entity with a primary address concept.

## Actions & Effects

- **Add address** — Opens the address form. Effect: calls `createAddress` for the entity; invalidates the address list; toasts success.
- **Edit address (pencil)** — Opens the form pre-filled. Effect: calls `updateAddress`; invalidates the list; toasts success.
- **Set as primary (star)** — Calls `setPrimaryAddress`. Effect: that address becomes the entity's primary address; invalidates the list; toasts success.
- **Delete address (trash + confirm)** — Calls `deleteAddress`. Effect: removes the address; invalidates the list; toasts success.

## Events

- **Data fetch** — Addresses for an entity load on mount (`fetchAddressesByEntity`).
- **Cross-module usage** — Embedded in the Organisation page (clinic addresses), doctor sheets, and patient records.

## Features

- Multiple addresses per entity with type labels.
- Primary-address highlighting.
- Add/Edit/Delete/Set-primary actions with confirmation.
