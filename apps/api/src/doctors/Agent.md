# Doctors Module — Agent Help

## Overview
Manages doctor profiles — CRUD operations, verification status, and creating doctors with linked user accounts.

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/doctors` | Create a new doctor profile |
| POST | `/doctors/with-user` | Create doctor with a linked user account |
| GET | `/doctors` | List doctors (with filters) |
| GET | `/doctors/:id` | Get doctor details |
| PATCH | `/doctors/:id` | Update doctor information |
| PATCH | `/doctors/:id/verification` | Update verification status |
| DELETE | `/doctors/:id` | Remove a doctor profile |

## DTOs
- `CreateDoctorDto` — firstName, lastName, specialization, qualification, medicalRegistrationNo, consultationFee, yearsOfExperience?, consultationMode?, isActive?
- `CreateDoctorWithUserDto` — doctor data + user credentials (username, email, password)
- `UpdateDoctorDto` — Partial of create fields
- `UpdateVerificationStatusDto` — verificationStatus (PENDING, VERIFIED, REJECTED)
- `FindDoctorsQueryDto` — search?, specialization?, isActive?, verificationStatus?, page?, limit?

## Architecture
- `DoctorsController` → `DoctorsService`
- Service manages profiles with polymorphism: a doctor can be linked to a user via `userableType: 'Doctor'`.

## Important Notes
- `medicalRegistrationNo` is a unique identifier (e.g., MCI registration number).
- `createWithUser` creates both a doctor record AND a user account in one transaction.
- Doctors have schedules defined in the `EmployeeSchedules` module.
- Verification workflow: PENDING → VERIFIED or REJECTED.
