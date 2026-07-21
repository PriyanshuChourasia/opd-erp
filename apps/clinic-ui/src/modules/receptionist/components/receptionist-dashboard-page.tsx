import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { CalendarClock, ClipboardList, Clock, History, ListOrdered, Pencil, Plus, Receipt, Search, Stethoscope, Users, X } from "lucide-react";
import {
  fetchDoctors,
  fetchDoctorSlots,
  fetchPatients,
  createPatient,
  createDoctorWithUser,
  checkoutAppointment,
  fetchAppointments,
  fetchOrganisation,
  createAppointment,
  fetchQueue,
  fetchEmployeeSchedules,
  type Doctor,
  type Appointment,
  type AppointmentType,
  type QueueEntry,
  type CreateDoctorWithUserInput,
} from "@/lib/api";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { extractApiError } from "@/lib/axios-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldLabel } from "@/components/ui/field";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { PatientFormSheet } from "@/modules/patients/components/patient-form-sheet";
import { AllergySelect } from "@/components/allergy-select";
import { PaymentSheet, type PaymentPayload } from "@/components/payment-sheet";
import { useDashboardStats } from "@/modules/dashboard/data/hooks";
import { STATUS_STYLES } from "../../queue/data/interface";

const CONSULTATION_TYPES = [
  { value: "WALK_IN", label: "Walk-in", color: "bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-800 dark:text-gray-400" },
  { value: "CONSULTATION", label: "Consultation", color: "bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/30 dark:text-blue-400" },
  { value: "SPECIALIST", label: "Specialist", color: "bg-purple-100 text-purple-700 border-purple-300 dark:bg-purple-900/30 dark:text-purple-400" },
  { value: "EMERGENCY", label: "Emergency", color: "bg-red-100 text-red-700 border-red-300 dark:bg-red-900/30 dark:text-red-400" },
  { value: "FOLLOW_UP", label: "Follow-up", color: "bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/30 dark:text-amber-400" },
  { value: "TELECONSULTATION", label: "Teleconsult", color: "bg-teal-100 text-teal-700 border-teal-300 dark:bg-teal-900/30 dark:text-teal-400" },
] as const;

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
function dayAfterTomorrowStr() {
  const d = new Date();
  d.setDate(d.getDate() + 2);
  const offset = d.getTimezoneOffset();
  return new Date(d.getTime() - offset * 60_000).toISOString().slice(0, 10);
}
function twoDaysLaterStr() {
  const d = new Date();
  d.setDate(d.getDate() + 3);
  const offset = d.getTimezoneOffset();
  return new Date(d.getTime() - offset * 60_000).toISOString().slice(0, 10);
}

function currency(value: number) { return `₹${value.toFixed(2)}`; }

