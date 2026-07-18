# Patients — Patient Management

## What is this page?

The Patients page (`/patients`) is the patient registry and management hub. It allows clinic staff to view, create, edit, and delete patient records. Each patient record contains demographics, medical information, and contact details.

## What actions can be done?

- **Add new patient** — Click "New Patient" to open the registration form with fields for name, phone, email, date of birth, gender, blood group, address, emergency contact, and allergies.
- **Edit patient** — Click the edit button on any row to modify patient details.
- **Delete patient** — Click the delete button and confirm to remove a patient record.
- **Search** — Search patients by name, phone number, or email.
- **View details** — See patient name, gender, contact info, DOB, blood group (color-coded), and allergies (red badges) at a glance.

## What features does it hold?

- **Paginated DataTable** — Sortable table with patient name/gender, phone/email, DOB, blood group, and allergies.
- **Color-coded blood groups** — Blood group badges are color-coded for quick identification (A+, B+, O+, AB+, etc.).
- **Allergy badges** — Patient allergies are displayed as red badges for visibility.
- **Form validation** — Phone number uniqueness is enforced. Required fields are validated.
- **Search with debounce** — Typing in the search box triggers a debounced API search after 300ms.
- **Inline edit button** — Quick access to edit any patient record from the table.
