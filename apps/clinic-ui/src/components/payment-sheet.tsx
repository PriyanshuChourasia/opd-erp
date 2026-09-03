import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Banknote, CreditCard, Smartphone } from "lucide-react";
import { cn } from "@/lib/utils";
import { fetchDiscountRules, type DiscountRule } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { PaymentHistory } from "@/components/payment-history";

function currency(value: number) {
  const n = typeof value === 'number' ? value : Number(value) || 0;
  return `₹${(Number.isFinite(n) ? n : 0).toFixed(2)}`;
}

function discountRuleLabel(rule: DiscountRule) {
  return `${rule.name} (${rule.type === "PERCENTAGE" ? `${rule.value}%` : currency(rule.value)})`;
}

const PAYMENT_METHODS = [
  { value: "CASH", label: "Cash", icon: Banknote },
  { value: "CARD", label: "Card", icon: CreditCard },
  { value: "UPI", label: "UPI", icon: Smartphone },
] as const;

export interface PaymentPayload {
  paymentMethod: string;
  referenceNumber?: string;
  discountRuleId?: string;
  tax: number;
  paidAmount?: number;
  notes?: string;
}

interface PaymentSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Total amount before discount adjustments — the TRUE bill total, not the remaining balance. */
  subtotal: number;
  /** Amount already collected against this bill in prior installments (0 for a fresh checkout). */
  alreadyPaid?: number;
  isPending: boolean;
  onSubmit: (payload: PaymentPayload) => void;
  submitLabel: string;
  appointmentId?: string;
  billId?: string;
  /** A bill already exists (this is an installment) — its total (and any discount) was locked in at first checkout, so no new discount applies here. */
  hasExistingBill?: boolean;
}

export function PaymentSheet({
  open,
  onOpenChange,
  subtotal,
  alreadyPaid = 0,
  isPending,
  onSubmit,
  submitLabel,
  appointmentId,
  billId,
  hasExistingBill,
}: PaymentSheetProps) {
  const [method, setMethod] = useState("CASH");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [paidAmountInput, setPaidAmountInput] = useState<number | null>(null);
  const [discountRuleId, setDiscountRuleId] = useState<string | null>(null);

  const { data: discountRulesResponse } = useQuery({
    queryKey: ["discount-rules", "active"],
    queryFn: () => fetchDiscountRules({ activeOnly: true, limit: 100 }),
    enabled: open && !hasExistingBill,
  });
  const discountRules = useMemo(() => discountRulesResponse?.data ?? [], [discountRulesResponse]);
  const selectedRule = discountRules.find((r) => r.id === discountRuleId) ?? null;
  const discountAmount = selectedRule
    ? selectedRule.type === "PERCENTAGE"
      ? Math.round((subtotal * selectedRule.value) / 100)
      : Math.min(selectedRule.value, subtotal)
    : 0;

  const netTotal = Math.max(0, subtotal - discountAmount);
  const amountDue = Math.max(0, netTotal - alreadyPaid);
  const paidAmount = paidAmountInput ?? amountDue;

  // Reset paid amount to the full remaining balance when it changes (re-sync unless user touched it)
  useEffect(() => { setPaidAmountInput(null); }, [amountDue]);

  function handleSubmit() {
    onSubmit({
      paymentMethod: method,
      ...(referenceNumber.trim() ? { referenceNumber: referenceNumber.trim() } : {}),
      ...(discountRuleId ? { discountRuleId } : {}),
      tax: 0,
      paidAmount,
    });
  }

  return (
    <Sheet open={open} onOpenChange={(open) => { if (!open) onOpenChange(false); }}>
      <SheetContent side="right" className="sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle>Payment</SheetTitle>
          <SheetDescription>Select payment method and confirm the transaction.</SheetDescription>
        </SheetHeader>

        {(appointmentId || billId) && (
          <div className="px-4">
            <PaymentHistory appointmentId={appointmentId} billId={billId} />
          </div>
        )}

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
          {!hasExistingBill && (
            <Field>
              <FieldLabel htmlFor="pm-discount">Discount (optional)</FieldLabel>
              <Select value={discountRuleId ?? "none"} onValueChange={(v) => setDiscountRuleId(v === "none" ? null : v)}>
                <SelectTrigger id="pm-discount"><SelectValue placeholder="No discount" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No discount</SelectItem>
                  {discountRules.map((rule) => (
                    <SelectItem key={rule.id} value={rule.id}>{discountRuleLabel(rule)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          )}

          {/* ── Totals breakdown ── */}
          <div className="space-y-2 rounded-none border bg-muted/20 px-4 py-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{currency(subtotal)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-green-600">Discount{selectedRule ? ` (${selectedRule.name})` : ""}</span>
                <span className="text-green-600">−{currency(discountAmount)}</span>
              </div>
            )}
            <div className="border-t pt-1.5">
              <div className="flex items-center justify-between font-semibold">
                <span>Net Total</span>
                <span className="text-lg text-primary">{currency(netTotal)}</span>
              </div>
            </div>
            {alreadyPaid > 0 && (
              <div className="flex items-center justify-between text-green-600">
                <span>Already Paid</span>
                <span>−{currency(alreadyPaid)}</span>
              </div>
            )}
            <div className="border-t pt-1.5">
              <div className="flex items-center justify-between font-semibold">
                <span>Amount Due</span>
                <span className="text-lg text-primary">{currency(amountDue)}</span>
              </div>
            </div>
            <div className="flex items-center justify-between gap-3">
              <label htmlFor="pm-paid-amount" className="text-muted-foreground">Amount to collect now</label>
              <Input id="pm-paid-amount" type="number" min={0} max={amountDue} className="w-28 text-right h-8 text-xs"
                value={paidAmount}
                onChange={(e) => setPaidAmountInput(Math.max(0, Math.min(amountDue, Number(e.target.value) || 0)))}
              />
            </div>
            <div className="flex items-center justify-between font-semibold">
              <span>Amount Paid</span>
              <span className="text-lg text-green-600">{currency(paidAmount)}</span>
            </div>
            {paidAmount < amountDue && (
              <div className="flex items-center justify-between text-sm font-medium text-amber-600">
                <span>Balance Due</span>
                <span>{currency(amountDue - paidAmount)}</span>
              </div>
            )}
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
