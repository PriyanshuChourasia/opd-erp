import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import type { ColumnDef, PaginationState } from "@tanstack/react-table";
import { AlertTriangle, CalendarClock, FileText, Plus, Receipt, Search, X } from "lucide-react";
import {
  fetchAppointments,
  createAppointment,
  updateAppointmentStatus,
  checkoutAppointment,
  fetchDoctors,
  fetchDoctorSlots,
  fetchPatients,
  fetchUsers,
  updatePatient,
  fetchPatient,
  type Appointment,
  type AppointmentType,
  type AppointmentStatus,
  type Patient,
} from "@/lib/api";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { extractApiError } from "@/lib/axios-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldLabel } from "@/components/ui/field";
import { PatientFormSheet } from "@/modules/patients/components/patient-form-sheet";
import { AllergySelect } from "@/components/allergy-select";
import {
  Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger,
} from "@/components/ui/sheet";
import { DataTable } from "@/components/data-table/data-table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const CONSULTATION_TYPES = [
  { value: "WALK_IN", label: "Walk-in Registration", fee: 100 },
  { value: "CONSULTATION", label: "Consultation", fee: 300 },
  { value: "SPECIALIST", label: "Specialist Consultation", fee: 500 },
  { value: "EMERGENCY", label: "Emergency Consultation", fee: 800 },
  { value: "FOLLOW_UP", label: "Follow-up Consultation", fee: 150 },
  { value: "TELECONSULTATION", label: "Teleconsultation", fee: 250 },
] as const;

const APPT_STATUSES: AppointmentStatus[] = ["SCHEDULED", "CONFIRMED", "CHECKED_IN", "IN_PROGRESS", "COMPLETED", "CANCELLED", "NO_SHOW"];

