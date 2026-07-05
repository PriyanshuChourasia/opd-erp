import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CalendarClock, Check, ChevronRight, Plus, Search, UserCheck, UserX, X } from "lucide-react";
import { createAppointment, fetchAppointments, fetchDoctorSlots, searchPatients, updateAppointmentStatus } from "../data/api";
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
import { CONSULTATION_TYPES, NEXT_APPT_STATUS, APPT_STATUS_STYLES, currency, todayStr } from "../data/interface";

interface BookingForm { patient: { id: string; name: string; phone: string } | null; department: string; doctorId: string; type: string; fee: number; date: string; slot: string | null; notes: string }

function emptyBookingForm(): BookingForm { return { patient: null, department: "", doctorId: "", type: "CONSULTATION", fee: CONSULTATION_TYPES.find((t) => t.value === "CONSULTATION")?.fee ?? 0, date: todayStr(), slot: null, notes: "" }; }

export function PosAppointmentsPage() {
  const queryClient = useQueryClient();
  const [filterDoctor, setFilterDoctor] = useState("");
  const [filterDate, setFilterDate] = useState(todayStr());
  const [statusConfirm, setStatusConfirm] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [patientSheetOpen, setPatientSheetOpen] = useState(false);
  const [form, setForm] = useState<BookingForm>(emptyBookingForm());
  const [patientQuery, setPatientQuery] = useState("");

  const { data: doctors = [] } = useQuery({ queryKey: ["doctors", ""], queryFn: () => import("@/lib/api").then((m) => m.fetchDoctors()) });
  const departments = useMemo(() => { const s = new Set<string>(); for (const d of doctors) s.add(d.specialization?.trim() || "General"); return Array.from(s).sort(); }, [doctors]);
  const doctorsInDepartment = useMemo(() => doctors.filter((d) => (d.specialization?.trim() || "General") === form.department), [doctors, form.department]);

  const patientResults = useQuery({ queryKey: ["appointment-patients", patientQuery], queryFn: () => searchPatients(patientQuery), enabled: patientQuery.trim().length >= 2 && !form.patient });
  const slotsQuery = useQuery({ queryKey: ["doctor-slots", form.doctorId, form.date], queryFn: () => fetchDoctorSlots(form.doctorId, form.date), enabled: !!form.doctorId && !!form.date });
  const appointmentsQuery = useQuery({ queryKey: ["appointments", filterDoctor, filterDate], queryFn: () => fetchAppointments({ doctorId: filterDoctor || undefined, date: filterDate }), refetchInterval: 15_000 });

  const createMutation = useMutation({
    mutationFn: () => createAppointment({ patientId: form.patient!.id, doctorId: form.doctorId, date: `${form.date}T${form.slot}:00`, type: form.type as any, fee: form.fee, notes: form.notes || undefined }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["appointments"] }); queryClient.invalidateQueries({ queryKey: ["doctor-slots", form.doctorId, form.date] }); setSheetOpen(false); setForm(emptyBookingForm()); setPatientQuery(""); },
  });
  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => updateAppointmentStatus(id, status),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["appointments"] }); setStatusConfirm(null); },
  });

  const canBook = !!form.patient && !!form.doctorId && !!form.slot;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div><h1 className="text-xl font-semibold tracking-tight">Appointments</h1><p className="mt-1 text-sm text-muted-foreground">OPD appointment booking &amp; front-desk billing</p></div>
        <Sheet open={sheetOpen} onOpenChange={(open) => (open ? setSheetOpen(true) : (setSheetOpen(false), setForm(emptyBookingForm())))}>
          <SheetTrigger asChild><Button onClick={() => setSheetOpen(true)}><Plus className="mr-2 size-4" />New Appointment</Button></SheetTrigger>
          <SheetContent side="right" className="sm:max-w-lg overflow-y-auto">
            <SheetHeader><SheetTitle>New Appointment</SheetTitle><SheetDescription>Register the patient, pick a doctor and slot, then confirm the fee.</SheetDescription></SheetHeader>
            <div className="flex-1 space-y-5 px-4 pb-4">
              <Field><FieldLabel>Patient</FieldLabel>
                {form.patient ? (<div className="flex items-center justify-between rounded-none border px-3 py-2"><div><p className="text-sm font-medium">{form.patient.name}</p><p className="text-xs text-muted-foreground">{form.patient.phone}</p></div><Button variant="ghost" size="icon-sm" onClick={() => setForm((prev) => ({ ...prev, patient: null }))}><X /></Button></div>
                ) : (<div className="space-y-2"><div className="relative"><Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input placeholder="Search patient by name or phone" className="pl-9" value={patientQuery} onChange={(e) => setPatientQuery(e.target.value)} />
                  {patientQuery.trim().length >= 2 && (<div className="absolute z-10 mt-1 w-full rounded-none border bg-popover shadow-md">
                    {patientResults.data?.map((patient: any) => (<button key={patient.id} type="button" className="flex w-full flex-col items-start px-3 py-2 text-left text-sm hover:bg-muted" onClick={() => { setForm((prev) => ({ ...prev, patient })); setPatientQuery(""); }}><span className="font-medium">{patient.name}</span><span className="text-xs text-muted-foreground">{patient.phone}</span></button>))}
                  </div>)}</div><Button type="button" variant="outline" size="sm" onClick={() => setPatientSheetOpen(true)}><Plus className="mr-2 size-3.5" />New patient</Button></div>)}
              </Field>
              <Field><FieldLabel htmlFor="a-department">Department</FieldLabel>
                <select id="a-department" className="flex h-9 w-full rounded-none border border-input bg-background px-3 py-1 text-sm" value={form.department} onChange={(e) => { setForm((prev) => ({ ...prev, department: e.target.value, doctorId: "", slot: null })); }}>
                  <option value="">Select a department...</option>{departments.map((dept) => (<option key={dept} value={dept}>{dept}</option>))}
                </select>
              </Field>
              {form.department && (<Field><FieldLabel htmlFor="a-doctor">Doctor</FieldLabel>
                <select id="a-doctor" className="flex h-9 w-full rounded-none border border-input bg-background px-3 py-1 text-sm" value={form.doctorId} onChange={(e) => { setForm((prev) => ({ ...prev, doctorId: e.target.value, slot: null })); }}>
                  <option value="">Select a doctor...</option>{doctorsInDepartment.map((d: any) => (<option key={d.id} value={d.id}>Dr. {d.name}</option>))}
                </select>
              </Field>)}
              <Field><FieldLabel>Consultation type</FieldLabel><div className="grid grid-cols-2 gap-2">{CONSULTATION_TYPES.map((t: any) => (
                <button key={t.value} type="button" className={cn("rounded-none border px-3 py-2 text-left text-xs", form.type === t.value ? "border-primary bg-primary/10 text-primary" : "text-muted-foreground")} onClick={() => setForm((prev) => ({ ...prev, type: t.value, fee: t.fee }))}>
                  <p className="font-medium text-foreground">{t.label}</p><p>{currency(t.fee)}</p>
                </button>
              ))}</div></Field>
              <Field><FieldLabel htmlFor="a-fee">Fee</FieldLabel><Input id="a-fee" type="number" min={0} value={form.fee} onChange={(e) => setForm((prev) => ({ ...prev, fee: Number(e.target.value) || 0 }))} /></Field>
              <Field><FieldLabel htmlFor="a-date">Date</FieldLabel><Input id="a-date" type="date" value={form.date} onChange={(e) => setForm((prev) => ({ ...prev, date: e.target.value, slot: null }))} /></Field>
              {form.doctorId && (<Field><FieldLabel>Slot</FieldLabel>
                {slotsQuery.isLoading ? (<p className="text-sm text-muted-foreground">Loading slots...</p>) : !slotsQuery.data?.available ? (<p className="text-sm text-muted-foreground">No slots available for this day.</p>) : (
                  <div className="grid grid-cols-4 gap-2">{slotsQuery.data.slots.map((s: any) => (
                    <button key={s.time} type="button" disabled={!s.available} className={cn("rounded-none border px-2 py-1.5 text-xs font-medium disabled:cursor-not-allowed disabled:opacity-40", form.slot === s.time ? "border-primary bg-primary/10 text-primary" : "text-muted-foreground")} onClick={() => setForm((prev) => ({ ...prev, slot: s.time }))}>{s.time}</button>
                  ))}</div>
                )}
              </Field>)}
              <Field><FieldLabel htmlFor="a-notes">Notes</FieldLabel><Input id="a-notes" placeholder="Optional" value={form.notes} onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))} /></Field>
            </div>
            <SheetFooter><Button variant="outline" onClick={() => { setSheetOpen(false); setForm(emptyBookingForm()); }}>Cancel</Button><Button onClick={() => createMutation.mutate()} disabled={!canBook || createMutation.isPending}>Book Appointment · {currency(form.fee)}</Button></SheetFooter>
          </SheetContent>
        </Sheet>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button variant={!filterDoctor ? "default" : "outline"} size="sm" onClick={() => setFilterDoctor("")}>All doctors</Button>
        {doctors.map((d: any) => (<Button key={d.id} variant={filterDoctor === d.id ? "default" : "outline"} size="sm" onClick={() => setFilterDoctor(d.id)}>Dr. {d.name}</Button>))}
        <Input type="date" className="ml-auto w-auto" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} />
      </div>

      <Card><CardHeader className="pb-3"><CardTitle className="text-base">Current Appointments</CardTitle></CardHeader>
        <CardContent className="p-0">{appointmentsQuery.isLoading ? (
          <div className="flex justify-center py-12"><span className="text-sm text-muted-foreground">Loading...</span></div>
        ) : (appointmentsQuery.data ?? []).length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-12 text-center"><CalendarClock className="size-8 text-muted-foreground/50" /><p className="text-sm text-muted-foreground">No appointments for this day</p></div>
        ) : (
          <div className="divide-y">{(appointmentsQuery.data ?? []).map((appt: any) => (
            <div key={appt.id} className="flex items-center gap-4 px-6 py-4 transition-colors hover:bg-muted/30">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-bold text-muted-foreground">{appt.tokenNumber ? `#${appt.tokenNumber}` : "—"}</span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2"><p className="text-sm font-medium">{appt.patient.name}</p><Badge variant="outline" className={`text-[10px] ${APPT_STATUS_STYLES[appt.status] ?? ""}`}>{appt.status.replace("_", " ")}</Badge></div>
                <p className="mt-0.5 text-xs text-muted-foreground">Dr. {appt.doctor.name} · {appt.type.replace("_", " ")} · {new Date(appt.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} · {currency(appt.fee)}</p>
              </div>
              <div className="flex items-center gap-1">
                {NEXT_APPT_STATUS[appt.status] && (<Button variant="ghost" size="icon" className="size-8" title={`Move to ${NEXT_APPT_STATUS[appt.status]}`} onClick={() => statusMutation.mutate({ id: appt.id, status: NEXT_APPT_STATUS[appt.status]! })}>
                  {NEXT_APPT_STATUS[appt.status] === "COMPLETED" ? <Check className="size-4 text-green-600" /> : NEXT_APPT_STATUS[appt.status] === "CHECKED_IN" ? <UserCheck className="size-4 text-blue-600" /> : <ChevronRight className="size-4" />}
                </Button>)}
                {(appt.status === "SCHEDULED" || appt.status === "CONFIRMED") && (<Button variant="ghost" size="icon" className="size-8" title="No show" onClick={() => statusMutation.mutate({ id: appt.id, status: "NO_SHOW" })}><UserX className="size-4 text-red-500" /></Button>)}
                {appt.status !== "COMPLETED" && appt.status !== "CANCELLED" && appt.status !== "NO_SHOW" && (statusConfirm === appt.id ? (
                  <div className="flex items-center gap-1"><Button variant="destructive" size="sm" className="h-8 text-xs" onClick={() => statusMutation.mutate({ id: appt.id, status: "CANCELLED" })}>Cancel</Button><Button variant="ghost" size="icon" className="size-8" onClick={() => setStatusConfirm(null)}><X className="size-3.5" /></Button></div>
                ) : (<Button variant="ghost" size="icon" className="size-8 text-destructive hover:text-destructive" title="Cancel" onClick={() => setStatusConfirm(appt.id)}><X className="size-3.5" /></Button>))}
              </div>
            </div>
          ))}</div>
        )}</CardContent>
      </Card>

      <PatientFormSheet open={patientSheetOpen} onOpenChange={setPatientSheetOpen} onSaved={(patient: any) => setForm((prev) => ({ ...prev, patient }))} />
    </div>
  );
}
