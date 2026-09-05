# Verify Book & Pay Card Flow

**Status:** Complete (Code Analysis)
**Date:** 2026-08-30

## Verification Results

| # | Check | Status | Evidence |
|---|-------|--------|----------|
| 1 | Payment modal opens | ✅ | `setPaymentSheetOpen(true)` → `<PaymentSheet open={paymentSheetOpen}>` |
| 2 | Tax not displayed | ✅ | No Tax input field in PaymentSheet |
| 3 | Cheque not available | ✅ | Not in `PAYMENT_METHODS` array |
| 4 | Other not available | ✅ | Not in `PAYMENT_METHODS` array |
| 5 | Card available | ✅ | `{ value: "CARD", label: "Card", icon: CreditCard }` |
| 6 | Invoice/Transaction Number appears for Card | ✅ | `{(method === "CARD" \|\| method === "UPI") && (...)}` |
| 7 | Entered reference is saved | ✅ | State → payload → API → DB `Bill.referenceNumber` |
| 8 | Payment status updates correctly | ✅ | `paidAmount >= total ? 'PAID' : 'PENDING'` |
| 9 | Appointment created correctly | ✅ | `POST /appointments` with patientId, doctorId, amount |
| 10 | Invoice generated when amount unpaid | ✅ | Bill always created, status reflects payment |

## Complete Flow Trace

```
User clicks "Book & Pay"
  → PaymentSheet opens
  → User selects "Card"
  → Reference Number input appears
  → User enters "TXN-12345"
  → User clicks "Confirm & Book"
    → bookAndPayMutation.mutate(payload)
      → payload: {
          paymentMethod: "CARD",
          referenceNumber: "TXN-12345",
          discount: 0,
          tax: 0,
          paidAmount: 600,
          notes: ""
        }
      → createAppointment() → POST /appointments
        → Appointment created (status: SCHEDULED)
      → checkoutAppointment(id, payload)
        → POST /appointments/:id/checkout
          → Bill created:
            - subtotal: 600
            - discount: 0
            - total: 600
            - paidAmount: 600
            - status: "PAID"
            - paymentMethod: "CARD"
            - referenceNumber: "TXN-12345"
    → onSuccess: toast "Appointment booked and paid successfully"
    → navigate back
```

## Payment Method Grid

```
┌──────┐ ┌──────┐ ┌──────┐
│ Cash │ │ CARD │ │ UPI  │
└──────┘ └──────┘ └──────┘
```

- ❌ Cheque — removed
- ❌ Other — removed
- ❌ Tax — removed

## Invoice/Transaction Number Field

Only visible when Card or UPI is selected:

```
Invoice / Transaction Number
[Enter card invoice or transaction number]
```

## Payment Status Logic

```typescript
const paidAmount = dto.paidAmount ?? total;  // defaults to full payment
const status = paidAmount >= total ? 'PAID' : 'PENDING';
```

| Scenario | paidAmount | total | Status |
|----------|-----------|-------|--------|
| Full payment (no discount) | 600 | 600 | PAID |
| Full payment (with discount) | 500 | 500 | PAID |
| Partial payment | 300 | 600 | PENDING |
