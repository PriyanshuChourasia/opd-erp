import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef, PaginationState } from "@tanstack/react-table";
import { CalendarClock, Check, ChevronRight, Plus, Search, UserCheck, UserX, X } from "lucide-react";
import {
  fetchAppointments,
  createAppointment,
  updateAppointmentStatus,
  fetchDoctors,
  fetchDoctorSlots,
  fetchPatients,
  type Appointment,
  type AppointmentType,
  type AppointmentStatus,
} from "@/lib/api";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldLabel } from "@/components/ui/field";
import { PatientFormSheet } from "@/modules/patients/components/patient-form-sheet";
import {
  Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger,
} from "@/components/ui/sheet";
import { DataTable } from "@/components/data-table/data-table";

const CONSULTATION_TYPES = [
  { value: "WALK_IN", label: "Walk-in Registration", fee: 100 },
  { value: "CONSULTATION", label: "Consultation", fee: 300 },
  { value: "SPECIALIST", label: "Specialist Consultation", fee: 500 },
  { value: "EMERGENCY", label: "Emergency Consultation", fee: 800 },
  { value: "FOLLOW_UP", label: "Follow-up Consultation", fee: 150 },
  { value: "TELECONSULTATION", label: "Teleconsultation", fee: 250 },
] as const;

const NEXT_APPT_STATUS: Record<string, AppointmentStatus | null> = {
  SCHEDULED: "CONFIRMED", CONFIRMED: "CHECKED_IN", CHECKED_IN: "IN_PROGRESS", IN_PROGRESS: "COMPLETED", COMPLETED: null, CANCELLED: null, NO_SHOW: null,
};

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

