import { AlertTriangle, CheckCircle2, Clock, RotateCcw } from "lucide-react";
import type { BillStatusBreakdown } from "../data/interface";

const STATUS_META: Record<string, { label: string; icon: typeof CheckCircle2; color: string }> = {
  PAID: { label: "Paid", icon: CheckCircle2, color: "var(--viz-status-good)" },
  PENDING: { label: "Pending", icon: Clock, color: "var(--viz-status-warning)" },
  PARTIAL: { label: "Partially paid", icon: AlertTriangle, color: "var(--viz-status-serious)" },
  REFUNDED: { label: "Refunded", icon: RotateCcw, color: "var(--viz-status-critical)" },
};

function formatCurrency(value: number) {
  return `₹${value.toLocaleString()}`;
}

export function BillStatusPanel({ rows }: { rows: BillStatusBreakdown[] }) {
  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground">No billing data yet</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      {rows.map((row) => {
        const meta = STATUS_META[row.status] ?? { label: row.status, icon: Clock, color: "var(--muted-foreground)" };
        const Icon = meta.icon;
        return (
          <div key={row.status} className="flex items-center gap-3">
            <Icon className="size-4 shrink-0" style={{ color: meta.color }} />
            <div className="flex flex-1 items-baseline justify-between gap-2">
              <span className="text-sm text-foreground/80">
                {meta.label} <span className="text-muted-foreground">({row.count})</span>
              </span>
              <span className="text-sm font-semibold tabular-nums">{formatCurrency(row.amount)}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
