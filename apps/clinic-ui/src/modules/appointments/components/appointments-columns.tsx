import { useMemo } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { Banknote, ClipboardList, Eye, FileText, HeartPulse, Printer } from "lucide-react";
import { checkoutAppointment, getPatientName, type Appointment, type AppointmentStatus } from "@/lib/api";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { extractApiError } from "@/lib/axios-client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useAppSelector } from "@/store/hooks";
import { hasPermission } from "@/lib/roles";

export const APPT_STATUSES: AppointmentStatus[] = ["SCHEDULED", "CONFIRMED", "IN_PROGRESS", "COMPLETED"];

export const APPT_STATUS_STYLES: Record<string, string> = {
  SCHEDULED: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  CONFIRMED: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  CHECKED_IN: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  IN_PROGRESS: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  COMPLETED: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  CANCELLED: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  RESCHEDULED: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  NO_SHOW: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

/** Confirmed appointments are the ones sitting in the live queue (see
 *  AppointmentsService.update's CONFIRMED transition) — label plainly
 *  otherwise, no special-casing needed beyond underscore→space. */
export function apptStatusLabel(status: string) {
  return status.replace("_", " ");
}

export function currency(value: number) { const n = Number(value) || 0; return `₹${n.toFixed(2)}`; }

/** Derive payment status from appointment data */
export function paymentStatus(appt: Appointment): { label: string; className: string } {
  if (appt.bill) {
    const s = appt.bill.status;
    if (s === "PAID") return { label: "Paid", className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" };
    if (s === "REFUNDED") return { label: "Refunded", className: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400" };
    if (s === "PARTIALLY_PAID") return { label: "Partial", className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" };
    return { label: "Due", className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" };
  }
  if (appt.amountPaid > 0) return { label: "Advance", className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" };
  return { label: "Due", className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" };
}

interface InvoiceActionCellProps {
  appt: Appointment;
  onOpenInvoice: (billId: string) => void;
}

/**
 * Invoice button + payment badge for an appointment row. When no bill exists
 * yet, a user with create:billing permission can generate one on the fly
 * (checkoutAppointment with defaults — no discount/tax) and the sheet opens
 * with it; read-only users get a toast pointing them to front-desk instead of
 * a dead end.
 */
function InvoiceActionCell({ appt, onOpenInvoice }: InvoiceActionCellProps) {
  const queryClient = useQueryClient();
  const permissions = useAppSelector((state) => state.auth.user?.permissions);
  const canCreateBilling = hasPermission(permissions, "create", "billing");

  const handleClick = async () => {
    if (appt.bill) {
      onOpenInvoice(appt.bill.id);
      return;
    }
    if (!canCreateBilling) {
      toast.info("No invoice yet — ask a front-desk user to generate one.");
      return;
    }
    try {
      const bill = await checkoutAppointment(appt.id, {});
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      onOpenInvoice(bill.id);
    } catch (err) {
      toast.error(extractApiError(err));
    }
  };

  return (
    <div className="flex items-center gap-1">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" className="size-9" aria-label="View invoice" onClick={handleClick}>
            <FileText className="size-4.5 text-green-600" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>{appt.bill ? (appt.bill.status === "PAID" ? "View Receipt" : "View Invoice") : "No invoice yet"}</TooltipContent>
      </Tooltip>
      {appt.bill ? (
        <Badge variant="outline" className={cn("text-[10px]",
          appt.bill.status === "PAID" ? "bg-green-100 text-green-700 border-green-300 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800"
            : "bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800"
        )}>
          {appt.bill.status === "PAID" ? "Paid" : "Due"}
        </Badge>
      ) : (
        <Badge variant="outline" className="text-[10px] bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800">
          Due
        </Badge>
      )}
    </div>
  );
}

interface UseAppointmentsColumnsOptions {
  onOpenVitals: (appt: Appointment) => void;
  onPrintAppt: (appt: Appointment) => void;
  onOpenInvoice: (billId: string) => void;
  onCollectPayment: (appt: Appointment) => void;
  onPrintPrescription: (appt: Appointment) => void;
  onStatusChange: (appt: Appointment, status: AppointmentStatus) => void;
}

export function useAppointmentsColumns({ onOpenVitals, onPrintAppt, onOpenInvoice, onCollectPayment, onPrintPrescription, onStatusChange }: UseAppointmentsColumnsOptions) {
  const navigate = useNavigate();

  return useMemo<ColumnDef<Appointment>[]>(() => [
    {
      id: "token",
      header: () => <div className="text-center">Token #</div>,
      cell: ({ row }) => (
        <div className="text-center text-sm font-semibold text-muted-foreground">
          {row.original.tokenNumber ? `#${row.original.tokenNumber}` : "—"}
        </div>
      ),
    },
    {
      id: "patient",
      header: () => <div className="text-center">Patient</div>,
      cell: ({ row }) => {
        const appt = row.original;
        return (
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{appt.patient ? getPatientName(appt.patient) : null}</p>
            <p className="text-xs text-muted-foreground">{appt.patient?.contactNo}</p>
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: () => <div className="text-center">Status</div>,
      cell: ({ row }) => (
        <div className="flex justify-center">
          <Badge variant="outline" className={`text-[10px] ${APPT_STATUS_STYLES[row.original.status] ?? ""}`}>
            {apptStatusLabel(row.original.status)}
          </Badge>
        </div>
      ),
    },
    {
      id: "paymentStatus",
      header: () => <div className="text-center">Payment Status</div>,
      cell: ({ row }) => {
        const ps = paymentStatus(row.original);
        return (
          <div className="flex justify-center">
            <Badge variant="outline" className={`text-[10px] ${ps.className}`}>{ps.label}</Badge>
          </div>
        );
      },
    },
    {
      id: "doctor",
      header: () => <div className="text-center">Doctor</div>,
      cell: ({ row }) => <div className="text-center text-sm">{row.original.doctor?.name ?? row.original.doctor?.medicalRegistrationNo ?? 'Doctor'}</div>,
    },
    {
      accessorKey: "type",
      header: () => <div className="text-center">Type</div>,
      cell: ({ row }) => <div className="text-center text-sm text-muted-foreground">{row.original.type.replace("_", " ")}</div>,
    },
    {
      id: "time",
      header: () => <div className="text-center">Time</div>,
      cell: ({ row }) => (
        <div className="text-center text-sm text-muted-foreground">
          {new Date(row.original.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </div>
      ),
    },
    {
      accessorKey: "fee",          header: () => <div className="text-center">Amount</div>,
      // Once a bill exists its total is the source of truth (discount/tax may
      // have changed it at checkout); before that, fall back to consultation
      // + registration fee — the same total the Edit page shows.
      cell: ({ row }) => <div className="text-center text-sm font-medium">{currency(row.original.bill ? row.original.bill.total : row.original.amount + row.original.registrationFee)}</div>,
    },
    {
      id: "actions",
      header: () => <div className="text-center">Action</div>,
      cell: ({ row }) => {
        const appt = row.original;
        return (
          <div className="flex items-center justify-center gap-1">
            <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="size-9" aria-label="View or edit appointment" onClick={() => navigate({ to: "/appointments/$appointmentId/edit", params: { appointmentId: appt.id } })}>
                  <Eye className="size-4.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>View / Edit</TooltipContent>
            </Tooltip>
            {appt.status !== "CANCELLED" && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="size-9" aria-label="View or record patient vitals" onClick={() => onOpenVitals(appt)}>
                    <HeartPulse className="size-4.5 text-rose-500" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Vitals</TooltipContent>
              </Tooltip>
            )}
            {appt.status !== "CANCELLED" && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="size-9" aria-label="Collect payment" onClick={() => onCollectPayment(appt)}>
                    <Banknote className="size-4.5 text-emerald-600" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Collect Payment</TooltipContent>
              </Tooltip>
            )}
            {appt.status !== "COMPLETED" && (
              <>
                <InvoiceActionCell appt={appt} onOpenInvoice={onOpenInvoice} />
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="size-9" aria-label="Print appointment slip" onClick={() => onPrintAppt(appt)}>
                      <Printer className="size-4.5 text-gray-600" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Print Slip</TooltipContent>
                </Tooltip>
              </>
            )}
            {appt.status === "COMPLETED" && (
              <>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="size-9" aria-label="Print prescription" onClick={() => onPrintPrescription(appt)}>
                      <Printer className="size-4.5 text-indigo-600" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Print Prescription</TooltipContent>
                </Tooltip>
                <InvoiceActionCell appt={appt} onOpenInvoice={onOpenInvoice} />
              </>
            )}
            {appt.status !== "COMPLETED" && APPT_STATUSES.includes(appt.status as AppointmentStatus) && (
              <Select
                value={appt.status}
                onValueChange={(value) => {
                  if (value === appt.status) return;
                  onStatusChange(appt, value as AppointmentStatus);
                }}
              >
                <SelectTrigger size="sm" className="h-8 text-xs" aria-label="Change appointment status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {APPT_STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>{apptStatusLabel(status)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            </TooltipProvider>
          </div>
        );
      },
    },
  ], [navigate, onOpenVitals, onPrintAppt, onOpenInvoice, onCollectPayment, onPrintPrescription, onStatusChange]);
}