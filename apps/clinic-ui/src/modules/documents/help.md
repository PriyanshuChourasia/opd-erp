# Documents — File Attachments & Photos

## What is this module?

The Documents module is not a standalone page — it provides reusable components embedded across the app wherever files are attached to a record (patients, doctors, prescriptions).

- **DocumentManager** — Compact photo/profile uploader used in record forms (e.g. patient registration). Click the avatar to pick an image, upload it, and remove it if needed.
- **DocumentGallery** — Inline gallery showing all documents for an entity (profile photo + other files) with hover actions and a full-screen lightbox viewer.

## Actions & Effects

- **Upload a photo** — Click the uploader circle and pick a JPEG/PNG/WebP/GIF (max 10 MB). Effect: uploads immediately via `uploadDocument` (marked primary for PROFILE_PHOTO); invalidates the entity's documents; toasts "{label} uploaded successfully".
- **Remove a photo** — Hover the uploader to reveal the delete button. Effect: calls `deleteDocument`; invalidates documents; toasts "{label} removed".
- **View a document** — Click a thumbnail. Effect: opens the full-size lightbox (images, PDF iframe, or a download panel for other types).
- **Download** — Download button on hover or in the lightbox. Effect: downloads the file via `downloadDocument`.
- **Set as primary** — Star button on non-primary documents. Effect: calls `setPrimaryDocument`; invalidates documents; toasts "Primary updated".
- **Delete a document** — Trash icon on hover. Effect: calls `deleteDocument`; toasts "Document removed".

## Events

- **Size guard** — Files above 10 MB are rejected with a toast before upload.
- **Data fetch** — Documents for an entity load on mount (`fetchDocumentsByEntity`) and after every mutation.
- **Cross-module usage** — Used in patient forms, doctor sheets, billing, and the prescription sheet's "Documents" panel.

## Features

- Uploader with preview and file-size display.
- Gallery grid with file-type icons (image / PDF / generic).
- Lightbox viewer with download and close actions.
- Primary-document concept (PROFILE_PHOTO etc.).
