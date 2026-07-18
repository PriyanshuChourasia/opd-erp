# Queue Module — Agent Help

## Overview
Manages patient queue entries — tracking patient flow through the OPD from check-in to completion.

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/queue` | Add a patient to the queue |
| GET | `/queue` | List queue entries (with filters) |
| GET | `/queue/:id` | Get queue entry details |
| PATCH | `/queue/:id/status` | Update queue status |
| DELETE | `/queue/:id` | Remove a queue entry |

## DTOs
- `CreateQueueEntryDto` — appointmentId?, patientId, doctorId?, priority?, notes?
- `UpdateQueueStatusDto` — status (WAITING, WITH_DOCTOR, IN_TREATMENT, COMPLETED, SKIPPED, CANCELLED)
- `FindQueueQueryDto` — doctorId?, status?, date?, page?, limit?

## Architecture
- `QueueController` → `QueueService`
- Queue entries track real-time patient flow through the clinic.

## Important Notes
- Queue workflow: WAITING → WITH_DOCTOR → IN_TREATMENT → COMPLETED.
- SKIPPED and CANCELLED are terminal statuses.
- Priority can be used to handle emergency cases.
- Typically used alongside appointments for walk-in patient management.
- Supports querying by doctor to see current queue per physician.