const APPT_STATUS_STYLES: Record<string, string> = {
  SCHEDULED: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  CONFIRMED: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  CHECKED_IN: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  IN_PROGRESS: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  COMPLETED: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  CANCELLED: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  NO_SHOW: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

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

interface BookingForm {
  patient: { id: string; name: string; phone: string; isFollowUp: boolean } | null;
  department: string;
  doctorId: string;
  type: string;
  fee: number;
  date: string;
  slot: string | null;
  notes: string;
}

function emptyBookingForm(): BookingForm {
  return { patient: null, department: "", doctorId: "", type: "CONSULTATION", fee: CONSULTATION_TYPES.find((t) => t.value === "CONSULTATION")?.fee ?? 0, date: todayStr(), slot: null, notes: "" };
}

export function AppointmentsPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [filterDoctor, setFilterDoctor] = useState("");
  const [filterDate, setFilterDate] = useState(todayStr());
  const [filterStatus, setFilterStatus] = useState("");
  const [filterCreator, setFilterCreator] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 20 });
  const [statusConfirm, setStatusConfirm] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [patientSheetOpen, setPatientSheetOpen] = useState(false);
  const [form, setForm] = useState<BookingForm>(emptyBookingForm());
  const [patientQuery, setPatientQuery] = useState("");

  // Fetch full patient details when selected (to get allergies)
  const { data: selectedPatient } = useQuery({
    queryKey: ["patient", form.patient?.id],
    queryFn: () => fetchPatient(form.patient!.id),
    enabled: !!form.patient?.id,
  });

  const { data: doctorsResponse } = useQuery({
    queryKey: ["doctors", "appointments-filter"],
    queryFn: () => fetchDoctors({ limit: 100 }),
  });
  const doctors = useMemo(() => doctorsResponse?.data ?? [], [doctorsResponse]);

  const departments = useMemo(() => {
    const s = new Set<string>();
    for (const d of doctors) s.add(d.specialization?.trim() || "General");
    return Array.from(s).sort();
  }, [doctors]);
  const doctorsInDepartment = useMemo(
    () => form.department
      ? doctors.filter((d) => (d.specialization?.trim() || "General") === form.department)
      : [],
    [doctors, form.department],
  );

  const patientResults = useQuery({
    queryKey: ["appointment-patients", patientQuery],
    queryFn: () => fetchPatients({ search: patientQuery, limit: 8 }),
    enabled: patientQuery.trim().length >= 2 && !form.patient,
  });
  const slotsQuery = useQuery({ queryKey: ["doctor-slots", form.doctorId, form.date], queryFn: () => fetchDoctorSlots(form.doctorId, form.date), enabled: !!form.doctorId && !!form.date });

  const { data: usersResponse } = useQuery({
    queryKey: ["users", "appointments-filter"],
    queryFn: () => fetchUsers({ limit: 100 }),
  });
  const users = useMemo(() => usersResponse?.data ?? [], [usersResponse]);

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

  const createMutation = useMutation({
    mutationFn: () => createAppointment({ patientId: form.patient!.id, doctorId: form.doctorId, date: `${form.date}T${form.slot}:00`, type: form.type as AppointmentType, fee: form.fee, notes: form.notes || undefined }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["appointments"] }); queryClient.invalidateQueries({ queryKey: ["doctor-slots", form.doctorId, form.date] }); setSheetOpen(false); setForm(emptyBookingForm()); setPatientQuery(""); toast.success("Appointment booked successfully"); },
    onError: (err) => { toast.error(extractApiError(err)); },
  });
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

  const canBook = !!form.patient && !!form.doctorId && !!form.slot;

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
          {row.original.status.replace("_", " ")}
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
      header: "",
      cell: ({ row }) => {
        const appt = row.original;
        return (
          <div className="flex items-center justify-end gap-1">
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
                  statusMutation.mutate({ id: appt.id, status: value as AppointmentStatus });
                }}
              >
                <SelectTrigger size="sm" className="h-8 text-xs" aria-label="Change appointment status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {APPT_STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>{status.replace("_", " ")}</SelectItem>
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
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Appointments</h1>
          <p className="mt-1 text-sm text-muted-foreground">OPD appointment booking &amp; scheduling</p>
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
        <Sheet open={sheetOpen} onOpenChange={(open) => (open ? setSheetOpen(true) : (setSheetOpen(false), setForm(emptyBookingForm())))}>
          <SheetTrigger asChild><Button onClick={() => setSheetOpen(true)}><Plus className="mr-2 size-4" />New Appointment</Button></SheetTrigger>
          <SheetContent side="right" className="sm:max-w-lg overflow-y-auto">
            <SheetHeader><SheetTitle>New Appointment</SheetTitle><SheetDescription>Register the patient, pick a doctor and slot, then confirm the fee.</SheetDescription></SheetHeader>
            <div className="flex-1 space-y-5 px-4 pb-4">
              <Field><FieldLabel>Patient</FieldLabel>
                {form.patient ? (
                  <div className="space-y-2 rounded-none border px-3 py-2">
                    <div className="flex items-center justify-between">
                      <div><p className="text-sm font-medium">{form.patient.name}</p><p className="text-xs text-muted-foreground">{form.patient.phone}</p></div>
                      <Button variant="ghost" size="icon-sm" aria-label="Clear selected patient" onClick={() => setForm((prev) => ({ ...prev, patient: null }))}><X /></Button>
                    </div>
                    <label htmlFor="a-follow-up" className="flex w-fit items-center gap-2 text-sm">
                      <input
                        id="a-follow-up"
                        type="checkbox"
                        className="size-4"
                        checked={form.patient.isFollowUp}
                        onChange={(e) => {
                          const isFollowUp = e.target.checked;
                          const patientId = form.patient!.id;
                          setForm((prev) => (prev.patient ? { ...prev, patient: { ...prev.patient, isFollowUp } } : prev));
                          followUpMutation.mutate({ id: patientId, isFollowUp });
                        }}
                      />
                      Follow-up patient
                    </label>
                    {/* Patient allergies display */}
                    {selectedPatient && (selectedPatient.allergies?.length > 0 || (selectedPatient.patientAllergies?.length ?? 0) > 0) && (
                      <div className="border-t pt-2 mt-1">
                        <p className="text-xs font-medium text-red-600 dark:text-red-400 flex items-center gap-1 mb-1">
                          <AlertTriangle className="size-3" />
                          Patient Allergies
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {selectedPatient.allergies?.map((a) => (
                            <Badge key={a} variant="outline" className="bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400 text-[10px]">
                              {a}
                            </Badge>
                          ))}
                          {selectedPatient.patientAllergies?.map((pa) => (
                            <Badge key={pa.id} variant="outline" className="bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400 text-[10px]">
                              {pa.allergy.name}
                              {pa.severityOverride && <span className="ml-1 text-[9px] opacity-70">({pa.severityOverride})</span>}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {/* Add allergies to patient */}
                    {selectedPatient && (
                      <div className="border-t pt-2 mt-1">
                        <p className="text-xs font-medium text-muted-foreground mb-1">Manage patient allergies</p>
                        <AllergySelect
                          value={selectedPatient.allergies ?? []}
                          onChange={(allergies) => {
                            updatePatient(form.patient!.id, { allergies });
                            queryClient.invalidateQueries({ queryKey: ["patient", form.patient?.id] });
                          }}
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="relative">
                      <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                      <Input placeholder="Search patient by name or phone" className="pl-9" value={patientQuery} onChange={(e) => setPatientQuery(e.target.value)} />
                      {patientQuery.trim().length >= 2 && (
                        <div className="absolute z-10 mt-1 w-full rounded-none border bg-popover shadow-md">
                          {(patientResults.data?.data ?? []).map((patient) => (
                            <button key={patient.id} type="button" className="flex w-full flex-col items-start px-3 py-2 text-left text-sm hover:bg-muted" onClick={() => { setForm((prev) => ({ ...prev, patient: { id: patient.id, name: patient.name, phone: patient.phone, isFollowUp: patient.isFollowUp } })); setPatientQuery(""); }}>
                              <span className="font-medium">{patient.name}{patient.isFollowUp && <span className="ml-1.5 text-xs font-normal text-blue-600 dark:text-blue-400">(Follow-up)</span>}</span><span className="text-xs text-muted-foreground">{patient.phone}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={() => setPatientSheetOpen(true)}><Plus className="mr-2 size-3.5" />New patient</Button>
                  </div>
                )}
              </Field>
              <Field><FieldLabel htmlFor="a-department">Department</FieldLabel>
                <select id="a-department" className="flex h-9 w-full rounded-none border border-input bg-background px-3 py-1 text-sm" value={form.department} onChange={(e) => { setForm((prev) => ({ ...prev, department: e.target.value, doctorId: "", slot: null })); }}>
                  <option value="">Select a department...</option>{departments.map((dept) => (<option key={dept} value={dept}>{dept}</option>))}
                </select>
              </Field>
              {form.department && (
                <Field><FieldLabel htmlFor="a-doctor">Doctor</FieldLabel>
                  <select id="a-doctor" className="flex h-9 w-full rounded-none border border-input bg-background px-3 py-1 text-sm" value={form.doctorId} onChange={(e) => {
                    const doctorId = e.target.value;
                    const selected = doctorsInDepartment.find((doc) => doc.id === doctorId);
                    setForm((prev) => ({ ...prev, doctorId, slot: null, fee: selected?.consultationFee ? selected.consultationFee : prev.fee }));
                  }}>
                    <option value="">Select a doctor...</option>{doctorsInDepartment.map((d) => (<option key={d.id} value={d.id}>{d.name ?? 'Doctor'}{d.medicalRegistrationNo ? ` (${d.medicalRegistrationNo})` : ''}{d.consultationFee ? ` · ${currency(d.consultationFee)}` : ''}</option>))}
                  </select>
                </Field>
              )}
              {!doctorsInDepartment.find((doc) => doc.id === form.doctorId)?.consultationFee && (
                <Field><FieldLabel>Consultation type</FieldLabel>
                  <div className="grid grid-cols-2 gap-2">
                    {CONSULTATION_TYPES.map((t) => (
                      <button key={t.value} type="button" className={cn("rounded-none border px-3 py-2 text-left text-xs", form.type === t.value ? "border-primary bg-primary/10 text-primary" : "text-muted-foreground")} onClick={() => setForm((prev) => ({ ...prev, type: t.value, fee: t.fee }))}>
                        <p className="font-medium text-foreground">{t.label}</p><p>{currency(t.fee)}</p>
                      </button>
                    ))}
                  </div>
                </Field>
              )}
              <Field><FieldLabel htmlFor="a-fee">Fee</FieldLabel><Input id="a-fee" type="number" min={0} value={form.fee} onChange={(e) => setForm((prev) => ({ ...prev, fee: Number(e.target.value) || 0 }))} /></Field>
              <Field><FieldLabel htmlFor="a-date">Date</FieldLabel><Input id="a-date" type="date" value={form.date} onChange={(e) => setForm((prev) => ({ ...prev, date: e.target.value, slot: null }))} /></Field>
              {form.doctorId && (
                <Field><FieldLabel>Slot</FieldLabel>
                  {slotsQuery.isLoading ? (<p className="text-sm text-muted-foreground">Loading slots...</p>) : !slotsQuery.data?.available ? (<p className="text-sm text-muted-foreground">No slots available for this day.</p>) : (
                    <div className="grid grid-cols-4 gap-2">
                      {slotsQuery.data.slots.map((s) => (
                        <button key={s.time} type="button" disabled={!s.available} className={cn("rounded-none border px-2 py-1.5 text-xs font-medium disabled:cursor-not-allowed disabled:opacity-40", form.slot === s.time ? "border-primary bg-primary/10 text-primary" : "text-muted-foreground")} onClick={() => setForm((prev) => ({ ...prev, slot: s.time }))}>{s.time}</button>
                      ))}
                    </div>
                  )}
                </Field>
              )}
              <Field><FieldLabel htmlFor="a-notes">Notes</FieldLabel><Input id="a-notes" placeholder="Optional" value={form.notes} onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))} /></Field>
            </div>
            <SheetFooter>
              <Button variant="outline" onClick={() => { setSheetOpen(false); setForm(emptyBookingForm()); }}>Cancel</Button>
              <Button onClick={() => createMutation.mutate()} disabled={!canBook || createMutation.isPending}>Book Appointment · {currency(form.fee)}</Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
        </div>
      </div>

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
          <option value="CHECKED_IN">Checked In</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
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
        <div className="ml-auto flex items-center gap-2">
          <Button variant={filterDate === todayStr() ? "default" : "outline"} size="sm" onClick={() => setFilterDateAndResetPage(todayStr())}>Today</Button>
          <Button variant={filterDate === tomorrowStr() ? "default" : "outline"} size="sm" onClick={() => setFilterDateAndResetPage(tomorrowStr())}>Tomorrow</Button>
          <Input type="date" className="w-auto" title={search ? "Date filter is ignored while searching" : undefined} disabled={!!search} value={filterDate} onChange={(e) => setFilterDateAndResetPage(e.target.value)} />
        </div>
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

      <PatientFormSheet open={patientSheetOpen} onOpenChange={setPatientSheetOpen} onSaved={(patient) => setForm((prev) => ({ ...prev, patient: { id: patient.id, name: patient.name, phone: patient.phone, isFollowUp: patient.isFollowUp } }))} />
    </div>
  );
}
