import { useState } from "react";
import { AlertTriangle, Banknote, Ban } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

function currency(value: number) {
  return `₹${value.toLocaleString("en-IN")}`;
}

interface RefundDecisionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Net amount collected that could be refunded */
  netPaid: number;
  /** Called when the user confirms a decision */
  onConfirm: (decision: {
    refundDecision: "REFUND" | "FORFEIT";
    refundAmount?: number;
    refundReason: string;
  }) => void;
  isPending: boolean;
}

export function RefundDecisionModal({
  open,
  onOpenChange,
  netPaid,
  onConfirm,
  isPending,
}: RefundDecisionModalProps) {
  const [decision, setDecision] = useState<"REFUND" | "FORFEIT" | null>(null);
  const [refundAmount, setRefundAmount] = useState(netPaid);
  const [reason, setReason] = useState("");

  if (!open) return null;

  function handleConfirm() {
    if (!decision || !reason.trim()) return;
    onConfirm({
      refundDecision: decision,
      ...(decision === "REFUND" ? { refundAmount } : {}),
      refundReason: reason.trim(),
    });
  }

  const canConfirm =
    decision !== null &&
    reason.trim().length > 0 &&
    (decision === "FORFEIT" || (refundAmount > 0 && refundAmount <= netPaid));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50"
        onClick={() => onOpenChange(false)}
      />
      {/* Modal */}
      <div className="relative z-50 w-full max-w-md rounded-none border bg-background p-6 shadow-lg">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
            <AlertTriangle className="size-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Money Collected</h2>
            <p className="text-sm text-muted-foreground">
              This appointment has {currency(netPaid)} collected. How should it be handled?
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Decision buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setDecision("REFUND")}
              className={cn(
                "flex flex-col items-center gap-2 rounded-none border px-4 py-4 text-sm font-medium transition-all",
                decision === "REFUND"
                  ? "border-green-500 bg-green-50 text-green-700 ring-1 ring-green-500 dark:bg-green-950 dark:text-green-300"
                  : "border-input text-muted-foreground hover:border-green-500/50 hover:text-foreground",
              )}
            >
              <Banknote className="size-5" />
              <span>Refund</span>
              <span className="text-xs font-normal">Return money to patient</span>
            </button>
            <button
              type="button"
              onClick={() => setDecision("FORFEIT")}
              className={cn(
                "flex flex-col items-center gap-2 rounded-none border px-4 py-4 text-sm font-medium transition-all",
                decision === "FORFEIT"
                  ? "border-amber-500 bg-amber-50 text-amber-700 ring-1 ring-amber-500 dark:bg-amber-950 dark:text-amber-300"
                  : "border-input text-muted-foreground hover:border-amber-500/50 hover:text-foreground",
              )}
            >
              <Ban className="size-5" />
              <span>Forfeit</span>
              <span className="text-xs font-normal">Keep as clinic revenue</span>
            </button>
          </div>

          {/* Refund amount (only for REFUND) */}
          {decision === "REFUND" && (
            <Field>
              <FieldLabel htmlFor="refund-amount">Refund Amount (₹)</FieldLabel>
              <Input
                id="refund-amount"
                type="number"
                min={1}
                max={netPaid}
                value={refundAmount}
                onChange={(e) =>
                  setRefundAmount(
                    Math.min(netPaid, Math.max(1, Number(e.target.value) || 0)),
                  )
                }
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Maximum: {currency(netPaid)}
              </p>
            </Field>
          )}

          {/* Reason */}
          <Field>
            <FieldLabel htmlFor="refund-reason">Reason *</FieldLabel>
            <textarea
              id="refund-reason"
              rows={2}
              className="flex w-full rounded-none border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder={
                decision === "REFUND"
                  ? "e.g. Patient cancelled in advance"
                  : "e.g. No-show, clinic policy"
              }
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </Field>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={!canConfirm || isPending}>
            {isPending ? "Processing..." : "Confirm"}
          </Button>
        </div>
      </div>
    </div>
  );
}
