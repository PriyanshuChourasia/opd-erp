import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/**
 * Tone buckets. Colours come from the semantic tokens in `index.css`
 * (`--success-soft` / `--warning-soft` / `--info-soft` plus the existing
 * `--destructive` and `--muted`) so every status chip across the app is
 * derived from one palette rather than hand-picked `bg-green-*` classes.
 */
type Tone = "success" | "warning" | "info" | "danger" | "neutral";

const TONE_CHIP: Record<Tone, string> = {
  success: "bg-success-soft text-success-foreground",
  warning: "bg-warning-soft text-warning-foreground",
  info: "bg-info-soft text-info-foreground",
  danger: "bg-destructive/10 text-destructive",
  neutral: "bg-muted text-muted-foreground",
};

const TONE_DOT: Record<Tone, string> = {
  success: "bg-success",
  warning: "bg-warning",
  info: "bg-info",
  danger: "bg-destructive",
  neutral: "bg-muted-foreground/50",
};

interface StatusDef {
  label: string;
  tone: Tone;
}

/**
 * Statuses are plain strings in the Prisma schema (no enums), and the same
 * literal means slightly different things per module, so the keys below are
 * the union of every value the API, seed and frontend currently use.
 *
 * Note on "In-Queue": the live token queue is populated on the CONFIRMED
 * transition (see AppointmentsService.update), so CONFIRMED — not CHECKED_IN
 * — is the status that actually means "waiting in the live queue".
 */
const STATUS: Record<string, StatusDef> = {
  // Appointments
  SCHEDULED: { label: "Scheduled", tone: "info" },
  CONFIRMED: { label: "In-Queue", tone: "info" },
  CHECKED_IN: { label: "Checked in", tone: "info" },
  IN_PROGRESS: { label: "In progress", tone: "info" },
  IN_CONSULTATION: { label: "In consultation", tone: "info" },
  COMPLETED: { label: "Completed", tone: "success" },
  RESCHEDULED: { label: "Rescheduled", tone: "warning" },
  CANCELLED: { label: "Cancelled", tone: "danger" },
  NO_SHOW: { label: "No show", tone: "danger" },

  // Queue entries
  WAITING: { label: "Waiting", tone: "warning" },
  SEND_IN: { label: "Send in", tone: "info" },
  SKIPPED: { label: "Skipped", tone: "neutral" },

  // Bills
  PENDING: { label: "Pending", tone: "warning" },
  UNPAID: { label: "Unpaid", tone: "warning" },
  PAID: { label: "Paid", tone: "success" },
  PARTIAL: { label: "Partial", tone: "info" },
  PARTIALLY_PAID: { label: "Partial", tone: "info" },
  REFUNDED: { label: "Refunded", tone: "neutral" },

  // Lab / radiology / procedure orders
  ORDERED: { label: "Ordered", tone: "info" },
  SAMPLE_COLLECTED: { label: "Collected", tone: "info" },
  REPORT_PENDING: { label: "Report pending", tone: "warning" },

  // Prescriptions
  ACTIVE: { label: "Active", tone: "info" },
  DISPENSED: { label: "Dispensed", tone: "success" },

  // Generic fallbacks used across other tables
  DRAFT: { label: "Draft", tone: "neutral" },
  POSTED: { label: "Posted", tone: "success" },
  REJECTED: { label: "Rejected", tone: "danger" },
  APPROVED: { label: "Approved", tone: "success" },
  INACTIVE: { label: "Inactive", tone: "neutral" },
};

/** Unknown statuses still render, just without a special-cased colour. */
function resolve(status: string): StatusDef {
  const known = STATUS[status];
  if (known) return known;
  return {
    label: status.toLowerCase().replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase()),
    tone: "neutral",
  };
}

interface StatusBadgeProps extends React.ComponentProps<typeof Badge> {
  /** Raw status value from the API, e.g. "PARTIALLY_PAID". */
  status: string;
  /** Overrides the derived label. */
  label?: string;
}

export function StatusBadge({ status, label, className, ...props }: StatusBadgeProps) {
  const { label: derived, tone } = resolve(status);
  const text = label ?? derived;

  return (
    <Badge
      variant="outline"
      className={cn("gap-1.5 border-transparent", TONE_CHIP[tone], className)}
      title={text}
      {...props}
    >
      <span aria-hidden="true" className={cn("size-1.5 shrink-0 rounded-full", TONE_DOT[tone])} />
      {text}
    </Badge>
  );
}
