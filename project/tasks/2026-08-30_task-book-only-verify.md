# Verify Book-only New Appointment Flow

**Status:** Complete (Code Analysis)
**Date:** 2026-08-30

## Flow Trace

```
User clicks "Book"
  → createMutation.mutate()
    → updatePatient (if allergies changed)
    → POST /appointments
      → body: { patientId, doctorId, date, type, amount, registrationFee?, notes? }
    → onSuccess: toast "Appointment booked successfully" → navigate back
```

**No `checkoutAppointment()` call.** No Bill created.

## Verification Results

### 1. Appointment is created ✅

```typescript
// Frontend (new-appointment-page.tsx:317-325)
return createAppointment({
  patientId: form.patient!.id,
  doctorId: form.doctorId,
  date: `${form.date}T${form.slot}:00`,
  type: form.type as AppointmentType,
  amount: form.amount,
  ...(form.registrationFee !== null ? { registrationFee: form.registrationFee } : {}),
  notes: form.notes || undefined,
});
```

Backend creates Appointment record with status `SCHEDULED` ✅

### 2. Payment is not initiated ✅

- `createMutation` does NOT call `checkoutAppointment()`
- No `POST /appointments/:id/checkout` request
- No Bill or BillItem records created

### 3. Payment status is Pending ✅

- No Bill exists → `appt.bill` is `null`
- Appointments list shows "Unpaid" badge (amber)
- Payment status effectively "Pending"

### 4. No unnecessary invoice generated ✅

- `checkout()` in `appointments.service.ts` is never called
- No `Bill` or `BillItem` records created
- No `invoiceNo` generated

### 5. Appointment amount is stored correctly ✅

```typescript
// Backend (appointments.service.ts:82)
amount: dto.amount ?? 0,
registrationFee,  // auto-assigned for first-time patients
```

- `form.amount` → `dto.amount` → `Appointment.amount`
- `form.registrationFee` → `dto.registrationFee` → `Appointment.registrationFee`

### 6. Patient and doctor information remain correct ✅

```typescript
// Backend (appointments.service.ts:78-79)
patientId: dto.patientId,
doctorId: dto.doctorId,
```

- FK relationships to Patient and Doctor are preserved
- `include: { patient: true, doctor: true }` in response