const APPT_STATUS_STYLES: Record<string, string> = {
  SCHEDULED: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  CONFIRMED: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  CHECKED_IN: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  IN_PROGRESS: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  COMPLETED: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  CANCELLED: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  NO_SHOW: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

const statTiles = [
  { key: "todayAppointments", label: "Today's appointments", icon: CalendarClock },
  { key: "patientsInQueue", label: "Patients in queue", icon: ListOrdered },
  { key: "registeredPatients", label: "Registered patients", icon: Users },
  { key: "pendingPrescriptions", label: "Pending prescriptions", icon: ClipboardList },
  { key: "todayRevenue", label: "Today's revenue", icon: Receipt },
] as const;

interface BookingForm {
  patient: { id: string; name: string; phone: string } | null;
  type: string;
  doctorId: string;
  fee: number;
  registrationFee: number | null;
  date: string;
  slot: string | null;
  notes: string;
  allergies: string[];
}

function emptyForm(): BookingForm {
  return { patient: null, type: "WALK_IN", doctorId: "", fee: 100, registrationFee: null, date: todayStr(), slot: null, notes: "", allergies: [] };
}

export function ReceptionistDashboardPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const statsQuery = useDashboardStats();
  const stats = statsQuery.data;

  const { data: todayAppointmentsData, isLoading: loadingAppts } = useQuery({
    queryKey: ["dashboard-today-appointments"],
    queryFn: () => fetchAppointments({ date: todayStr(), limit: 10 }),
    refetchInterval: 15_000,
  });
  const todayAppointmentsList = useMemo(() => todayAppointmentsData?.data ?? [], [todayAppointmentsData]);
  const displayAppts = useMemo(() => todayAppointmentsList.slice(0, 8), [todayAppointmentsList]);
  const apptsTotalFee = useMemo(() => displayAppts.reduce((sum, a) => sum + a.fee, 0), [displayAppts]);
  const apptsTotalReg = useMemo(() => displayAppts.reduce((sum, a) => sum + a.registrationFee, 0), [displayAppts]);

  const { data: todayQueueData, isLoading: loadingQueue } = useQuery({
    queryKey: ["dashboard-today-queue"],
    queryFn: () => fetchQueue({ limit: 10 }),
    refetchInterval: 15_000,
  });
  const todayQueueList = useMemo(() => todayQueueData?.data ?? [], [todayQueueData]);
  const displayQueue = useMemo(() => todayQueueList.slice(0, 8), [todayQueueList]);
  const queueWaiting = useMemo(() => displayQueue.filter((e) => e.status === "WAITING").length, [displayQueue]);
  const queueInProgress = useMemo(() => displayQueue.filter((e) => e.status === "IN_PROGRESS").length, [displayQueue]);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [form, setForm] = useState<BookingForm>(emptyForm());
  const [patientQuery, setPatientQuery] = useState("");
  const [editPatientId, setEditPatientId] = useState<string | null>(null);
  const [doctorSearchQuery, setDoctorSearchQuery] = useState("");
  const [doctorSearchOpen, setDoctorSearchOpen] = useState(false);
  const [doctorFormOpen, setDoctorFormOpen] = useState(false);
  const [paymentSheetOpen, setPaymentSheetOpen] = useState(false);
  const [newDoctorForm, setNewDoctorForm] = useState<{
    firstName: string;
    lastName: string;
    email: string;
    username: string;
    password: string;
    medicalRegistrationNo: string;
    specialization: string;
    consultationFee: number;
  }>({
    firstName: "",
    lastName: "",
    email: "",
    username: "",
    password: "",
    medicalRegistrationNo: "",
    specialization: "",
    consultationFee: 0,
  });
  const [newPatientName, setNewPatientName] = useState("");
  const [newPatientPhone, setNewPatientPhone] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const createPatientMutation = useMutation({
    mutationFn: (data: { name: string; phone: string; email?: string }) => createPatient(data),
    onSuccess: (patient: any) => {
      const saved = patient?.data ?? patient;
      setForm((prev) => ({ ...prev, patient: { id: saved.id, name: saved.name, phone: saved.phone }, registrationFee: null }));
      setShowRegisterForm(false);
      setNewPatientName("");
      setNewPatientPhone("");
      setRegisterEmail("");
      setPatientQuery("");
      queryClient.invalidateQueries({ queryKey: ["booking-patients"] });
      toast.success("Patient registered successfully");
    },
    onError: (err) => { toast.error(extractApiError(err)); },
  });

  const createDoctorMutation = useMutation({
    mutationFn: (input: CreateDoctorWithUserInput) => createDoctorWithUser(input),
    onSuccess: (result: any) => {
      const doctor = result?.data ?? result?.doctor ?? result;
      setForm((prev) => ({ ...prev, doctorId: doctor.id, slot: null, fee: doctor.consultationFee ?? prev.fee }));
      setDoctorFormOpen(false);
      setNewDoctorForm({ firstName: "", lastName: "", email: "", username: "", password: "", medicalRegistrationNo: "", specialization: "", consultationFee: 0 });
      queryClient.invalidateQueries({ queryKey: ["doctors"] });
      queryClient.invalidateQueries({ queryKey: ["employee-schedules"] });
      toast.success("Doctor created and selected");
    },
    onError: (err) => { toast.error(extractApiError(err)); },
  });

  const { data: doctorsResponse } = useQuery({
    queryKey: ["doctors", "booking"],
    queryFn: () => fetchDoctors({ limit: 100 }),
  });
  const doctors = doctorsResponse?.data ?? [];

  // Fetch all doctor schedules to show times in the dropdown
  const { data: allSchedules = [] } = useQuery({
    queryKey: ["employee-schedules", "search-doctors"],
    queryFn: async () => {
      const results = await Promise.all(
        doctors.map((d) => fetchEmployeeSchedules("Doctor", d.id).catch(() => []))
      );
      return results.flat();
    },
    enabled: doctors.length > 0,
  });

  // Build a schedule map for the selected date
  const doctorScheduleMap = useMemo(() => {
    if (!form.date) return new Map<string, { startTime: string; endTime: string }>();
    const dateObj = new Date(form.date + "T00:00:00");
    const dayOfWeek = (dateObj.getDay() + 6) % 7;
    const map = new Map<string, { startTime: string; endTime: string }>();
    for (const sched of allSchedules) {
      if (sched.dayOfWeek === dayOfWeek) {
        map.set(sched.employeeSchedulableId, { startTime: sched.startTime, endTime: sched.endTime });
      }
    }
    return map;
  }, [allSchedules, form.date]);

  // Slots for the selected doctor + date
  const slotsQuery = useQuery({
    queryKey: ["doctor-slots", form.doctorId, form.date],
    queryFn: () => fetchDoctorSlots(form.doctorId, form.date),
    enabled: !!form.doctorId && !!form.date,
  });

  const patientResults = useQuery({
    queryKey: ["booking-patients", patientQuery],
    queryFn: () => fetchPatients({ search: patientQuery, limit: 8 }),
    enabled: patientQuery.trim().length >= 1 && !form.patient,
  });

  const patientHistory = useQuery({
    queryKey: ["patient-history", form.patient?.id],
    queryFn: () => fetchAppointments({ patientId: form.patient!.id, page: 1, limit: 10 }),
    enabled: !!form.patient,
  });

  const { data: organisation } = useQuery({
    queryKey: ["organisation"],
    queryFn: fetchOrganisation,
  });

  const pastAppointments = (patientHistory.data?.data ?? []).filter((a) => a.status === "COMPLETED");
  const hasHistory = pastAppointments.length > 0;
  const defaultRegistrationFee = organisation?.registrationFee ?? 0;
  const autoRegistrationFee = defaultRegistrationFee;
  const regFeeAmount = form.registrationFee ?? autoRegistrationFee;

  const selectedType = CONSULTATION_TYPES.find((t) => t.value === form.type);

  const createMutation = useMutation({
    mutationFn: () => createAppointment({
      patientId: form.patient!.id,
      doctorId: form.doctorId,
      date: `${form.date}T${form.slot || "09:00"}:00`,
      type: form.type as AppointmentType,
      fee: form.fee,
      ...(form.registrationFee !== null ? { registrationFee: form.registrationFee } : {}),
      notes: form.notes || undefined,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      queryClient.invalidateQueries({ queryKey: ["doctor-slots"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      setSheetOpen(false);
      setForm(emptyForm());
      setPatientQuery("");
      toast.success("Appointment booked successfully");
    },
    onError: (err) => toast.error(extractApiError(err)),
  });

  const bookAndPayMutation = useMutation({
    mutationFn: async (payload: PaymentPayload) => {
      const appointment = await createAppointment({
        patientId: form.patient!.id,
        doctorId: form.doctorId,
        date: `${form.date}T${form.slot || "09:00"}:00`,
        type: form.type as AppointmentType,
        fee: form.fee,
        ...(form.registrationFee !== null ? { registrationFee: form.registrationFee } : {}),
        notes: form.notes || undefined,
      });
      await checkoutAppointment(appointment.id, {
        paymentMethod: payload.paymentMethod,
        discount: payload.discount > 0 ? payload.discount : undefined,
        tax: payload.tax > 0 ? payload.tax : undefined,
        notes: payload.notes || undefined,
      });
      return appointment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      queryClient.invalidateQueries({ queryKey: ["doctor-slots"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["billing"] });
      setPaymentSheetOpen(false);
      setSheetOpen(false);
      setForm(emptyForm());
      setPatientQuery("");
      toast.success("Appointment booked and paid successfully");
    },
    onError: (err) => toast.error(extractApiError(err)),
  });

  function openSheet() { setForm(emptyForm()); setPatientQuery(""); setSheetOpen(true); }

  // Only patient name, phone & doctor are required
  const canBook = !!form.patient?.name.trim() && !!form.patient?.phone.trim() && !!form.doctorId;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Receptionist Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">Quick overview of clinic activity</p>
        </div>
        <Sheet open={sheetOpen} onOpenChange={(open) => { if (open) openSheet(); else setSheetOpen(false); }}>
          <SheetTrigger asChild>
            <Button onClick={openSheet}><Plus className="mr-2 size-4" />Book Appointment</Button>
          </SheetTrigger>
          <SheetContent side="right" className="sm:max-w-xl overflow-y-auto">
            <SheetHeader>
              <SheetTitle>New Appointment</SheetTitle>
              <SheetDescription>Patient details and doctor are required. Slot is optional.</SheetDescription>
            </SheetHeader>
            <div className="flex-1 space-y-5 px-4 pb-4">
              {/* ── Patient (REQUIRED) ── */}
              <Field>
                <FieldLabel>Patient *</FieldLabel>
                {form.patient ? (
                  <div className="flex items-center justify-between rounded-none border px-3 py-2">
                    <div>
                      <p className="text-sm font-medium">{form.patient.name}</p>
                      <p className="text-xs text-muted-foreground">{form.patient.phone}</p>
                    </div>
                    <Button variant="ghost" size="icon-sm" title="Clear patient" onClick={() => setForm((p) => ({ ...p, patient: null, registrationFee: null }))}><X className="size-4" /></Button>
                  </div>
                ) : (
                  <div className="relative">
                    <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input placeholder="Search by name or phone" className="pl-9" value={patientQuery} onChange={(e) => setPatientQuery(e.target.value)} />
                    {patientQuery.trim().length >= 1 && (
                      <div className="absolute z-10 mt-1 w-full rounded-none border bg-popover shadow-md max-h-64 overflow-y-auto">
                        {patientResults.isLoading && <p className="px-3 py-2 text-xs text-muted-foreground">Searching...</p>}
                        {!patientResults.isLoading && (patientResults.data?.data ?? []).length === 0 && (
                          <p className="px-3 py-2 text-xs text-muted-foreground">No patients found</p>
                        )}
                        {(patientResults.data?.data ?? []).map((p) => (
                          <div key={p.id} className="group flex items-center px-3 py-1.5 text-sm hover:bg-muted">
                            <button
                              type="button"
                              className="flex flex-1 flex-col items-start py-0.5 text-left"
                              onClick={() => { setForm((prev) => ({ ...prev, patient: { id: p.id, name: p.name, phone: p.phone }, registrationFee: null })); setPatientQuery(""); }}
                            >
                              <span className="font-medium">{p.name}</span>
                              <span className="text-xs text-muted-foreground">{p.phone}</span>
                            </button>
                            <button
                              type="button"
                              className="shrink-0 rounded p-1 text-muted-foreground opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100"
                              title="Edit patient"
                              onMouseDown={() => setEditPatientId(p.id)}
                            >
                              <Pencil className="size-3.5" />
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          className="flex w-full items-center justify-center gap-2 border-t px-3 py-2 text-sm font-medium text-primary hover:bg-muted transition-colors"
                          onClick={() => { setNewPatientName(patientQuery.trim()); setNewPatientPhone(""); setRegisterEmail(""); setShowRegisterForm(true); }}
                        >
                          <Plus className="size-4" /> Register Patient
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </Field>

              {/* ── Inline Register Patient ── */}
              {showRegisterForm && (
                <div className="rounded-none border-2 border-teal-400 bg-teal-50 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-teal-800">+ Register New Patient</p>
                    <Button variant="ghost" size="icon-sm" title="Close" onClick={() => setShowRegisterForm(false)}>
                      <X className="size-4" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-teal-700">Full Name *</label>
                      <Input
                        className="border-teal-300 bg-white focus-visible:ring-teal-500"
                        placeholder="Jane Doe"
                        value={newPatientName}
                        onChange={(e) => setNewPatientName(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-teal-700">Phone *</label>
                      <Input
                        className="border-teal-300 bg-white focus-visible:ring-teal-500"
                        placeholder="+1 555-000-0000"
                        value={newPatientPhone}
                        onChange={(e) => setNewPatientPhone(e.target.value)}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-teal-700">Email</label>
                    <Input
                      className="border-teal-300 bg-white focus-visible:ring-teal-500"
                      type="email"
                      placeholder="jane@example.com"
                      value={registerEmail}
                      onChange={(e) => setRegisterEmail(e.target.value)}
                    />
                  </div>
                  <div className="flex items-center justify-between border-t border-teal-200 pt-3">
                    <p className="text-[11px] text-teal-600">
                      Name &amp; phone are required. Email is optional.
                    </p>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => setShowRegisterForm(false)}>
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        className="bg-teal-600 text-white hover:bg-teal-700"
                        disabled={!newPatientName.trim() || !newPatientPhone.trim() || createPatientMutation.isPending}
                        onClick={() => createPatientMutation.mutate({ name: newPatientName.trim(), phone: newPatientPhone.trim(), email: registerEmail.trim() || undefined })}
                      >
                        {createPatientMutation.isPending ? "Saving..." : "Save & Select"}
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Date ── */}
              <Field><FieldLabel htmlFor="r-date">Date</FieldLabel>
                <Input
                  id="r-date"
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm((p) => ({ ...p, date: e.target.value, department: "", doctorId: "", slot: null }))}
                />
                <div className="mt-1.5 flex gap-1.5">
                  {[
                    { label: new Date(tomorrowStr()).getDate().toString(), value: tomorrowStr() },
                    { label: new Date(dayAfterTomorrowStr()).getDate().toString(), value: dayAfterTomorrowStr() },
                    { label: new Date(twoDaysLaterStr()).getDate().toString(), value: twoDaysLaterStr() },
                  ].map(({ label, value }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setForm((p) => ({ ...p, date: value, department: "", doctorId: "", slot: null }))}
                      className={cn(
                        "rounded-none border px-2.5 py-1 text-[11px] font-medium transition-colors",
                        form.date === value
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-input text-muted-foreground hover:border-primary/50 hover:text-foreground"
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </Field>

              {/* ── Allergies (optional) ── */}
              <Field><FieldLabel>Allergies</FieldLabel>
                <AllergySelect
                  value={form.allergies}
                  onChange={(allergies) => setForm((p) => ({ ...p, allergies }))}
                />
              </Field>

              {/* ── Patient History (shown when patient selected) ── */}
              {form.patient && (
                <div className="rounded-none border p-3 space-y-2">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <History className="size-3.5" />
                    <span>Visit history for {form.patient.name}</span>
                  </div>
                  {patientHistory.isLoading ? (
                    <div className="space-y-1.5">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}</div>
                  ) : !hasHistory ? (
                    <div className="space-y-1.5 py-2">
                      <p className="text-xs text-muted-foreground">No previous visits — this is a new patient. Consider "Walk-in" or "Consultation" type.</p>

                    </div>
                  ) : (
                    <>
                      <div className="flex flex-wrap gap-1.5">
                        {pastAppointments.slice(0, 5).map((appt) => (
                          <div key={appt.id} className="flex items-center gap-1.5 rounded-none border px-2 py-1 text-[10px]">
                            <span className="font-medium">{appt.type.replace("_", " ")}</span>
                            <span className="text-muted-foreground">·</span>
                            <span>{appt.doctor?.name ?? appt.doctor?.medicalRegistrationNo}</span>
                            <span className="text-muted-foreground">·</span>
                            <span>{new Date(appt.date).toLocaleDateString()}</span>
                          </div>
                        ))}
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        {pastAppointments.length} completed visit{pastAppointments.length !== 1 ? "s" : ""} — if this is a continuation, select <span className="font-medium">Follow-up</span>.
                      </p>
                    </>
                  )}
                </div>
              )}

              {/* ── Doctor * (search & select) ── */}
              <Field>
                <FieldLabel>Doctor *</FieldLabel>
                {form.doctorId ? (
                  <div className="flex items-center justify-between rounded-none border px-3 py-2">
                    <div className="flex items-center gap-2">
                      <Stethoscope className="size-4 text-primary" />
                      <div>
                        <p className="text-sm font-medium">{(doctors.find((d) => d.id === form.doctorId)?.name ?? "Doctor")}</p>
                        <p className="text-xs text-muted-foreground">
                          {doctors.find((d) => d.id === form.doctorId)?.specialization}
                          {doctors.find((d) => d.id === form.doctorId)?.consultationFee ? ` · ${currency(doctors.find((d) => d.id === form.doctorId)!.consultationFee)}` : ""}
                        </p>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon-sm" title="Clear doctor" onClick={() => setForm((p) => ({ ...p, doctorId: "", slot: null, fee: 0 }))}>
                      <X className="size-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="relative">
                    <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search doctor by name or specialization..."
                      className="pl-9"
                      value={doctorSearchQuery}
                      onChange={(e) => { setDoctorSearchQuery(e.target.value); setDoctorSearchOpen(true); }}
                      onFocus={() => setDoctorSearchOpen(true)}
                      onBlur={() => setTimeout(() => setDoctorSearchOpen(false), 200)}
                    />
                    {doctorSearchOpen && (
                      <div className="absolute z-50 mt-1 w-full rounded-none border bg-popover shadow-md max-h-56 overflow-y-auto">
                        {doctors
                          .filter((d) =>
                            !doctorSearchQuery.trim() ||
                            (d.name ?? d.medicalRegistrationNo ?? "").toLowerCase().includes(doctorSearchQuery.trim().toLowerCase()) ||
                            (d.specialization ?? "").toLowerCase().includes(doctorSearchQuery.trim().toLowerCase())
                          )
                          .map((d) => {
                            const schedule = doctorScheduleMap.get(d.id);
                            return (
                              <button
                                key={d.id}
                                type="button"
                                className="flex w-full flex-col items-start px-3 py-2 text-left text-sm hover:bg-muted"
                                onMouseDown={() => {
                                  setForm((prev) => ({ ...prev, doctorId: d.id, slot: null, fee: d.consultationFee ?? prev.fee }));
                                  setDoctorSearchQuery("");
                                  setDoctorSearchOpen(false);
                                }}
                              >
                                <span className="font-medium">{d.name ?? d.medicalRegistrationNo ?? "Doctor"}</span>
                                <span className="text-xs text-muted-foreground">
                                  {d.specialization}
                                  {d.consultationFee ? ` · ${currency(d.consultationFee)}` : ""}
                                </span>
                                {schedule && (
                                  <span className="mt-1 inline-flex items-center gap-1 rounded-none border border-primary/20 bg-primary/5 px-1.5 py-0.5 text-[11px] font-semibold font-mono text-primary">
                                    <Clock className="size-3" />
                                    {schedule.startTime} – {schedule.endTime}
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        {doctors.filter((d) =>
                          !doctorSearchQuery.trim() ||
                          (d.name ?? d.medicalRegistrationNo ?? "").toLowerCase().includes(doctorSearchQuery.trim().toLowerCase()) ||
                          (d.specialization ?? "").toLowerCase().includes(doctorSearchQuery.trim().toLowerCase())
                        ).length === 0 && (
                          <p className="p-3 text-center text-sm text-muted-foreground">No doctors found</p>
                        )}
                        <button
                          type="button"
                          className="flex w-full items-center justify-center gap-2 border-t px-3 py-2 text-sm font-medium text-primary hover:bg-muted transition-colors"
                          onMouseDown={() => {
                            setDoctorSearchOpen(false);
                            setDoctorFormOpen(true);
                          }}
                        >
                          <Plus className="size-4" /> New Doctor
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </Field>

              {/* ── Consultation Type (REQUIRED — determines priority) ── */}
              <Field>
                <FieldLabel>Appointment Type *</FieldLabel>
                <div className="grid grid-cols-3 gap-2">
                  {CONSULTATION_TYPES.map((t) => (
                    <button key={t.value} type="button"
                      className={cn("rounded-none border px-2 py-2 text-left text-xs transition-colors", form.type === t.value ? t.color + " border-2" : "text-muted-foreground hover:bg-muted")}
                      onClick={() => setForm((p) => ({ ...p, type: t.value }))}>
                      <p className="font-medium">{t.label}</p>
                    </button>
                  ))}
                </div>
                {selectedType && (
                  <p className="mt-1.5 text-[11px] text-muted-foreground">
                    Priority: <span className="font-medium text-foreground">{selectedType.label}</span> — {selectedType.value === "EMERGENCY" ? "Immediate attention required" : selectedType.value === "FOLLOW_UP" ? "Continuation of previous visit" : "Standard appointment"}
                  </p>
                )}
              </Field>

              {/* ── Fee + Registration Fee ── */}
              <div className="space-y-2 rounded-none border p-3">
                <div className="flex gap-3">
                  <Field className="flex-1">
                    <FieldLabel htmlFor="r-fee">Fee</FieldLabel>
                    <Input id="r-fee" type="number" min={0} value={form.fee} onChange={(e) => setForm((p) => ({ ...p, fee: Number(e.target.value) || 0 }))} />
                  </Field>
                  <Field className="flex-1">
                    <FieldLabel htmlFor="r-reg-fee">Registration Fee</FieldLabel>
                    <Input
                      id="r-reg-fee"
                      type="number"
                      min={0}
                      value={regFeeAmount}
                      onChange={(e) => setForm((p) => ({ ...p, registrationFee: Number(e.target.value) || 0 }))}
                    />
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {[50, 100, 200, 400, 500].map((val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setForm((p) => ({ ...p, registrationFee: val }))}
                          className={cn(
                            "rounded-none border px-2.5 py-1 text-[11px] font-medium transition-colors",
                            regFeeAmount === val
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-input text-muted-foreground hover:border-primary/50 hover:text-foreground"
                          )}
                        >
                          ₹{val}
                        </button>
                      ))}
                    </div>
                  </Field>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  {form.registrationFee !== null
                    ? "Manually overridden — edit again or reselect the patient to reset to default."
                    : `Default from clinic settings: ${currency(defaultRegistrationFee)}. Editable above.`}
                </p>
                <div className="flex items-center justify-between border-t pt-2 text-sm">
                  <span className="font-medium">Total</span>
                  <span className="font-semibold">{currency(form.fee + regFeeAmount)}</span>
                </div>
              </div>

              {/* ── Slot selection (shown when doctor selected) ── */}
              {form.doctorId && (
                <Field>
                  <FieldLabel>Slot</FieldLabel>
                  {slotsQuery.isLoading ? (
                    <p className="text-sm text-muted-foreground">Loading slots...</p>
                  ) : !slotsQuery.data?.available && slotsQuery.data ? (
                    <p className="text-sm text-muted-foreground">No slots available for this day.</p>
                  ) : (
                    <div className="space-y-2">
                      {slotsQuery.data && slotsQuery.data.slots.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {slotsQuery.data.slots.map((slot) => (
                            <button
                              key={slot.time}
                              type="button"
                              disabled={!slot.available}
                              className={cn(
                                "rounded-none border px-3 py-2 text-xs font-medium transition-colors",
                                !slot.available && "cursor-not-allowed border-destructive/20 bg-destructive/5 text-destructive/60 line-through",
                                slot.available && form.slot === slot.time
                                  ? "border-primary bg-primary text-primary-foreground"
                                  : slot.available
                                    ? "border-green-300 bg-green-50 text-green-700 hover:border-green-400 dark:border-green-800 dark:bg-green-950 dark:text-green-400"
                                    : ""
                              )}
                              onClick={() => setForm((p) => ({ ...p, slot: slot.time }))}
                            >
                              {slot.time}
                              {!slot.available && <span className="ml-0.5 text-[8px]">({slot.booked})</span>}
                            </button>
                          ))}
                        </div>
                      )}
                      {(!slotsQuery.data || slotsQuery.data.slots.length === 0) && (
                        <div className="flex items-center gap-2 text-sm">
                          <Input
                            type="time"
                            className="w-auto"
                            value={form.slot ?? ""}
                            onChange={(e) => setForm((p) => ({ ...p, slot: e.target.value || null }))}
                          />
                          <span className="text-xs text-muted-foreground">Enter time manually</span>
                        </div>
                      )}
                    </div>
                  )}
                </Field>
              )}

              {/* ── Selected doctor summary ── */}
              {form.doctorId && form.slot && (
                <div className="rounded-none border border-primary/30 bg-primary/5 px-3 py-2 text-xs text-primary flex items-center gap-2">
                  <Clock className="size-3.5" />
                  <span>{doctors.find((d) => d.id === form.doctorId)?.name} at {form.slot} · {currency(form.fee)}</span>
                </div>
              )}

              {/* ── Notes (optional) ── */}
              <Field>
                <FieldLabel>Notes</FieldLabel>
                <textarea
                  placeholder="Optional notes — e.g. bring previous reports, specific instructions…"
                  rows={3}
                  className="flex w-full rounded-none border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={form.notes}
                  onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                />
              </Field>
            </div>
            <SheetFooter>
              <Button variant="outline" onClick={() => setSheetOpen(false)}>Cancel</Button>
              <div className="flex items-center gap-2">
                <Button onClick={() => createMutation.mutate()} disabled={!canBook || createMutation.isPending || bookAndPayMutation.isPending}>
                  {createMutation.isPending ? "Booking..." : `Book · ${currency(form.fee + regFeeAmount)}`}
                </Button>
                <Button
                  variant="default"
                  className="gap-1.5"
                  onClick={() => setPaymentSheetOpen(true)}
                  disabled={!canBook || bookAndPayMutation.isPending || createMutation.isPending}
                >
                  {bookAndPayMutation.isPending ? (
                    "Processing..."
                  ) : (
                    <>
                      Book &amp; Pay
                      <span className="ml-1 rounded bg-white/20 px-1.5 py-0.5 text-[11px] font-semibold">
                        {currency(form.fee + regFeeAmount)}
                      </span>
                    </>
                  )}
                </Button>
              </div>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </div>

      {/* ── Payment Sheet ── */}
      <PaymentSheet
        open={paymentSheetOpen}
        onOpenChange={setPaymentSheetOpen}
        subtotal={form.fee + regFeeAmount}
        isPending={bookAndPayMutation.isPending}
        onSubmit={(payload) => bookAndPayMutation.mutate(payload)}
        submitLabel="Confirm & Book"
      />

      {/* ── New Doctor Sheet ── */}
      <Sheet open={doctorFormOpen} onOpenChange={(open) => { if (!open) { setDoctorFormOpen(false); setNewDoctorForm({ firstName: "", lastName: "", email: "", username: "", password: "", medicalRegistrationNo: "", specialization: "", consultationFee: 0 }); }}}>
        <SheetContent side="right" className="sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Add New Doctor</SheetTitle>
            <SheetDescription>Create a doctor and auto-select them for this appointment.</SheetDescription>
          </SheetHeader>
          <div className="flex-1 space-y-4 px-4 pb-4">
            <div className="grid grid-cols-2 gap-3">
              <Field>
                <FieldLabel>First Name *</FieldLabel>
                <Input placeholder="John" value={newDoctorForm.firstName} onChange={(e) => setNewDoctorForm((p) => ({ ...p, firstName: e.target.value }))} />
              </Field>
              <Field>
                <FieldLabel>Last Name *</FieldLabel>
                <Input placeholder="Doe" value={newDoctorForm.lastName} onChange={(e) => setNewDoctorForm((p) => ({ ...p, lastName: e.target.value }))} />
              </Field>
            </div>
            <Field>
              <FieldLabel>Email *</FieldLabel>
              <Input type="email" placeholder="doctor@clinic.com" value={newDoctorForm.email} onChange={(e) => setNewDoctorForm((p) => ({ ...p, email: e.target.value }))} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field>
                <FieldLabel>Username *</FieldLabel>
                <Input placeholder="drjohndoe" value={newDoctorForm.username} onChange={(e) => setNewDoctorForm((p) => ({ ...p, username: e.target.value }))} />
              </Field>
              <Field>
                <FieldLabel>Password *</FieldLabel>
                <Input type="password" placeholder="Min 8 chars" value={newDoctorForm.password} onChange={(e) => setNewDoctorForm((p) => ({ ...p, password: e.target.value }))} />
              </Field>
            </div>
            <Field>
              <FieldLabel>Medical Reg. No. *</FieldLabel>
              <Input placeholder="MCI-10001" value={newDoctorForm.medicalRegistrationNo} onChange={(e) => setNewDoctorForm((p) => ({ ...p, medicalRegistrationNo: e.target.value }))} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field>
                <FieldLabel>Specialization</FieldLabel>
                <Input placeholder="Cardiology" value={newDoctorForm.specialization} onChange={(e) => setNewDoctorForm((p) => ({ ...p, specialization: e.target.value }))} />
              </Field>
              <Field>
                <FieldLabel>Consultation Fee (₹)</FieldLabel>
                <Input type="number" min={0} placeholder="500" value={newDoctorForm.consultationFee} onChange={(e) => setNewDoctorForm((p) => ({ ...p, consultationFee: Number(e.target.value) || 0 }))} />
              </Field>
            </div>
          </div>
          <SheetFooter>
            <Button variant="outline" onClick={() => { setDoctorFormOpen(false); setNewDoctorForm({ firstName: "", lastName: "", email: "", username: "", password: "", medicalRegistrationNo: "", specialization: "", consultationFee: 0 }); }}>
              Cancel
            </Button>
            <Button
              onClick={() => createDoctorMutation.mutate({
                firstName: newDoctorForm.firstName.trim(),
                lastName: newDoctorForm.lastName.trim(),
                email: newDoctorForm.email.trim(),
                username: newDoctorForm.username.trim(),
                password: newDoctorForm.password,
                medicalRegistrationNo: newDoctorForm.medicalRegistrationNo.trim(),
                specialization: newDoctorForm.specialization.trim() || undefined,
                consultationFee: newDoctorForm.consultationFee > 0 ? newDoctorForm.consultationFee : undefined,
              })}
              disabled={!newDoctorForm.firstName.trim() || !newDoctorForm.lastName.trim() || !newDoctorForm.email.trim() || !newDoctorForm.username.trim() || !newDoctorForm.password.trim() || !newDoctorForm.medicalRegistrationNo.trim() || createDoctorMutation.isPending}
            >
              {createDoctorMutation.isPending ? "Creating..." : "Create & Select"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {statTiles.map(({ key, label, icon: Icon }) => (
          <Card key={key}>
            <CardContent className="flex items-center gap-4 p-4">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-none bg-primary/10">
                <Icon className="size-5 text-primary" />
              </span>
              <div className="min-w-0">
                <p className="text-sm text-muted-foreground">{label}</p>
                {statsQuery.isLoading ? (
                  <Skeleton className="mt-1 h-6 w-12" />
                ) : (
                  <p className="text-xl font-semibold">
                    {stats ? (key === "todayRevenue" ? currency(stats[key]) : stats[key as keyof typeof stats]) : "—"}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Today's Appointments ── */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <CalendarClock className="size-4 text-primary" />
              Today's Appointments
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loadingAppts ? (
              <div className="space-y-3 p-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="h-4 w-16 animate-pulse rounded bg-muted" />
                    <div className="h-4 flex-1 animate-pulse rounded bg-muted" />
                    <div className="h-4 w-20 animate-pulse rounded bg-muted" />
                  </div>
                ))}
              </div>
            ) : todayAppointmentsList.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8 text-center">
                <CalendarClock className="size-8 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">No appointments today</p>
              </div>
            ) : (
              <div className="divide-y">
                {displayAppts.map((appt) => (
                  <div key={appt.id} className="flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-muted/30">
                    <span className={`flex w-14 shrink-0 items-center justify-center rounded-md px-2 py-1 text-[10px] font-mono font-bold ${
                      appt.status === "COMPLETED"
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        : appt.status === "IN_PROGRESS" || appt.status === "CHECKED_IN"
                          ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                          : "bg-muted text-muted-foreground"
                    }`}>
                      #{appt.tokenNumber ?? "—"}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{appt.patient?.name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {appt.doctor?.name ?? appt.doctor?.medicalRegistrationNo ?? "Doctor"}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <div className="flex items-center gap-1.5">
                        {appt.bill ? (
                          <Badge variant="outline" className="text-[9px] bg-green-100 text-green-700 border-green-300 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800">
                            Paid
                          </Badge>
                        ) : appt.status === "COMPLETED" ? (
                          <Badge variant="outline" className="text-[9px] bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800">
                            Unpaid
                          </Badge>
                        ) : null}
                        <Badge variant="outline" className={`text-[9px] ${APPT_STATUS_STYLES[appt.status] ?? ""}`}>
                          {appt.status.replace("_", " ")}
                        </Badge>
                      </div>
                      <span className="whitespace-nowrap text-xs font-medium text-primary">
                        {appt.registrationFee > 0
                          ? `${currency(appt.fee + appt.registrationFee)} (${currency(appt.fee)}+${currency(appt.registrationFee)})`
                          : currency(appt.fee)}
                      </span>
                    </div>
                  </div>
                ))}
                {/* Totals footer */}
                <div className="flex items-center justify-between border-t-2 border-primary/20 bg-primary/5 px-4 py-2.5 text-sm font-semibold">
                  <span>{displayAppts.length} appointment{displayAppts.length !== 1 ? "s" : ""}</span>
                  <span className="text-primary">
                    Total: {currency(apptsTotalFee + apptsTotalReg)}
                    {apptsTotalReg > 0 && (
                      <span className="ml-1 text-xs font-normal text-muted-foreground">
                        ({currency(apptsTotalFee)} + {currency(apptsTotalReg)} reg)
                      </span>
                    )}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Today's Queue ── */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <ListOrdered className="size-4 text-primary" />
              Today's Queue
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loadingQueue ? (
              <div className="space-y-3 p-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="h-4 w-16 animate-pulse rounded bg-muted" />
                    <div className="h-4 flex-1 animate-pulse rounded bg-muted" />
                    <div className="h-4 w-20 animate-pulse rounded bg-muted" />
                  </div>
                ))}
              </div>
            ) : todayQueueList.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8 text-center">
                <ListOrdered className="size-8 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">Queue is empty</p>
              </div>
            ) : (
              <div className="divide-y">
                {displayQueue.map((entry) => (
                  <div key={entry.id} className="flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-muted/30">
                    <span className="flex w-14 shrink-0 items-center justify-center rounded-md px-2 py-0.5 text-[10px] font-mono font-bold">
                      {entry.tokenNumber}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{entry.patient?.name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {entry.doctor?.name ?? entry.doctor?.medicalRegistrationNo ?? "Doctor"}
                      </p>
                    </div>
                    <Badge variant="outline" className={`text-[9px] ${STATUS_STYLES[entry.status] ?? ""}`}>
                      {entry.status.replace("_", " ")}
                    </Badge>
                  </div>
                ))}
                {/* Queue count footer */}
                <div className="flex items-center justify-between border-t-2 border-primary/20 bg-primary/5 px-4 py-2.5 text-sm font-semibold">
                  <span>{displayQueue.length} patient{displayQueue.length !== 1 ? "s" : ""} in queue</span>
                  <span className="text-xs font-normal text-muted-foreground">
                    {queueWaiting} waiting · {queueInProgress} in progress
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <PatientFormSheet
        open={!!editPatientId}
        onOpenChange={(open) => { if (!open) setEditPatientId(null); }}
        editingPatient={editPatientId ? (patientResults.data?.data ?? []).find((p) => p.id === editPatientId) ?? null : null}
        onSaved={(patient) => { setEditPatientId(null); }} />
    </div>
  );
}
