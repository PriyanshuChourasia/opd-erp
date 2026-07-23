import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Calendar,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  History,
  Pill,
  Stethoscope,
} from "lucide-react";
import { fetchPrescriptions } from "@/lib/api";
import type { Prescription } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

interface PatientHistorySheetProps {
  patientId: string | null;
  patientName?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const RX_STATUS_STYLES: Record<string, string> = {
  ACTIVE: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  DISPENSED:
    "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  CANCELLED:
    "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

function todayStr() {
  const d = new Date();
  const offset = d.getTimezoneOffset();
  return new Date(d.getTime() - offset * 60_000).toISOString().slice(0, 10);
}

/** Group prescriptions by month-year for a timeline feel */
function groupByMonth(rxList: Prescription[]): Map<string, Prescription[]> {
  const groups = new Map<string, Prescription[]>();
  for (const rx of rxList) {
    const d = new Date(rx.createdAt);
    const key = d.toLocaleDateString("en-IN", {
      month: "long",
      year: "numeric",
    });
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(rx);
  }
  return groups;
}

/**
 * Rich slide-over listing **all** past prescriptions for a patient,
 * grouped by month with full medicine details, status, and doctor info.
 */
export function PatientHistorySheet({
  patientId,
  patientName,
  open,
  onOpenChange,
}: PatientHistorySheetProps) {
  const [filterDate, setFilterDate] = useState(todayStr());
  const [expandedRx, setExpandedRx] = useState<Set<string>>(new Set());

  const { data, isLoading } = useQuery({
    queryKey: ["prescriptions", "patient-history", patientId, filterDate],
    queryFn: () =>
      fetchPrescriptions({
        patientId: patientId!,
        date: filterDate || undefined,
        limit: 50,
      }),
    enabled: open && !!patientId,
    placeholderData: (prev) => prev,
  });

  const prescriptions = data?.data ?? [];
  const grouped = groupByMonth(prescriptions);

  function toggleExpand(id: string) {
    setExpandedRx((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader className="mb-2">
          <SheetTitle className="flex items-center gap-2 text-lg">
            <History className="size-4" />
            All Prescriptions
          </SheetTitle>
          <SheetDescription>
            {patientName
              ? `Full prescription history for ${patientName}`
              : "Full prescription history"}
          </SheetDescription>
        </SheetHeader>

        {/* Filter row */}
        <div className="flex items-center gap-2 px-4 pb-3">
          <div className="relative flex-1">
            <Calendar className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="date"
              className="h-8 pl-8 text-xs"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
            />
          </div>
          {filterDate && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs shrink-0"
              onClick={() => setFilterDate("")}
            >
              Clear
            </Button>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 space-y-6 px-4 pb-6">
          {isLoading ? (
            <div className="flex flex-col items-center gap-2 py-12 text-center">
              <div className="size-8 animate-pulse rounded-md bg-muted" />
              <p className="text-sm text-muted-foreground">Loading history...</p>
            </div>
          ) : prescriptions.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-14 text-center">
              <div className="flex size-14 items-center justify-center rounded-full bg-muted/50">
                <ClipboardList className="size-7 text-muted-foreground/40" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {filterDate
                    ? "No prescriptions found for this date"
                    : "No past prescriptions recorded"}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground/60">
                  {filterDate
                    ? "Try selecting a different date"
                    : "Prescriptions will appear here once created"}
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Summary bar */}
              <div className="flex items-center justify-between rounded-md border bg-muted/30 px-3 py-2">
                <span className="text-xs font-medium text-muted-foreground">
                  {prescriptions.length} prescription{prescriptions.length !== 1 ? "s" : ""} total
                </span>
                {filterDate && (
                  <span className="text-[10px] text-muted-foreground">
                    Filtered by date
                  </span>
                )}
              </div>

              {/* Timeline */}
              {Array.from(grouped.entries()).map(([month, rxs]) => (
                <div key={month}>
                  <div className="sticky top-0 -mx-1 mb-2 flex items-center gap-2 bg-background px-1 pb-1">
                    <div className="flex size-6 items-center justify-center rounded-full bg-primary/10">
                      <Calendar className="size-3 text-primary" />
                    </div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
                      {month}
                    </span>
                    <span className="h-px flex-1 bg-border" />
                    <span className="text-[10px] text-muted-foreground/50">
                      {rxs.length}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {rxs.map((rx) => {
                      const isExpanded = expandedRx.has(rx.id);
                      const rxDate = new Date(rx.createdAt);
                      return (
                        <div
                          key={rx.id}
                          className="group overflow-hidden rounded-lg border transition-all hover:shadow-sm"
                        >
                          {/* Collapsed header */}
                          <button
                            type="button"
                            className="flex w-full items-start gap-3 px-3.5 py-3 text-left transition-colors hover:bg-muted/30"
                            onClick={() => toggleExpand(rx.id)}
                          >
                            {/* Date indicator */}
                            <div className="flex shrink-0 flex-col items-center pt-0.5">
                              <span className="text-[11px] font-bold leading-tight tabular-nums">
                                {rxDate.getDate()}
                              </span>
                              <span className="text-[8px] font-medium uppercase text-muted-foreground/60 leading-tight">
                                {rxDate.toLocaleDateString("en-IN", { month: "short" })}
                              </span>
                            </div>

                            {/* Main info */}
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="truncate text-sm font-medium">
                                  {rx.diagnosis || (
                                    <span className="italic text-muted-foreground/60">
                                      No diagnosis
                                    </span>
                                  )}
                                </span>
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    "shrink-0 text-[9px] uppercase",
                                    RX_STATUS_STYLES[rx.status] ?? ""
                                  )}
                                >
                                  {rx.status}
                                </Badge>
                              </div>
                              <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Pill className="size-2.5 text-violet-500" />
                                  {rx.items.length} item{rx.items.length !== 1 ? "s" : ""}
                                </span>
                                {rx.doctor?.name && (
                                  <span className="flex items-center gap-1">
                                    <Stethoscope className="size-2.5" />
                                    Dr. {rx.doctor.name}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Expand icon */}
                            <div className="shrink-0 pt-0.5 text-muted-foreground/40 transition-transform group-hover:text-muted-foreground/70">
                              {isExpanded ? (
                                <ChevronUp className="size-3.5" />
                              ) : (
                                <ChevronDown className="size-3.5" />
                              )}
                            </div>
                          </button>

                          {/* Expanded details */}
                          {isExpanded && (
                            <div className="border-t bg-muted/20 px-3.5 py-3 space-y-3">
                              {/* Diagnosis */}
                              {rx.diagnosis && (
                                <div>
                                  <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/60">
                                    Diagnosis
                                  </span>
                                  <p className="mt-0.5 text-sm">{rx.diagnosis}</p>
                                </div>
                              )}

                              {/* Prescribed by */}
                              {rx.doctor?.name && (
                                <div>
                                  <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/60">
                                    Prescribed by
                                  </span>
                                  <p className="mt-0.5 text-sm">
                                    Dr. {rx.doctor.name}
                                    {rx.doctor.specialization && (
                                      <span className="ml-1 text-xs text-muted-foreground">
                                        ({rx.doctor.specialization})
                                      </span>
                                    )}
                                  </p>
                                </div>
                              )}

                              {/* Medicines */}
                              <div>
                                <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/60">
                                  Medicines
                                </span>
                                <div className="mt-1 space-y-1.5">
                                  {rx.items.map((item) => (
                                    <div
                                      key={item.id}
                                      className="flex items-center gap-2 rounded-sm border bg-background px-2.5 py-1.5"
                                    >
                                      <Pill className="size-3 shrink-0 text-violet-500" />
                                      <span className="min-w-0 flex-1 text-xs font-medium">
                                        {item.medicineName}
                                      </span>
                                      <span className="shrink-0 text-[10px] text-muted-foreground">
                                        {item.dosage}
                                      </span>
                                      {item.duration && (
                                        <span className="shrink-0 text-[10px] text-muted-foreground">
                                          &middot; {item.duration}
                                        </span>
                                      )}
                                      <span className="shrink-0 text-[10px] text-muted-foreground">
                                        &middot; Qty: {item.quantity}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Notes */}
                              {rx.notes && (
                                <div>
                                  <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/60">
                                    Doctor's Notes
                                  </span>
                                  <p className="mt-0.5 rounded-sm border bg-background px-2.5 py-1.5 text-xs italic text-muted-foreground">
                                    {rx.notes}
                                  </p>
                                </div>
                              )}

                              {/* Footer */}
                              <div className="flex items-center justify-between text-[10px] text-muted-foreground/50">
                                <span>
                                  Created{" "}
                                  {rxDate.toLocaleString("en-IN", {
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                                <span className="font-mono">
                                  #{rx.id.slice(0, 8).toUpperCase()}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
