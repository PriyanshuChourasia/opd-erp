export function formatCurrency(value: number): string {
  return `₹${value.toLocaleString()}`;
}

export function formatDays(days: number): string {
  return `${days}d`;
}

export function statusBadgeClass(status: string): string {
  switch (status) {
    case "PAID":
    case "COMPLETED":
    case "DISPENSED":
      return "border-transparent bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400";
    case "PENDING":
    case "ACTIVE":
    case "SCHEDULED":
      return "border-transparent bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400";
    case "PARTIAL":
    case "IN_PROGRESS":
    case "CHECKED_IN":
      return "border-transparent bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
    case "CANCELLED":
    case "REFUNDED":
    case "NO_SHOW":
      return "border-transparent bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
    default:
      return "border-transparent bg-muted text-muted-foreground";
  }
}

export function formatStatus(status: string): string {
  return status
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
