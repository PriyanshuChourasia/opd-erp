import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useLocation } from "@tanstack/react-router";
import { AlertTriangle, ChevronDown, Clock, History, Pencil, Plus, Search, X } from "lucide-react";
import {
  createAppointment,
  createDoctorWithUser,
  checkoutAppointment,
  fetchDoctors,
  fetchDoctorSlots,
  fetchPatients,
  fetchPatient,
  fetchOrganisation,
  fetchAppointments,
  updatePatient,
  fetchEmployeeSchedules,
  type AppointmentType,
  type CreateDoctorWithUserInput,
} from "@/lib/api";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { extractApiError } from "@/lib/axios-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Field, FieldLabel } from "@/components/ui/field";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { PatientFormSheet } from "@/modules/patients/components/patient-form-sheet";
import { AllergySelect } from "@/components/allergy-select";
import { PaymentSheet, type PaymentPayload } from "@/components/payment-sheet";

const CONSULTATION_TYPES = [
  { value: "WALK_IN", label: "Walk-in Registration" },
  { value: "CONSULTATION", label: "Consultation" },
  { value: "SPECIALIST", label: "Specialist Consultation" },
  { value: "EMERGENCY", label: "Emergency Consultation" },
  { value: "FOLLOW_UP", label: "Follow-up Consultation" },
  { value: "TELECONSULTATION", label: "Teleconsultation" },
] as const;

function currency(value: number) { return `₹${value.toFixed(2)}`; }

function generateTimeSlots(start: string, end: string, intervalMinutes: number): string[] {
  const startParts = start.split(':');
  const endParts = end.split(':');
  const startMin = parseInt(startParts[0] ?? '0') * 60 + parseInt(startParts[1] ?? '0');
  const endMin = parseInt(endParts[0] ?? '0') * 60 + parseInt(endParts[1] ?? '0');
  const slots: string[] = [];
  for (let m = startMin; m < endMin; m += intervalMinutes) {
    const h = Math.floor(m / 60);
    const min = m % 60;
    slots.push(`${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`);
  }
  return slots;
}

function PlaceholderField({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
      <p className={cn("mt-0.5", value ? "font-medium" : "text-muted-foreground/50")}>
        {value || "—"}
      </p>
    </div>
  );
}
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

interface BookingForm {
  patient: { id: string; name: string; phone: string } | null;
  doctorId: string;
  type: string;
  fee: number;
  registrationFee: number | null;
  isNewPatient: boolean;
  date: string;
  slot: string | null;
  notes: string;
  allergies: string[];
}

function emptyBookingForm(): BookingForm {
  return { patient: null, doctorId: "", type: "WALK_IN", fee: 0, registrationFee: null, isNewPatient: false, date: todayStr(), slot: null, notes: "", allergies: [] };
}

