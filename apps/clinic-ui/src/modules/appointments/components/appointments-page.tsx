import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import type { ColumnDef, PaginationState } from "@tanstack/react-table";
import { AlertTriangle, CalendarClock, Eye, FileText, Plus, Printer, Receipt, Search, X } from "lucide-react";
import {
  fetchAppointments,
  updateAppointmentStatus,
  rescheduleAppointment,
  checkoutAppointment,
  fetchDoctors,
  fetchDoctorSlots,
  fetchUsers,
  fetchOrganisation,
  updatePatient,
  type Appointment,
  type AppointmentStatus,
} from "@/lib/api";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { extractApiError } from "@/lib/axios-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldLabel } from "@/components/ui/field";
import {
  Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import { DataTable } from "@/components/data-table/data-table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { QueuePage } from "@/modules/queue";

const APPT_STATUSES: AppointmentStatus[] = ["SCHEDULED", "CHECKED_IN", "CANCELLED", "RESCHEDULED", "NO_SHOW"];

const APPT_STATUS_STYLES: Record<string, string> = {
  SCHEDULED: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  CONFIRMED: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  CHECKED_IN: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  IN_PROGRESS: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  COMPLETED: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  CANCELLED: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  RESCHEDULED: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  NO_SHOW: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};


/** Checked-in patients are already sitting in the live queue — label the
 *  status accordingly rather than showing the raw "CHECKED IN" wording. */
function apptStatusLabel(status: string) {
  return status === "CHECKED_IN" ? "In-Queue" : status.replace("_", " ");
}

function currency(value: number) { return `₹${value.toFixed(2)}`; }
function todayStr() {
  const d = new Date();
  const offset = d.getTimezoneOffset();
  return new Date(d.getTime() - offset * 60_000).toISOString().slice(0, 10);
}
function tomorrowStr() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  const offset = d.getTimezoneOffset();
  return new Date(d.getTime() - offset * 60_000).toISOString().slice(0, 10);
}
function localDateStr(d: Date) {
  const offset = d.getTimezoneOffset();
  return new Date(d.getTime() - offset * 60_000).toISOString().slice(0, 10);
}
function localTimeStr(d: Date) {
  const offset = d.getTimezoneOffset();
  return new Date(d.getTime() - offset * 60_000).toISOString().slice(11, 16);
}


