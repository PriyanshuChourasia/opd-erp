import { useQuery } from "@tanstack/react-query";
import { ArrowDownLeft, ArrowUpRight, BadgeIndianRupee, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { fetchAppointmentPayments, fetchBillPayments, type Payment } from "@/lib/api";

function currency(value: number) {
  return `₹${value.toLocaleString("en-IN")}`;
}

function methodLabel(method: string) {
  switch (method) {
    case "CASH": return "Cash";
    case "CARD": return "Card";
    case "UPI": return "UPI";
    default: return method;
  }
}

interface PaymentHistoryProps {
  /** Pass appointmentId to fetch appointment-level payments */
  appointmentId?: string;
  /** Pass billId to fetch bill-level payments */
  billId?: string;
  /** Callback when 'View Receipt' is clicked — receives the payment row */
  onViewReceipt?: (paymentId: string) => void;
}

export function PaymentHistory({ appointmentId, billId, onViewReceipt }: PaymentHistoryProps) {
  const { data: payments, isLoading } = useQuery({
    queryKey: billId ? ["bill-payments", billId] : ["appointment-payments", appointmentId],
    queryFn: () => billId ? fetchBillPayments(billId) : fetchAppointmentPayments(appointmentId!),
    enabled: !!(appointmentId || billId),
  });

  if (isLoading) {
    return (
      <div className="rounded-none border p-4 text-sm text-muted-foreground">
        Loading payment history...
      </div>
    );
  }

  if (!payments || payments.length === 0) {
    return (
      <div className="rounded-none border border-dashed p-6 text-center text-sm text-muted-foreground">
        <BadgeIndianRupee className="mx-auto mb-2 size-8 opacity-40" />
        No payments recorded yet.
      </div>
    );
  }

  // Compute running balance (payments add, refunds subtract)
  let runningBalance = 0;
  const rows = payments.map((p) => {
    if (p.direction === "PAYMENT") {
      runningBalance += p.amount;
    } else {
      runningBalance -= p.amount;
    }
    return { ...p, balance: runningBalance };
  });

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium text-muted-foreground">Payment History</h4>
      <div className="overflow-hidden rounded-none border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50 text-left text-xs font-medium text-muted-foreground">
              <th className="px-3 py-2">Date</th>
              <th className="px-3 py-2">Type</th>
              <th className="px-3 py-2 text-right">Amount</th>
              <th className="px-3 py-2">Method</th>
              <th className="px-3 py-2">Reference</th>
              <th className="px-3 py-2">Collected By</th>
              <th className="px-3 py-2 text-right">Balance</th>
              {onViewReceipt && <th className="px-3 py-2"></th>}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b last:border-0">
                <td className="px-3 py-2 text-muted-foreground">
                  {new Date(row.createdAt).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                  <br />
                  <span className="text-xs">
                    {new Date(row.createdAt).toLocaleTimeString("en-IN", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </td>
                <td className="px-3 py-2">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-none px-1.5 py-0.5 text-xs font-medium",
                      row.direction === "PAYMENT"
                        ? "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300"
                        : "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300",
                    )}
                  >
                    {row.direction === "PAYMENT" ? (
                      <ArrowDownLeft className="size-3" />
                    ) : (
                      <ArrowUpRight className="size-3" />
                    )}
                    {row.direction === "PAYMENT" ? "Payment" : "Refund"}
                  </span>
                </td>
                <td
                  className={cn(
                    "px-3 py-2 text-right font-medium",
                    row.direction === "PAYMENT" ? "text-green-600" : "text-red-600",
                  )}
                >
                  {row.direction === "PAYMENT" ? "+" : "−"}
                  {currency(row.amount)}
                </td>
                <td className="px-3 py-2">{methodLabel(row.method)}</td>
                <td className="px-3 py-2 text-muted-foreground">
                  {row.referenceNumber || "—"}
                </td>
                <td className="px-3 py-2 text-muted-foreground">
                  {row.collectedBy
                    ? `${row.collectedBy.firstName} ${row.collectedBy.lastName}`
                    : "—"}
                </td>
                <td className="px-3 py-2 text-right font-medium">
                  {currency(row.balance)}
                </td>
                {onViewReceipt && row.direction === "PAYMENT" && (
                  <td className="px-3 py-2">
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                      onClick={() => onViewReceipt(row.id)}
                    >
                      <FileText className="size-3" />
                      Receipt
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rows.length > 0 && (
        <div className="flex items-center justify-between rounded-none border bg-muted/30 px-3 py-2 text-sm font-medium">
          <span>Net Paid</span>
          <span className="text-primary">{currency(rows.at(-1)!.balance)}</span>
        </div>
      )}
    </div>
  );
}