export function NewAppointmentPage({ hideTitle }: { hideTitle?: boolean } = {}) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();
  const isReceptionist = location.pathname.startsWith('/receptionist');
  const [form, setForm] = useState<BookingForm>(emptyBookingForm());
  const [patientQuery, setPatientQuery] = useState("");
  const [patientDropdownOpen, setPatientDropdownOpen] = useState(false);
  const [patientSheetOpen, setPatientSheetOpen] = useState(false);
  const [editPatientId, setEditPatientId] = useState<string | null>(null);
  const [doctorSearchQuery, setDoctorSearchQuery] = useState("");
  const [doctorSearchOpen, setDoctorSearchOpen] = useState(false);
  const [patientInfoOpen, setPatientInfoOpen] = useState(false);
  const [doctorFormOpen, setDoctorFormOpen] = useState(false);
  const [paymentSheetOpen, setPaymentSheetOpen] = useState(false);
  const [newDoctorForm, setNewDoctorForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    username: "",
    password: "",
    medicalRegistrationNo: "",
    specialization: "",
    consultationFee: 0,
  });

  function goBack() { navigate({ to: isReceptionist ? '/receptionist/appointments' : '/appointments' }); }

  // Fetch full patient details when selected (to get allergies)
  const { data: selectedPatient } = useQuery({
    queryKey: ["patient", form.patient?.id],
    queryFn: () => fetchPatient(form.patient!.id),
    enabled: !!form.patient?.id,
  });

  useEffect(() => {
    if (selectedPatient) {
      setForm((prev) => ({ ...prev, allergies: selectedPatient.allergies ?? [] }));
    }
  }, [selectedPatient?.id]);

  const { data: doctorsResponse } = useQuery({
    queryKey: ["doctors", "appointments-filter"],
    queryFn: () => fetchDoctors({ limit: 100 }),
  });
  const doctors = useMemo(() => doctorsResponse?.data ?? [], [doctorsResponse]);

  // Fetch all doctor schedules to determine date availability
  const { data: allSchedules = [] } = useQuery({
    queryKey: ["employee-schedules", "all-doctors"],
    queryFn: async () => {
      const results = await Promise.all(
        doctors.map((d) => fetchEmployeeSchedules("Doctor", d.id).catch(() => []))
      );
      return results.flat();
    },
    enabled: doctors.length > 0,
  });

  // Compute which doctor IDs are available on the selected date
  const availableDoctorIds = useMemo(() => {
    if (!form.date) return new Set(doctors.map((d) => d.id));
    const dateObj = new Date(form.date + "T00:00:00");
    const dayOfWeek = (dateObj.getDay() + 6) % 7; // JS Sunday=0 → Monday=0
    const available = new Set<string>();
    for (const sched of allSchedules) {
      if (sched.dayOfWeek === dayOfWeek) {
        available.add(sched.employeeSchedulableId);
      }
    }
    return available;
  }, [allSchedules, form.date, doctors]);

  // Map doctor ID → schedule for the selected date (to show times in dropdown)
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

  const patientResults = useQuery({
    queryKey: ["appointment-patients", patientQuery],
    queryFn: () => fetchPatients({ search: patientQuery, limit: 8 }),
    enabled: patientQuery.trim().length >= 1 && !form.patient,
  });
  const slotsQuery = useQuery({ queryKey: ["doctor-slots", form.doctorId, form.date], queryFn: () => fetchDoctorSlots(form.doctorId, form.date), enabled: !!form.doctorId && !!form.date });

  // ── Selected doctor's schedule for the chosen date ──
  const selectedDoctorSchedule = useMemo(() => {
    if (!form.doctorId || !form.date) return null;
    const dateObj = new Date(form.date + "T00:00:00");
    const dayOfWeek = (dateObj.getDay() + 6) % 7;
    return allSchedules.find(
      (s) => s.employeeSchedulableId === form.doctorId && s.dayOfWeek === dayOfWeek
    ) ?? null;
  }, [allSchedules, form.doctorId, form.date]);

  // ── Already-booked slot times ──
  const bookedSlots = useMemo(() => {
    if (!slotsQuery.data?.slots) return [];
    return slotsQuery.data.slots.filter((s) => s.booked > 0).map((s) => s.time);
  }, [slotsQuery.data]);

  const patientHistory = useQuery({
    queryKey: ["patient-history", form.patient?.id],
    queryFn: () => fetchAppointments({ patientId: form.patient!.id, page: 1, limit: 10 }),
    enabled: !!form.patient?.id,
  });

  const pastAppointments = useMemo(() => (patientHistory.data?.data ?? []).filter((a) => a.status === "COMPLETED"), [patientHistory.data]);

  const { data: organisation } = useQuery({ queryKey: ["organisation"], queryFn: fetchOrganisation });
  const defaultRegistrationFee = organisation?.registrationFee ?? 0;
  const regFeeAmount = form.registrationFee ?? defaultRegistrationFee;

  const createMutation = useMutation({
    mutationFn: async () => {
      if (selectedPatient && JSON.stringify(selectedPatient.allergies ?? []) !== JSON.stringify(form.allergies)) {
        await updatePatient(form.patient!.id, { allergies: form.allergies });
      }
      return createAppointment({
        patientId: form.patient!.id,
        doctorId: form.doctorId,
        date: `${form.date}T${form.slot}:00`,
        type: form.type as AppointmentType,
        fee: form.fee,
        ...(form.registrationFee !== null ? { registrationFee: form.registrationFee } : {}),
        notes: form.notes || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      queryClient.invalidateQueries({ queryKey: ["doctor-slots", form.doctorId, form.date] });
      toast.success("Appointment booked successfully");
      navigate({ to: isReceptionist ? '/receptionist/appointments' : '/appointments' });
    },
    onError: (err) => { toast.error(extractApiError(err)); },
  });

  const bookAndPayMutation = useMutation({
    mutationFn: async (payload: PaymentPayload) => {
      if (selectedPatient && JSON.stringify(selectedPatient.allergies ?? []) !== JSON.stringify(form.allergies)) {
        await updatePatient(form.patient!.id, { allergies: form.allergies });
      }
      const appointment = await createAppointment({
        patientId: form.patient!.id,
        doctorId: form.doctorId,
        date: `${form.date}T${form.slot}:00`,
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
      queryClient.invalidateQueries({ queryKey: ["doctor-slots", form.doctorId, form.date] });
      queryClient.invalidateQueries({ queryKey: ["billing"] });
      toast.success("Appointment booked and paid successfully");
      setPaymentSheetOpen(false);
      navigate({ to: isReceptionist ? '/receptionist/appointments' : '/appointments' });
    },
    onError: (err) => {
      toast.error(extractApiError(err));
    },
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

  const canBook = !!form.patient && !!form.doctorId && !!form.slot && !!form.type;

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center justify-between gap-4">
        {!hideTitle && (
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">New Appointment</h1>
              <p className="mt-1 text-sm text-muted-foreground">Register the patient, pick a doctor and slot, then confirm the fee.</p>
            </div>
          </div>
        )}
        <div className="flex flex-col items-end gap-1.5">
          <Input
            type="date"
            className="w-auto"
            value={form.date}
            onChange={(e) => setForm((prev) => ({ ...prev, date: e.target.value, doctorId: "", slot: null }))}
          />
          <div className="flex gap-1.5">
            {[
              { label: "Tomorrow", value: tomorrowStr() },
              { label: new Date(dayAfterTomorrowStr()).getDate().toString(), value: dayAfterTomorrowStr() },
              { label: new Date(twoDaysLaterStr()).getDate().toString(), value: twoDaysLaterStr() },
            ].map(({ label, value }) => (
              <button
                key={value}
                type="button"
                onClick={() => setForm((prev) => ({ ...prev, date: value, doctorId: "", slot: null }))}
                className={cn(
                  "shrink-0 rounded-none border px-2.5 py-1 text-[11px] font-medium transition-colors",
                  form.date === value
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-input text-muted-foreground hover:border-primary/50 hover:text-foreground"
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 gap-x-8 gap-y-6 lg:grid-cols-2">
            {/* ── Left Column: Patient → Allergies → Doctor ── */}
            <div className="space-y-6">
              {/* ── Patient ── */}
              <Field><FieldLabel>Patient</FieldLabel>
                {form.patient && selectedPatient ? (
                  <div className="flex items-center justify-between rounded-none border border-input bg-background px-3 py-1.5">
                    <span className="truncate text-sm font-medium">{selectedPatient.name}</span>
                    <Button variant="ghost" size="icon-sm" title="Clear patient" aria-label="Clear patient" onClick={() => setForm((prev) => ({ ...prev, patient: null }))}>
                      <X className="size-3.5" />
                    </Button>
                  </div>
                ) : (
                  <div className="relative">
                    <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search patient by name or phone"
                      className="pl-9"
                      value={patientQuery}
                      onChange={(e) => { setPatientQuery(e.target.value); setPatientDropdownOpen(true); }}
                      onFocus={() => setPatientDropdownOpen(true)}
                      onBlur={() => setTimeout(() => setPatientDropdownOpen(false), 200)}
                    />
                    {patientDropdownOpen && patientQuery.trim().length >= 1 && (
                      <div className="absolute z-50 mt-1 w-full rounded-none border bg-popover shadow-md max-h-64 overflow-y-auto">
                        {patientResults.isLoading && <p className="px-3 py-2 text-xs text-muted-foreground">Searching...</p>}
                        {!patientResults.isLoading && (patientResults.data?.data ?? []).length === 0 && patientQuery.trim().length >= 1 && (
                          <p className="px-3 py-2 text-xs text-muted-foreground">No patients found</p>
                        )}
                        {(patientResults.data?.data ?? []).map((patient) => (
                          <div key={patient.id} className="group flex items-center px-3 py-1.5 text-sm hover:bg-muted">
                            <button
                              type="button"
                              className="flex flex-1 flex-col items-start py-0.5 text-left"
                              onClick={() => { setForm((prev) => ({ ...prev, patient: { id: patient.id, name: patient.name, phone: patient.phone }, isNewPatient: false, registrationFee: null })); setPatientQuery(""); setPatientDropdownOpen(false); }}
                            >
                              <span className="font-medium">{patient.name}</span>
                              <span className="text-xs text-muted-foreground">{patient.phone}</span>
                            </button>
                            <button
                              type="button"
                              className="shrink-0 rounded p-1 text-muted-foreground opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100"
                              title="Edit patient"
                              onMouseDown={() => setEditPatientId(patient.id)}
                            >
                              <Pencil className="size-3.5" />
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          className="flex w-full items-center justify-center gap-2 border-t px-3 py-2 text-sm font-medium text-primary hover:bg-muted transition-colors"
                          onMouseDown={() => { setPatientSheetOpen(true); setPatientDropdownOpen(false); }}
                        >
                          <Plus className="size-4" /> Register Patient
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </Field>

              {/* ── Allergies + Doctor ── */}
              <div className="grid grid-cols-2 gap-4">
              <Field><FieldLabel>Allergies</FieldLabel>
                <AllergySelect
                  value={form.allergies}
                  onChange={(allergies) => setForm((prev) => ({ ...prev, allergies }))}
                  hideSelected
                />
              </Field>

              <Field><FieldLabel htmlFor="a-doctor">Doctor *</FieldLabel>
                <div className="relative">
                  {form.doctorId ? (
                    <div className="flex h-9 items-center justify-between rounded-none border border-input bg-background px-3 text-sm">
                      <span className="truncate">
                        {doctors.find((d) => d.id === form.doctorId)?.name ?? 'Doctor'}
                        {doctors.find((d) => d.id === form.doctorId)?.consultationFee ? ` · ${currency(doctors.find((d) => d.id === form.doctorId)!.consultationFee)}` : ''}
                      </span>
                      <Button variant="ghost" size="icon-sm" title="Clear doctor" aria-label="Clear doctor" onClick={() => setForm((prev) => ({ ...prev, doctorId: "", slot: null }))}>
                        <X className="size-3.5" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="a-doctor"
                        placeholder="Search doctor by name or specialization..."
                        className="h-9 pl-9"
                        value={doctorSearchQuery}
                        onChange={(e) => { setDoctorSearchQuery(e.target.value); setDoctorSearchOpen(true); }}
                        onFocus={() => setDoctorSearchOpen(true)}
                        onBlur={() => setTimeout(() => setDoctorSearchOpen(false), 200)}
                      />
                    </>
                  )}
                  {doctorSearchOpen && !form.doctorId && (
                    <div className="absolute z-50 mt-1 max-h-56 w-full overflow-y-auto rounded-none border bg-popover shadow-md">
                      {doctors
                        .filter((d) => availableDoctorIds.has(d.id))
                        .filter((d) =>
                          !doctorSearchQuery.trim() ||
                          (d.name ?? d.medicalRegistrationNo ?? "").toLowerCase().includes(doctorSearchQuery.trim().toLowerCase()) ||
                          (d.specialization ?? "").toLowerCase().includes(doctorSearchQuery.trim().toLowerCase())
                        )
                        .map((d) => (
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
                            <span className="font-medium">{d.name ?? d.medicalRegistrationNo ?? 'Doctor'}</span>
                            <span className="text-xs text-muted-foreground">
                              {d.specialization}
                              {d.consultationFee ? ` · ${currency(d.consultationFee)}` : ''}
                            </span>
                            {doctorScheduleMap.has(d.id) && (
                              <span className="mt-1 inline-flex items-center gap-1 rounded-none border border-primary/20 bg-primary/5 px-1.5 py-0.5 text-[11px] font-semibold font-mono text-primary">
                                <Clock className="size-3" />
                                {doctorScheduleMap.get(d.id)!.startTime} – {doctorScheduleMap.get(d.id)!.endTime}
                              </span>
                            )}
                          </button>
                        ))}
                      {doctors
                        .filter((d) => availableDoctorIds.has(d.id))
                        .filter((d) =>
                          !doctorSearchQuery.trim() ||
                          (d.name ?? d.medicalRegistrationNo ?? "").toLowerCase().includes(doctorSearchQuery.trim().toLowerCase()) ||
                          (d.specialization ?? "").toLowerCase().includes(doctorSearchQuery.trim().toLowerCase())
                        ).length === 0 && (
                        <p className="p-3 text-center text-sm text-muted-foreground">No doctors scheduled on this date</p>
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
              </Field>
              </div>

              {/* ── Slot + Consultation type (side by side) ── */}
              {form.doctorId ? (
                <div className="grid grid-cols-2 gap-4">
                  <Field><FieldLabel>Slot *</FieldLabel>
                    {slotsQuery.isLoading ? (
                      <p className="text-sm text-muted-foreground">Loading slots...</p>
                    ) : !slotsQuery.data?.available ? (
                      <p className="text-sm text-muted-foreground">No slots available for this day.</p>
                    ) : (
                      <div className="space-y-2">
                        {/* Schedule range */}
                        {selectedDoctorSchedule && (
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px]">
                            <span className="font-medium text-foreground">Hours:</span>
                            <span className="rounded-none border border-input px-1.5 py-0.5 font-mono">
                              {selectedDoctorSchedule.startTime}
                            </span>
                            <span className="text-muted-foreground">–</span>
                            <span className="rounded-none border border-input px-1.5 py-0.5 font-mono">
                              {selectedDoctorSchedule.endTime}
                            </span>
                            {bookedSlots.length > 0 && (
                              <span className="text-muted-foreground">{bookedSlots.length} booked</span>
                            )}
                          </div>
                        )}
                        {/* Time input */}
                        <Input
                          type="time"
                          value={form.slot ?? ""}
                          min={(() => {
                            if (!selectedDoctorSchedule) return '';
                            if (form.date !== todayStr()) return selectedDoctorSchedule.startTime;
                            const now = new Date();
                            const nowTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
                            return nowTime > selectedDoctorSchedule.startTime ? nowTime : selectedDoctorSchedule.startTime;
                          })()}
                          max={selectedDoctorSchedule?.endTime ?? ""}
                          onChange={(e) => {
                            const time = e.target.value;
                            if (!time) {
                              setForm((prev) => ({ ...prev, slot: null }));
                              return;
                            }
                            if (selectedDoctorSchedule) {
                              if (time < selectedDoctorSchedule.startTime || time >= selectedDoctorSchedule.endTime) {
                                toast.error(`Time must be between ${selectedDoctorSchedule.startTime} and ${selectedDoctorSchedule.endTime}`);
                                return;
                              }
                            }
                            if (form.date === todayStr()) {
                              const now = new Date();
                              const nowTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
                              if (time < nowTime) {
                                toast.error("Cannot select a time that has already passed");
                                return;
                              }
                            }
                            if (bookedSlots.includes(time)) {
                              toast.error("This time is already booked");
                              return;
                            }
                            setForm((prev) => ({ ...prev, slot: time }));
                          }}
                        />

                        {/* Visual slot grid */}
                        {selectedDoctorSchedule && (() => {
                          const slots = generateTimeSlots(selectedDoctorSchedule.startTime, selectedDoctorSchedule.endTime, 30);
                          const now = new Date();
                          const today = todayStr();
                          const isToday = form.date === today;
                          const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
                          return (
                            <div>
                              <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                                Available slots
                                {bookedSlots.length > 0 && (
                                  <span className="ml-2 text-red-500">({bookedSlots.length} booked)</span>
                                )}
                              </span>
                              <div className="mt-1.5 flex flex-wrap gap-1.5">
                                {slots.map((t) => {
                                  const isBooked = bookedSlots.includes(t);
                                  const isPast = isToday && t < currentTime;
                                  const disabled = isBooked || isPast;
                                  const isSelected = form.slot === t;
                                  return (
                                    <button
                                      key={t}
                                      type="button"
                                      disabled={disabled}
                                      title={isBooked ? "Already booked" : isPast ? "Time has passed" : `Select ${t}`}
                                      onClick={() => {
                                        if (!disabled) {
                                          setForm((prev) => ({ ...prev, slot: t }));
                                        }
                                      }}
                                      className={cn(
                                        "relative rounded-none border px-2.5 py-1 text-[11px] font-medium font-mono transition-all duration-150",
                                        isBooked && "cursor-not-allowed border-red-200 bg-red-50 text-red-300 line-through",
                                        isPast && !isBooked && "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400",
                                        isSelected && !disabled && "z-10 border-primary bg-primary/10 text-primary shadow-sm ring-1 ring-primary",
                                        !disabled && !isSelected && "border-input text-foreground hover:border-primary/50 hover:bg-primary/5 hover:text-primary"
                                      )}
                                    >
                                      {t}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </Field>
                  <Field><FieldLabel>Consultation type *</FieldLabel>
                    <div className="grid grid-cols-1 gap-2">
                      {CONSULTATION_TYPES.map((t) => (
                        <button key={t.value} type="button" className={cn("rounded-none border px-3 py-2 text-left text-xs", form.type === t.value ? "border-primary bg-primary/10 text-primary" : "text-muted-foreground")} onClick={() => setForm((prev) => ({ ...prev, type: t.value }))}>
                          <p className="font-medium text-foreground">{t.label}</p>
                        </button>
                      ))}
                    </div>
                  </Field>
                </div>
              ) : (
                <Field><FieldLabel>Consultation type *</FieldLabel>
                  <div className="grid grid-cols-2 gap-2">
                    {CONSULTATION_TYPES.map((t) => (
                      <button key={t.value} type="button" className={cn("rounded-none border px-3 py-2 text-left text-xs", form.type === t.value ? "border-primary bg-primary/10 text-primary" : "text-muted-foreground")} onClick={() => setForm((prev) => ({ ...prev, type: t.value }))}>
                        <p className="font-medium text-foreground">{t.label}</p>
                      </button>
                    ))}
                  </div>
                </Field>
              )}

              {/* ── Notes ── */}
              <Field><FieldLabel htmlFor="a-notes">Notes</FieldLabel>
                <textarea
                  id="a-notes"
                  rows={3}
                  className="flex w-full rounded-none border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Optional — e.g. bring previous reports, special instructions..."
                  value={form.notes}
                  onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
                />
              </Field>
            </div>

            {/* ── Right Column: Patient Info Card → Fee Summary ── */}
            <div className="space-y-6">
              {/* Patient info card */}
              <div className="rounded-none border">
                {/* Header — always visible */}
                <div className="flex items-center justify-between border-b bg-muted/30 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold",
                      selectedPatient ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                    )}>
                      {selectedPatient ? selectedPatient.name.charAt(0).toUpperCase() : "?"}
                    </div>
                    <div>
                      <p className={cn("text-sm font-semibold", !selectedPatient && "text-muted-foreground")}>
                        {selectedPatient ? selectedPatient.name : "Patient Name"}
                      </p>
                      <p className={cn("text-xs", selectedPatient ? "text-muted-foreground" : "text-muted-foreground/50")}>
                        {selectedPatient ? selectedPatient.phone : "Phone number"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {selectedPatient && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1.5 text-xs"
                          onClick={() => setEditPatientId(selectedPatient.id)}
                        >
                          <Pencil className="size-3" />
                          Edit
                        </Button>
                        <Button variant="ghost" size="icon-sm" title="Clear patient" aria-label="Clear patient" onClick={() => setForm((prev) => ({ ...prev, patient: null }))}>
                          <X className="size-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                {/* Details grid — always visible */}
                <div className="grid grid-cols-2 gap-x-4 gap-y-3 px-4 py-3 text-sm">
                  <PlaceholderField label="Gender" value={selectedPatient?.gender} />
                  <PlaceholderField
                    label="Age / DOB"
                    value={selectedPatient?.dateOfBirth ? `${Math.floor((Date.now() - new Date(selectedPatient.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))} yrs · ${new Date(selectedPatient.dateOfBirth).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}` : undefined}
                  />
                  <PlaceholderField label="Blood Group" value={selectedPatient?.bloodGroup} />
                  <PlaceholderField label="Email" value={selectedPatient?.email} />
                  <div className="col-span-2 grid grid-cols-2 gap-x-4">
                    <div>
                      <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Address</span>
                      <p className={cn("mt-0.5", selectedPatient?.address ? "" : "text-muted-foreground/50")}>
                        {selectedPatient?.address || "—"}
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Emergency Contact</span>
                      <p className={cn("mt-0.5", selectedPatient?.emergencyContact ? "font-medium" : "text-muted-foreground/50")}>
                        {selectedPatient?.emergencyContact || "—"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Allergies display — always visible */}
                <div className="border-t px-4 py-3">
                  <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Allergies</span>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {form.allergies.length > 0 ? form.allergies.map((allergy) => (
                      <span
                        key={allergy}
                        className="inline-flex items-center gap-1 rounded-none border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700"
                      >
                        <AlertTriangle className="size-3 text-amber-500" />
                        {allergy}
                        <button
                          type="button"
                          onClick={() => setForm((prev) => ({ ...prev, allergies: prev.allergies.filter((a) => a !== allergy) }))}
                          className="ml-0.5 inline-flex rounded-sm p-0.5 text-amber-500 hover:bg-amber-200 hover:text-amber-800"
                        >
                          <X className="size-3" />
                        </button>
                      </span>
                    )) : (
                      <span className="text-xs text-muted-foreground/50">—</span>
                    )}
                  </div>
                </div>

                {/* Past visits — collapsible accordion */}
                <div className="border-t">
                  <button
                    type="button"
                    onClick={() => setPatientInfoOpen((v) => !v)}
                    className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                      <History className="size-3" />
                      <span>Past visits</span>
                      {pastAppointments.length > 0 && (
                        <span className="ml-1 rounded bg-muted px-1.5 py-0.5 text-[9px]">{pastAppointments.length}</span>
                      )}
                    </div>
                    <ChevronDown className={cn(
                      "size-4 text-muted-foreground transition-transform duration-200",
                      patientInfoOpen && "rotate-180"
                    )} />
                  </button>
                  <div className={cn(
                    "overflow-hidden transition-all duration-200",
                    patientInfoOpen ? "max-h-[800px] opacity-100" : "max-h-0 opacity-0"
                  )}>
                    <div className="px-4 pb-3">
                      {!selectedPatient ? (
                        <p className="text-xs text-muted-foreground/50">Select a patient to view visit history</p>
                      ) : patientHistory.isLoading ? (
                        <div className="flex gap-1.5">
                          <div className="h-6 w-24 animate-pulse bg-muted" />
                          <div className="h-6 w-24 animate-pulse bg-muted" />
                        </div>
                      ) : pastAppointments.length > 0 ? (
                        <div className="space-y-1.5">
                          {pastAppointments.slice(0, 5).map((appt) => (
                            <div
                              key={appt.id}
                              className="flex items-center gap-2 rounded-none border px-3 py-1.5 text-xs"
                            >
                              <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                                {appt.type.replace("_", " ")}
                              </span>
                              <span className="font-medium">{appt.doctor?.name ?? appt.doctor?.medicalRegistrationNo ?? "Doctor"}</span>
                              <span className="text-muted-foreground">·</span>
                              <span className="text-muted-foreground">{new Date(appt.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground">No previous visits — new patient.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Invoice-style Fee Summary ── */}
              <div className="rounded-none border">
                <div className="border-b bg-muted/30 px-4 py-2.5">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Fee Summary</p>
                </div>
                <div className="space-y-4 px-4 py-4">
                  {/* Consultation Fee */}
                  <div className="flex items-center justify-between gap-3">
                    <label htmlFor="a-fee" className="text-sm font-medium">Consultation Fee</label>
                    <Input
                      id="a-fee"
                      type="number"
                      min={0}
                      className="w-32 text-right"
                      value={form.fee}
                      onChange={(e) => setForm((prev) => ({ ...prev, fee: Number(e.target.value) || 0 }))}
                    />
                  </div>
                  {/* Divider */}
                  <div className="border-t border-dashed" />
                  {/* Registration Fee */}
                  <div>
                    <div className="flex items-center justify-between gap-3">
                      <label htmlFor="a-reg" className="text-sm font-medium">Registration Fee</label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="a-reg"
                          type="number"
                          min={0}
                          className="w-24 text-right"
                          value={regFeeAmount}
                          onChange={(e) => setForm((prev) => ({ ...prev, registrationFee: Number(e.target.value) || 0 }))}
                        />
                      </div>
                    </div>
                    {/* Preset chips attached to registration fee */}
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {[50, 100, 200, 400, 500].map((val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setForm((prev) => ({ ...prev, registrationFee: val }))}
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
                      <span className="self-center text-[11px] text-muted-foreground">Default: {currency(defaultRegistrationFee)}</span>
                    </div>
                  </div>

                  {/* Total */}
                  <div className="border-t" />
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold">Total</span>
                    <span className="text-lg font-bold text-primary">{currency(form.fee + regFeeAmount)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-end gap-4">
        <Button variant="outline" onClick={goBack}>Cancel</Button>
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
      </div>

      <PatientFormSheet
        open={patientSheetOpen || !!editPatientId}
        onOpenChange={(open) => { if (!open) { setPatientSheetOpen(false); setEditPatientId(null); } }}
        editingPatient={editPatientId ? (patientResults.data?.data ?? []).find((p) => p.id === editPatientId) ?? null : null}
        onSaved={(patient) => {
          if (!editPatientId) {
            setForm((prev) => ({ ...prev, patient: { id: patient.id, name: patient.name, phone: patient.phone }, isNewPatient: true, registrationFee: null }));
            setPatientQuery("");
          }
          setPatientSheetOpen(false);
          setEditPatientId(null);
        }} />

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
    </div>
  );
}