export function AppointmentsPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [filterDoctor, setFilterDoctor] = useState("");
  const [filterDate, setFilterDate] = useState(todayStr());
  // Appointments always stay visible in this list regardless of status
  // (booking never removes them) — default to no status filter so
  // checked-in ("In-Queue") appointments don't silently disappear.
  const [filterStatus, setFilterStatus] = useState("");
  const [filterCreator, setFilterCreator] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 20 });
  const [statusConfirm, setStatusConfirm] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [printAppt, setPrintAppt] = useState<Appointment | null>(null);
  const [activeTab, setActiveTab] = useState<"appointments" | "queue">("appointments");
  const [rescheduleTarget, setRescheduleTarget] = useState<Appointment | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleTime, setRescheduleTime] = useState("");
  const [rescheduleDoctorId, setRescheduleDoctorId] = useState("");

  useEffect(() => {
    function handleAfterPrint() { setPrintAppt(null); }
    window.addEventListener("afterprint", handleAfterPrint);
    return () => window.removeEventListener("afterprint", handleAfterPrint);
  }, []);

  function openPrint(appt: Appointment) {
    setPrintAppt(appt);
    setTimeout(() => window.print(), 50);
  }

  const { data: doctorsResponse } = useQuery({
    queryKey: ["doctors", "appointments-filter"],
    queryFn: () => fetchDoctors({ limit: 100 }),
  });
  const doctors = useMemo(() => doctorsResponse?.data ?? [], [doctorsResponse]);

  const { data: usersResponse } = useQuery({
    queryKey: ["users", "appointments-filter"],
    queryFn: () => fetchUsers({ limit: 100 }),
  });
  const users = useMemo(() => usersResponse?.data ?? [], [usersResponse]);

  const { data: organisation } = useQuery({ queryKey: ["organisation"], queryFn: fetchOrganisation });

  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput.trim());
      setPagination((p) => ({ ...p, pageIndex: 0 }));
    }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const { data: appointmentsResponse, isLoading } = useQuery({
    queryKey: ["appointments", filterDoctor, filterDate, filterStatus, filterCreator, search, pagination.pageIndex, pagination.pageSize],
    queryFn: () => fetchAppointments({
      doctorId: filterDoctor || undefined,
      date: search ? undefined : (filterDate || undefined),
      status: filterStatus || undefined,
      createdById: filterCreator || undefined,
      search: search || undefined,
      page: pagination.pageIndex + 1,
      limit: pagination.pageSize,
    }),
    placeholderData: (previous) => previous,
    refetchInterval: 15_000,
  });
  const appointments = useMemo(() => appointmentsResponse?.data ?? [], [appointmentsResponse]);
  const pageCount = appointmentsResponse?.meta?.totalPages ?? 0;

  const statusMutation = useMutation({
    mutationFn: ({ id, status, cancellationReason }: { id: string; status: AppointmentStatus; cancellationReason?: string }) =>
      updateAppointmentStatus(id, status, cancellationReason),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["appointments"] }); setStatusConfirm(null); setCancelReason(""); toast.success("Appointment status updated"); },
    onError: (err) => { toast.error(extractApiError(err)); },
  });

  const followUpMutation = useMutation({
    mutationFn: ({ id, isFollowUp }: { id: string; isFollowUp: boolean }) => updatePatient(id, { isFollowUp }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["appointment-patients"] }); },
    onError: (err) => { toast.error(extractApiError(err)); },
  });

  const checkoutMutation = useMutation({
    mutationFn: (id: string) => checkoutAppointment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      toast.success("Invoice generated successfully");
    },
    onError: (err) => { toast.error(extractApiError(err)); },
  });

  function openReschedule(appt: Appointment) {
    const d = new Date(appt.date);
    setRescheduleTarget(appt);
    setRescheduleDate(localDateStr(d));
    setRescheduleTime(localTimeStr(d));
    setRescheduleDoctorId(appt.doctorId);
  }

  const rescheduleSlotsQuery = useQuery({
    queryKey: ["doctor-slots", "reschedule", rescheduleDoctorId, rescheduleDate],
    queryFn: () => fetchDoctorSlots(rescheduleDoctorId, rescheduleDate),
    enabled: !!rescheduleDoctorId && !!rescheduleDate,
  });

  const rescheduleMutation = useMutation({
    mutationFn: () =>
      rescheduleAppointment(rescheduleTarget!.id, {
        date: `${rescheduleDate}T${rescheduleTime}:00`,
        doctorId: rescheduleDoctorId || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      setRescheduleTarget(null);
      toast.success("Appointment rescheduled");
    },
    onError: (err) => { toast.error(extractApiError(err)); },
  });

  const pendingInvoiceAppointments = useMemo(
    () => appointments.filter((a) => a.status === "COMPLETED" && !a.bill),
    [appointments],
  );

  const bulkCheckoutMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      let succeeded = 0;
      let failed = 0;
      // Sequential on purpose: invoice numbers are allocated by counting
      // existing bills, so concurrent checkouts could race onto the same number.
      for (const id of ids) {
        try {
          await checkoutAppointment(id);
          succeeded++;
        } catch {
          failed++;
        }
      }
      return { succeeded, failed };
    },
    onSuccess: ({ succeeded, failed }) => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      if (succeeded) toast.success(`Generated ${succeeded} invoice${succeeded === 1 ? "" : "s"}`);
      if (failed) toast.error(`${failed} invoice${failed === 1 ? "" : "s"} failed to generate`);
    },
  });

  function setFilterDoctorAndResetPage(id: string) {
    setFilterDoctor(id);
    setPagination((p) => ({ ...p, pageIndex: 0 }));
  }
  function setFilterDateAndResetPage(date: string) {
    setFilterDate(date);
    setPagination((p) => ({ ...p, pageIndex: 0 }));
  }
  function setFilterStatusAndResetPage(status: string) {
    setFilterStatus(status);
    setPagination((p) => ({ ...p, pageIndex: 0 }));
  }
  function setFilterCreatorAndResetPage(creatorId: string) {
    setFilterCreator(creatorId);
    setPagination((p) => ({ ...p, pageIndex: 0 }));
  }

  const columns = useMemo<ColumnDef<Appointment>[]>(() => [
    {
      id: "token",
      header: "Token #",
      cell: ({ row }) => (
        <span className="text-sm font-semibold text-muted-foreground">
          {row.original.tokenNumber ? `#${row.original.tokenNumber}` : "—"}
        </span>
      ),
    },
    {
      id: "patient",
      header: "Patient",
      cell: ({ row }) => (
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{row.original.patient?.name}</p>
          <p className="text-xs text-muted-foreground">{row.original.patient?.phone}</p>
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant="outline" className={`text-[10px] ${APPT_STATUS_STYLES[row.original.status] ?? ""}`}>
          {apptStatusLabel(row.original.status)}
        </Badge>
      ),
    },
    {
      id: "doctor",
      header: "Doctor",
      cell: ({ row }) => <span className="text-sm">{row.original.doctor?.name ?? row.original.doctor?.medicalRegistrationNo ?? 'Doctor'}</span>,
    },
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ row }) => <span className="text-sm text-muted-foreground">{row.original.type.replace("_", " ")}</span>,
    },
    {
      id: "time",
      header: "Time",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {new Date(row.original.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </span>
      ),
    },
    {
      accessorKey: "fee",
      header: "Fee",
      cell: ({ row }) => <span className="text-sm font-medium">{currency(row.original.fee)}</span>,
    },
    {
      id: "actions",
      header: "Action",
      cell: ({ row }) => {
        const appt = row.original;
        return (
          <div className="flex items-center justify-end gap-1">
            <Button variant="ghost" size="icon" className="size-8" title="View / Edit appointment" aria-label="View or edit appointment" onClick={() => navigate({ to: "/appointments/$appointmentId/edit", params: { appointmentId: appt.id } })}>
              <Eye className="size-4" />
            </Button>
            <Button variant="ghost" size="icon" className="size-8" title="Print acknowledgement slip" aria-label="Print acknowledgement slip" onClick={() => openPrint(appt)}>
              <Printer className="size-4" />
            </Button>
            {appt.status === "COMPLETED" && (
              appt.bill ? (
                <Badge variant="outline" className="text-[10px]" title={`Invoice ${appt.bill.invoiceNo}`}>{appt.bill.invoiceNo}</Badge>
              ) : (
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="size-8" title="Generate invoice (direct)" aria-label="Generate invoice directly" onClick={() => checkoutMutation.mutate(appt.id)}>
                    <FileText className="size-4 text-green-600" />
                  </Button>
                  <Button variant="ghost" size="icon" className="size-8" title="Generate invoice (POS)" aria-label="Generate invoice via POS checkout" onClick={() => navigate({ to: "/pos", search: { appointmentId: appt.id } })}>
                    <Receipt className="size-4 text-primary" />
                  </Button>
                </div>
              )
            )}
            {statusConfirm === appt.id ? (
              <div className="flex items-center gap-1">
                <Input
                  autoFocus
                  placeholder="Reason (optional)"
                  className="h-8 w-36 text-xs"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") statusMutation.mutate({ id: appt.id, status: "CANCELLED", cancellationReason: cancelReason || undefined }); }}
                />
                <Button variant="destructive" size="sm" className="h-8 text-xs" onClick={() => statusMutation.mutate({ id: appt.id, status: "CANCELLED", cancellationReason: cancelReason || undefined })}>Cancel</Button>
                <Button variant="ghost" size="icon" className="size-8" aria-label="Dismiss cancellation" onClick={() => { setStatusConfirm(null); setCancelReason(""); }}><X className="size-3.5" /></Button>
              </div>
            ) : (
              <Select
                value={appt.status}
                onValueChange={(value) => {
                  if (value === appt.status) return;
                  if (value === "CANCELLED") { setStatusConfirm(appt.id); return; }
                  if (value === "RESCHEDULED") { openReschedule(appt); return; }
                  statusMutation.mutate({ id: appt.id, status: value as AppointmentStatus }, {
                    onSuccess: () => {
                      if (value === "CHECKED_IN") queryClient.invalidateQueries({ queryKey: ["queue"] });
                    },
                  });
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
          </div>
        );
      },
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [statusConfirm, cancelReason]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">Appointment & Queue</h1>
        </div>
        <div className="flex items-center gap-2">
          {pendingInvoiceAppointments.length > 0 && (
            <Button
              variant="outline"
              onClick={() => bulkCheckoutMutation.mutate(pendingInvoiceAppointments.map((a) => a.id))}
              disabled={bulkCheckoutMutation.isPending}
            >
              <FileText className="mr-2 size-4" />
              {bulkCheckoutMutation.isPending ? "Generating..." : `Generate ${pendingInvoiceAppointments.length} invoice${pendingInvoiceAppointments.length === 1 ? "" : "s"}`}
            </Button>
          )}
        <Button onClick={() => navigate({ to: "/appointments/new" })}><Plus className="mr-2 size-4" />New Appointment</Button>
          <div className="flex items-center gap-1.5">
            <Button variant={!search && !filterDate ? "default" : "outline"} size="sm" onClick={() => setFilterDateAndResetPage("")}>All</Button>
            <Button variant={filterDate === todayStr() ? "default" : "outline"} size="sm" onClick={() => setFilterDateAndResetPage(todayStr())}>Today</Button>
            <Button variant={filterDate === tomorrowStr() ? "default" : "outline"} size="sm" onClick={() => setFilterDateAndResetPage(tomorrowStr())}>Tomorrow</Button>
            <Input
              type="date"
              className="w-auto"
              title={search ? "Date filter is ignored while searching" : undefined}
              disabled={!!search}
              value={filterDate}
              onChange={(e) => setFilterDateAndResetPage(e.target.value)}
            />
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "appointments" | "queue")}>
        <TabsList>
          <TabsTrigger value="appointments">Appointments</TabsTrigger>
          <TabsTrigger value="queue">Queue</TabsTrigger>
        </TabsList>

        <TabsContent value="appointments" className="space-y-4 mt-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search patient name, phone, or token #" className="w-64 pl-9" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} />
        </div>
        <select
          className="flex h-9 rounded-none border border-input bg-background px-3 py-1 text-sm"
          value={filterDoctor}
          onChange={(e) => setFilterDoctorAndResetPage(e.target.value)}
        >
          <option value="">All doctors</option>
          {doctors.map((d) => (
            <option key={d.id} value={d.id}>{d.name ?? d.medicalRegistrationNo ?? 'Doctor'}</option>
          ))}
        </select>
        <select
          className="flex h-9 rounded-none border border-input bg-background px-3 py-1 text-sm"
          value={filterStatus}
          onChange={(e) => setFilterStatusAndResetPage(e.target.value)}
        >
          <option value="">All statuses</option>
          <option value="SCHEDULED">Scheduled</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="CHECKED_IN">In-Queue</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
          <option value="RESCHEDULED">Rescheduled</option>
          <option value="NO_SHOW">No Show</option>
        </select>
        <select
          className="flex h-9 rounded-none border border-input bg-background px-3 py-1 text-sm"
          value={filterCreator}
          onChange={(e) => setFilterCreatorAndResetPage(e.target.value)}
        >
          <option value="">All creators</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>
          ))}
        </select>
      </div>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Appointments</CardTitle></CardHeader>
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={appointments}
            pageCount={pageCount}
            pagination={pagination}
            onPaginationChange={setPagination}
            isLoading={isLoading}
            emptyState={
              <div className="flex flex-col items-center gap-2 py-6 text-center">
                <CalendarClock className="size-8 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">No appointments for this day</p>
              </div>
            }
          />
        </CardContent>
      </Card>
        </TabsContent>

        <TabsContent value="queue">
          <QueuePage />
        </TabsContent>
      </Tabs>

      <Sheet open={!!rescheduleTarget} onOpenChange={(open) => { if (!open) setRescheduleTarget(null); }}>
        <SheetContent side="right" className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Reschedule Appointment</SheetTitle>
            <SheetDescription>{rescheduleTarget?.patient?.name} — pick a new date, doctor, and slot.</SheetDescription>
          </SheetHeader>
          <div className="flex-1 space-y-4 px-4 pb-4">
            <Field><FieldLabel htmlFor="r-date">Date</FieldLabel>
              <Input id="r-date" type="date" value={rescheduleDate} onChange={(e) => { setRescheduleDate(e.target.value); setRescheduleTime(""); }} />
            </Field>
            <Field><FieldLabel htmlFor="r-doctor">Doctor</FieldLabel>
              <select
                id="r-doctor"
                className="flex h-9 w-full rounded-none border border-input bg-background px-3 py-1 text-sm"
                value={rescheduleDoctorId}
                onChange={(e) => { setRescheduleDoctorId(e.target.value); setRescheduleTime(""); }}
              >
                <option value="">Select a doctor...</option>
                {doctors.map((d) => (<option key={d.id} value={d.id}>{d.name ?? d.medicalRegistrationNo ?? 'Doctor'}</option>))}
              </select>
            </Field>
            {rescheduleDoctorId && rescheduleDate && (
              <Field><FieldLabel>Slot</FieldLabel>
                {rescheduleSlotsQuery.isLoading ? (<p className="text-sm text-muted-foreground">Loading slots...</p>) : !rescheduleSlotsQuery.data?.available ? (<p className="text-sm text-muted-foreground">No slots available for this day.</p>) : (
                  <div className="grid grid-cols-4 gap-2">
                    {rescheduleSlotsQuery.data.slots.map((s) => (
                      <button key={s.time} type="button" disabled={!s.available} className={cn("rounded-none border px-2 py-1.5 text-xs font-medium disabled:cursor-not-allowed disabled:opacity-40", rescheduleTime === s.time ? "border-primary bg-primary/10 text-primary" : "text-muted-foreground")} onClick={() => setRescheduleTime(s.time)}>
                        {s.time}
                      </button>
                    ))}
                  </div>
                )}
              </Field>
            )}
          </div>
          <SheetFooter>
            <Button variant="outline" onClick={() => setRescheduleTarget(null)}>Cancel</Button>
            <Button
              onClick={() => rescheduleMutation.mutate()}
              disabled={!rescheduleDate || !rescheduleDoctorId || !rescheduleTime || rescheduleMutation.isPending}
            >
              {rescheduleMutation.isPending ? "Rescheduling..." : "Reschedule"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* ── Printable acknowledgement slip (hidden on screen, shown only by @media print in index.css) ── */}
      <div id="print-area" className="hidden">
        {printAppt && (
          <div className="p-8 text-black">
            <div className="mb-4 border-b-2 border-black pb-3">
              <h1 className="text-xl font-bold">{organisation?.name ?? "Clinic"}</h1>
              {organisation?.address && <p className="text-xs">{organisation.address}</p>}
              {organisation?.phone && <p className="text-xs">Phone: {organisation.phone}</p>}
            </div>
            <h2 className="mb-3 text-center text-lg font-semibold">Appointment Acknowledgement</h2>
            <div className="mb-4 flex justify-between text-sm">
              <div>
                <p><strong>Patient:</strong> {printAppt.patient?.name}</p>
                <p><strong>Phone:</strong> {printAppt.patient?.phone}</p>
              </div>
              <div className="text-right">
                <p><strong>Doctor:</strong> {printAppt.doctor?.name ?? printAppt.doctor?.medicalRegistrationNo}</p>
                {printAppt.doctor?.specialization && <p><strong>Department:</strong> {printAppt.doctor.specialization}</p>}
              </div>
            </div>
            <div className="mb-4 flex justify-between text-sm">
              <p><strong>Date/Time:</strong> {new Date(printAppt.date).toLocaleString()}</p>
              <p><strong>Token #:</strong> {printAppt.tokenNumber ?? "—"}</p>
            </div>
            <div className="mb-4 flex justify-between text-sm">
              <p><strong>Type:</strong> {printAppt.type.replace("_", " ")}</p>
              <p><strong>Status:</strong> {apptStatusLabel(printAppt.status)}</p>
            </div>
            <table className="w-full border-collapse text-sm">
              <tbody>
                <tr className="border-b border-gray-300">
                  <td className="py-1.5">Consultation Fee</td>
                  <td className="py-1.5 text-right">{currency(printAppt.fee)}</td>
                </tr>
                {printAppt.registrationFee > 0 && (
                  <tr className="border-b border-gray-300">
                    <td className="py-1.5">Registration Fee</td>
                    <td className="py-1.5 text-right">{currency(printAppt.registrationFee)}</td>
                  </tr>
                )}
                <tr className="font-semibold">
                  <td className="py-1.5">Total</td>
                  <td className="py-1.5 text-right">{currency(printAppt.fee + printAppt.registrationFee)}</td>
                </tr>
              </tbody>
            </table>
            <p className="mt-6 text-xs text-muted-foreground">Please arrive 15 minutes before your scheduled time and bring this slip along with any previous reports.</p>
          </div>
        )}
      </div>
    </div>
  );
}
