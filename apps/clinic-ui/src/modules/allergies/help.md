# Allergies — Master Catalog

## What is this page?

The Allergies page (`/_dashboard/allergies`) manages the allergy master catalog used across patient records. Each allergy is classified by category (DRUG, FOOD, ENVIRONMENTAL, OTHER) and severity (MILD, MODERATE, SEVERE, LIFE_THREATENING), so allergy alerts display consistently everywhere in the clinic.

## Actions & Effects

- **Add Allergy** — Opens the add sheet. Effect: entering a name and confirming calls `createAllergy`; invalidates `allergies`; toasts "Allergy created successfully".
- **Edit (pencil)** — Opens the sheet pre-filled from `fetchAllergy(id)`. Effect: saving calls `updateAllergy`; invalidates `allergies`; toasts "Allergy updated successfully".
- **Delete (X + confirm)** — Calls `deleteAllergy`. Effect: invalidates `allergies`; toasts "Allergy deleted successfully".
- **Search** — Types to filter the list live. Effect: refetches and resets to page 1.
- **Category / severity / status selects** — Set in the sheet; severity drives the alert coloring used elsewhere.

## Events

- **Data fetch** — Runs on mount, search change, and pagination change.
- **Cross-module effect** — Powers the AllergySelect in booking forms and the severity-aware allergy alerts on the doctor's consultation screen (SEVERE/LIFE_THREATENING render red).

## Features

- Paginated DataTable with color-coded category and severity badges.
- Add/Edit slide-over sheet with validation (name required).
- Severity colors: MILD (blue), MODERATE (yellow), SEVERE (orange), LIFE_THREATENING (red); categories: DRUG (purple), FOOD (amber), ENVIRONMENTAL (green), OTHER (gray).
