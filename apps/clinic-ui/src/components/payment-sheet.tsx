import { useState } from "react";
import { Banknote, CreditCard, Smartphone } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";

function currency(value: number) {
  return `₹${value.toFixed(2)}`;
}

const PAYMENT_METHODS = [
  { value: "CASH", label: "Cash", icon: Banknote },
  { value: "CARD", label: "Card", icon: CreditCard },
  { value: "UPI", label: "UPI", icon: Smartphone },
] as const;

export interface PaymentPayload {
  paymentMethod: string;
  referenceNumber?: string;
  discount: number;
  tax: number;
  paidAmount?: number;
  notes: string;
}

interface PaymentSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Total amount before discount/tax adjustments */
  subtotal: number;
  isPending: boolean;
  onSubmit: (payload: PaymentPayload) => void;
  submitLabel: string;
}

export function PaymentSheet({
  open,
  onOpenChange,
  subtotal,
  isPending,
  onSubmit,
  submitLabel,
}: PaymentSheetProps) {
  const [method, setMethod] = useState("CASH");
  const [discount, setDiscount] = useState(0);
  const [referenceNumber, setReferenceNumber] = useState("");
  const [notes, setNotes] = useState("");

  function handleSubmit() {
    onSubmit({
      paymentMethod: method,
      ...(referenceNumber.trim() ? { referenceNumber: referenceNumber.trim() } : {}),
      discount,
      tax: 0,
      paidAmount,
      notes,
    });
  }

  const netTotal = subtotal - discount;
  const paidAmount = netTotal;

  return (
    <Sheet open={open} onOpenChange={(open) => { if (!open) onOpenChange(false); }}>
      <SheetContent side="right" className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Payment</SheetTitle>
          <SheetDescription>Select payment method and confirm the transaction.</SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-6 px-4 pb-6 pt-4">
          {/* ── Payment method grid ── */}
          <Field>
            <FieldLabel>Payment Method *</FieldLabel>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {PAYMENT_METHODS.map((pm) => {
                const Icon = pm.icon;
                const isActive = method === pm.value;
                return (
                  <button
                    key={pm.value}
                    type="button"
                    onClick={() => setMethod(pm.value)}
                    className={cn(
                      "flex flex-col items-center gap-1.5 rounded-none border px-3 py-3 text-xs font-medium transition-all",
                      isActive
                        ? "border-primary bg-primary/10 text-primary ring-1 ring-primary"
                        : "border-input text-muted-foreground hover:border-primary/50 hover:text-foreground"
                    )}
                  >
                    <Icon className="size-5" />
                    {pm.label}
                  </button>
                );
              })}
            </div>
          </Field>

          {/* ── Card Reference Number ── */}
          {(method === "CARD" || method === "UPI") && (
            <Field>
              <FieldLabel htmlFor="pm-ref">Invoice / Transaction Number</FieldLabel>
              <Input
                id="pm-ref"
                type="text"
                placeholder="Enter card invoice or transaction number"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
              />
            </Field>
          )}

          {/* ── Discount ── */}
          <Field>
            <FieldLabel htmlFor="pm-discount">Discount (₹)</FieldLabel>
            <Input
              id="pm-discount"
              type="number"
              min={0}
              max={subtotal}
              value={discount}
              onChange={(e) => setDiscount(Math.max(0, Number(e.target.value) || 0))}
            />
          </Field>

          {/* ── Notes ── */}
          <Field>
            <FieldLabel htmlFor="pm-notes">Notes (optional)</FieldLabel>
            <textarea
              id="pm-notes"
              rows={3}
              className="flex w-full rounded-none border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Payment notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </Field>

          {/* ── Totals breakdown ── */}
          <div className="space-y-2 rounded-none border bg-muted/20 px-4 py-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{currency(subtotal)}</span>
            </div>
            {discount > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-green-600">Discount</span>
                <span className="text-green-600">−{currency(discount)}</span>
              </div>
            )}
            <div className="border-t pt-1.5">
              <div className="flex items-center justify-between font-semibold">
                <span>Net Total</span>
                <span className="text-lg text-primary">{currency(netTotal)}</span>
              </div>
            </div>
          </div>
        </div>

        <SheetFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isPending || !method}>
            {isPending ? "Processing..." : submitLabel}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
