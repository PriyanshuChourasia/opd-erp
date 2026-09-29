import { useMemo } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { Banknote, ClipboardList, Eye, FileText, HeartPulse, Pencil, Printer } from "lucide-react";
import { checkoutAppointment, getPatientName, type Appointment, type AppointmentStatus } from "@/lib/api";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { extractApiError } from "@/lib/axios-client";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/status-badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useAppSelector } from "@/store/hooks";
import { hasPermission } from "@/lib/roles";

export const APPT_STATUSES: AppointmentStatus[] = ["SCHEDULED", "CONFIRMED", "IN_PROGRESS", "COMPLETED"];

/** Plain formatter for raw status values, used where a chip is NOT being
 *  rendered (the status <Select>, and the printed appointment slip). Chips use
 *  <StatusBadge>, which applies its own semantic labels. */
export function apptStatusLabel(status: string) {
  return status.replace(/_/g, " ");
}

export function currency(value: number) { const n = Number(value) || 0; return `₹${n.toFixed(2)}`; }

/** Derive payment status from appointment data. Returns a raw status so the
 *  chip colour comes from the shared semantic tokens via <StatusBadge>. */
export function paymentStatus(appt: Appointment): { label: string; status: string } {
  if (appt.bill) {
    const s = appt.bill.status;
    if (s === "PAID") return { label: "Paid", status: "PAID" };
    if (s === "REFUNDED") return { label: "Refunded", status: "REFUNDED" };
    if (s === "PARTIALLY_PAID" || s === "PARTIAL") return { label: "Partial", status: "PARTIALLY_PAID" };
    return { label: "Due", status: "PENDING" };
  }
  if (appt.amountPaid > 0) return { label: "Advance", status: "PARTIALLY_PAID" };
  return { label: "Due", status: "PENDING" };
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
            <FileText className="size-4.5 text-primary" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>{appt.bill ? (appt.bill.status === "PAID" ? "View Receipt" : "View Invoice") : "No invoice yet"}</TooltipContent>
      </Tooltip>
      {appt.bill ? (
        <StatusBadge status={appt.bill.status} label={appt.bill.status === "PAID" ? "Paid" : "Due"} />
      ) : (
        <StatusBadge status="PENDING" label="Due" />
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
        <div className="tabular text-center text-sm font-semibold text-muted-foreground">
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
          <StatusBadge status={row.original.status} />
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
            <StatusBadge status={ps.status} label={ps.label} />
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
      cell: ({ row }) => <div className="tabular text-center text-sm font-medium">{currency(row.original.bill ? row.original.bill.total : row.original.amount + row.original.registrationFee)}</div>,
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
                    <Banknote className="size-4.5 text-primary" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Collect Payment</TooltipContent>
              </Tooltip>
            )}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="size-9" aria-label="Print appointment slip" onClick={() => onPrintAppt(appt)}>
                  <Printer className="size-4.5 text-gray-600" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Print Slip</TooltipContent>
            </Tooltip>
            {appt.status !== "COMPLETED" && (
              <InvoiceActionCell appt={appt} onOpenInvoice={onOpenInvoice} />
            )}
            {appt.status === "COMPLETED" && (
              <>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="size-9" aria-label="Edit prescription" onClick={() => navigate({ to: "/appointments/$appointmentId/prescription", params: { appointmentId: appt.id } })}>
                      <Pencil className="size-4.5 text-primary" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Edit Prescription</TooltipContent>
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
  ], [navigate, onOpenVitals, onPrintAppt, onOpenInvoice, onCollectPayment, onStatusChange]);
}