interface BookingForm {
  patient: { id: string; name: string; phone: string } | null;
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
  const [filterDoctor, setFilterDoctor] = useState("");
  const [filterDate, setFilterDate] = useState(todayStr());
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 20 });
  const [statusConfirm, setStatusConfirm] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [patientSheetOpen, setPatientSheetOpen] = useState(false);
  const [form, setForm] = useState<BookingForm>(emptyBookingForm());
  const [patientQuery, setPatientQuery] = useState("");

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
  const doctorsInDepartment = useMemo(() => doctors.filter((d) => (d.specialization?.trim() || "General") === form.department), [doctors, form.department]);

  const patientResults = useQuery({
    queryKey: ["appointment-patients", patientQuery],
    queryFn: () => fetchPatients({ search: patientQuery, limit: 8 }),
    enabled: patientQuery.trim().length >= 2 && !form.patient,
  });
  const slotsQuery = useQuery({ queryKey: ["doctor-slots", form.doctorId, form.date], queryFn: () => fetchDoctorSlots(form.doctorId, form.date), enabled: !!form.doctorId && !!form.date });

  const { data: appointmentsResponse, isLoading } = useQuery({
    queryKey: ["appointments", filterDoctor, filterDate, pagination.pageIndex, pagination.pageSize],
    queryFn: () => fetchAppointments({
      doctorId: filterDoctor || undefined,
      date: filterDate || undefined,
      page: pagination.pageIndex + 1,
      limit: pagination.pageSize,
    }),
    placeholderData: (previous) => previous,
    refetchInterval: 15_000,
  });
  const appointments = appointmentsResponse?.data ?? [];
  const pageCount = appointmentsResponse?.meta.totalPages ?? 0;

  const createMutation = useMutation({
    mutationFn: () => createAppointment({ patientId: form.patient!.id, doctorId: form.doctorId, date: `${form.date}T${form.slot}:00`, type: form.type as AppointmentType, fee: form.fee, notes: form.notes || undefined }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["appointments"] }); queryClient.invalidateQueries({ queryKey: ["doctor-slots", form.doctorId, form.date] }); setSheetOpen(false); setForm(emptyBookingForm()); setPatientQuery(""); },
  });
  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: AppointmentStatus }) => updateAppointmentStatus(id, status),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["appointments"] }); setStatusConfirm(null); },
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
      cell: ({ row }) => <span className="text-sm">{row.original.doctor?.medicalRegistrationNo ?? 'Doctor'}</span>,
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
        const next = NEXT_APPT_STATUS[appt.status];
        return (
          <div className="flex justify-end gap-1">
            {next && (
              <Button variant="ghost" size="icon" className="size-8" title={`Move to ${next}`} onClick={() => statusMutation.mutate({ id: appt.id, status: next })}>
                {next === "COMPLETED" ? <Check className="size-4 text-green-600" /> : next === "CHECKED_IN" ? <UserCheck className="size-4 text-blue-600" /> : <ChevronRight className="size-4" />}
              </Button>
            )}
            {(appt.status === "SCHEDULED" || appt.status === "CONFIRMED") && (
              <Button variant="ghost" size="icon" className="size-8" title="No show" onClick={() => statusMutation.mutate({ id: appt.id, status: "NO_SHOW" })}>
                <UserX className="size-4 text-red-500" />
              </Button>
            )}
            {appt.status !== "COMPLETED" && appt.status !== "CANCELLED" && appt.status !== "NO_SHOW" && (
              statusConfirm === appt.id ? (
                <div className="flex items-center gap-1">
                  <Button variant="destructive" size="sm" className="h-8 text-xs" onClick={() => statusMutation.mutate({ id: appt.id, status: "CANCELLED" })}>Cancel</Button>
                  <Button variant="ghost" size="icon" className="size-8" onClick={() => setStatusConfirm(null)}><X className="size-3.5" /></Button>
                </div>
              ) : (
                <Button variant="ghost" size="icon" className="size-8 text-destructive hover:text-destructive" title="Cancel" onClick={() => setStatusConfirm(appt.id)}><X className="size-3.5" /></Button>
              )
            )}
          </div>
        );
      },
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [statusConfirm]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Appointments</h1>
          <p className="mt-1 text-sm text-muted-foreground">OPD appointment booking &amp; scheduling</p>
        </div>
        <Sheet open={sheetOpen} onOpenChange={(open) => (open ? setSheetOpen(true) : (setSheetOpen(false), setForm(emptyBookingForm())))}>
          <SheetTrigger asChild><Button onClick={() => setSheetOpen(true)}><Plus className="mr-2 size-4" />New Appointment</Button></SheetTrigger>
          <SheetContent side="right" className="sm:max-w-lg overflow-y-auto">
            <SheetHeader><SheetTitle>New Appointment</SheetTitle><SheetDescription>Register the patient, pick a doctor and slot, then confirm the fee.</SheetDescription></SheetHeader>
            <div className="flex-1 space-y-5 px-4 pb-4">
              <Field><FieldLabel>Patient</FieldLabel>
                {form.patient ? (
                  <div className="flex items-center justify-between rounded-none border px-3 py-2">
                    <div><p className="text-sm font-medium">{form.patient.name}</p><p className="text-xs text-muted-foreground">{form.patient.phone}</p></div>
                    <Button variant="ghost" size="icon-sm" onClick={() => setForm((prev) => ({ ...prev, patient: null }))}><X /></Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="relative">
                      <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                      <Input placeholder="Search patient by name or phone" className="pl-9" value={patientQuery} onChange={(e) => setPatientQuery(e.target.value)} />
                      {patientQuery.trim().length >= 2 && (
                        <div className="absolute z-10 mt-1 w-full rounded-none border bg-popover shadow-md">
                          {(patientResults.data?.data ?? []).map((patient) => (
                            <button key={patient.id} type="button" className="flex w-full flex-col items-start px-3 py-2 text-left text-sm hover:bg-muted" onClick={() => { setForm((prev) => ({ ...prev, patient: { id: patient.id, name: patient.name, phone: patient.phone } })); setPatientQuery(""); }}>
                              <span className="font-medium">{patient.name}</span><span className="text-xs text-muted-foreground">{patient.phone}</span>
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
                  <select id="a-doctor" className="flex h-9 w-full rounded-none border border-input bg-background px-3 py-1 text-sm" value={form.doctorId} onChange={(e) => { setForm((prev) => ({ ...prev, doctorId: e.target.value, slot: null })); }}>
                    <option value="">Select a doctor...</option>{doctorsInDepartment.map((d) => (<option key={d.id} value={d.id}>{d.medicalRegistrationNo ?? 'Doctor'}</option>))}
                  </select>
                </Field>
              )}
              <Field><FieldLabel>Consultation type</FieldLabel>
                <div className="grid grid-cols-2 gap-2">
                  {CONSULTATION_TYPES.map((t) => (
                    <button key={t.value} type="button" className={cn("rounded-none border px-3 py-2 text-left text-xs", form.type === t.value ? "border-primary bg-primary/10 text-primary" : "text-muted-foreground")} onClick={() => setForm((prev) => ({ ...prev, type: t.value, fee: t.fee }))}>
                      <p className="font-medium text-foreground">{t.label}</p><p>{currency(t.fee)}</p>
                    </button>
                  ))}
                </div>
              </Field>
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

      <div className="flex flex-wrap items-center gap-2">
        <Button variant={!filterDoctor ? "default" : "outline"} size="sm" onClick={() => setFilterDoctorAndResetPage("")}>All doctors</Button>
        {doctors.map((d) => (<Button key={d.id} variant={filterDoctor === d.id ? "default" : "outline"} size="sm" onClick={() => setFilterDoctorAndResetPage(d.id)}>{d.medicalRegistrationNo ?? 'Doctor'}</Button>))}
        <Input type="date" className="ml-auto w-auto" value={filterDate} onChange={(e) => setFilterDateAndResetPage(e.target.value)} />
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

      <PatientFormSheet open={patientSheetOpen} onOpenChange={setPatientSheetOpen} onSaved={(patient) => setForm((prev) => ({ ...prev, patient: { id: patient.id, name: patient.name, phone: patient.phone } }))} />
    </div>
  );
}
