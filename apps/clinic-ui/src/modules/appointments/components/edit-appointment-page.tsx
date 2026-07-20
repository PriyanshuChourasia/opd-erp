import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "@tanstack/react-router";
import { AlertTriangle, ChevronDown, History, Pencil, Plus, Search, X } from "lucide-react";
import {
  fetchAppointment,
  updateAppointment,
  fetchDoctors,
  fetchDoctorSlots,
  fetchPatients,
  fetchPatient,
  fetchOrganisation,
  fetchAppointments,
  updatePatient,
  fetchEmployeeSchedules,
  type AppointmentType,
} from "@/lib/api";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { extractApiError } from "@/lib/axios-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Field, FieldLabel } from "@/components/ui/field";
import { PatientFormSheet } from "@/modules/patients/components/patient-form-sheet";
import { AllergySelect } from "@/components/allergy-select";

const CONSULTATION_TYPES = [
  { value: "WALK_IN", label: "Walk-in Registration" },
  { value: "CONSULTATION", label: "Consultation" },
  { value: "SPECIALIST", label: "Specialist Consultation" },
  { value: "EMERGENCY", label: "Emergency Consultation" },
  { value: "FOLLOW_UP", label: "Follow-up Consultation" },
  { value: "TELECONSULTATION", label: "Teleconsultation" },
] as const;

function currency(value: number) { return `₹${value.toFixed(2)}`; }

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
function localDateStr(d: Date) {
  const offset = d.getTimezoneOffset();
  return new Date(d.getTime() - offset * 60_000).toISOString().slice(0, 10);
}
function localTimeStr(d: Date) {
  const offset = d.getTimezoneOffset();
  return new Date(d.getTime() - offset * 60_000).toISOString().slice(11, 16);
}

interface EditForm {
  patient: { id: string; name: string; phone: string } | null;
  doctorId: string;
  type: string;
  fee: number;
  registrationFee: number;
  date: string;
  slot: string | null;
  notes: string;
  allergies: string[];
}

export function EditAppointmentPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { appointmentId } = useParams({ from: "/_appointments/appointments/$appointmentId/edit" });
  const [form, setForm] = useState<EditForm>({ patient: null, doctorId: "", type: "WALK_IN", fee: 0, registrationFee: 0, date: todayStr(), slot: null, notes: "", allergies: [] });
  const [formReady, setFormReady] = useState(false);
  const [patientQuery, setPatientQuery] = useState("");
  const [patientDropdownOpen, setPatientDropdownOpen] = useState(false);
  const [patientSheetOpen, setPatientSheetOpen] = useState(false);
  const [editPatientId, setEditPatientId] = useState<string | null>(null);
  const [doctorSearchQuery, setDoctorSearchQuery] = useState("");
  const [doctorSearchOpen, setDoctorSearchOpen] = useState(false);
  const [patientInfoOpen, setPatientInfoOpen] = useState(false);

  function goBack() { navigate({ to: "/appointments" }); }

  const { data: appointment, isLoading: appointmentLoading } = useQuery({
    queryKey: ["appointment", appointmentId],
    queryFn: () => fetchAppointment(appointmentId),
    enabled: !!appointmentId,
  });

  useEffect(() => {
    if (appointment && !formReady) {
      const d = new Date(appointment.date);
      setForm({
        patient: { id: appointment.patientId, name: appointment.patient.name, phone: appointment.patient.phone },
        doctorId: appointment.doctorId,
        type: appointment.type,
        fee: appointment.fee,
        registrationFee: appointment.registrationFee,
        date: localDateStr(d),
        slot: localTimeStr(d),
        notes: appointment.notes ?? "",
        allergies: appointment.patient.allergies ?? [],
      });
      setFormReady(true);
    }
  }, [appointment?.id]);

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

  const availableDoctorIds = useMemo(() => {
    if (!form.date) return new Set(doctors.map((d) => d.id));
    const dateObj = new Date(form.date + "T00:00:00");
    const dayOfWeek = (dateObj.getDay() + 6) % 7;
    const available = new Set<string>();
    for (const sched of allSchedules) {
      if (sched.dayOfWeek === dayOfWeek) {
        available.add(sched.employeeSchedulableId);
      }
    }
    return available;
  }, [allSchedules, form.date, doctors]);

  const patientResults = useQuery({
    queryKey: ["appointment-patients", patientQuery],
    queryFn: () => fetchPatients({ search: patientQuery, limit: 8 }),
    enabled: patientQuery.trim().length >= 1 && !form.patient,
  });
  const slotsQuery = useQuery({ queryKey: ["doctor-slots", form.doctorId, form.date], queryFn: () => fetchDoctorSlots(form.doctorId, form.date), enabled: !!form.doctorId && !!form.date });

  const selectedDoctorSchedule = useMemo(() => {
    if (!form.doctorId || !form.date) return null;
    const dateObj = new Date(form.date + "T00:00:00");
    const dayOfWeek = (dateObj.getDay() + 6) % 7;
    return allSchedules.find(
      (s) => s.employeeSchedulableId === form.doctorId && s.dayOfWeek === dayOfWeek
    ) ?? null;
  }, [allSchedules, form.doctorId, form.date]);

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

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (selectedPatient && JSON.stringify(selectedPatient.allergies ?? []) !== JSON.stringify(form.allergies)) {
        await updatePatient(form.patient!.id, { allergies: form.allergies });
      }
      return updateAppointment(appointmentId, {
        doctorId: form.doctorId,
        date: `${form.date}T${form.slot}:00`,
        type: form.type,
        fee: form.fee,
        registrationFee: form.registrationFee,
        notes: form.notes || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      queryClient.invalidateQueries({ queryKey: ["appointment", appointmentId] });
      toast.success("Appointment updated successfully");
      navigate({ to: "/appointments" });
    },
    onError: (err) => { toast.error(extractApiError(err)); },
  });

  const canSave = !!form.patient && !!form.doctorId && !!form.slot && !!form.type;

  if (appointmentLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-muted-foreground">Loading appointment...</p>
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="flex flex-col items-center gap-2 py-20 text-center">
        <AlertTriangle className="size-8 text-muted-foreground/50" />
        <p className="text-sm text-muted-foreground">Appointment not found</p>
        <Button variant="outline" onClick={goBack}>Back to Appointments</Button>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Edit Appointment</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Update details for {appointment.patient.name}'s appointment.
            </p>
          </div>
          <div className="hidden self-start sm:block">
            <span className={cn(
              "inline-flex items-center gap-1.5 rounded-none border px-3 py-1.5 text-[11px] font-medium uppercase tracking-wider",
              "border-primary/20 bg-primary/5 text-primary"
            )}>
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary" />
              {appointment.tokenNumber ? `#${appointment.tokenNumber}` : "Appointment"}
            </span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <Input
            type="date"
            className="w-auto"
            value={form.date}
            onChange={(e) => setForm((prev) => ({ ...prev, date: e.target.value, slot: null }))}
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
                onClick={() => setForm((prev) => ({ ...prev, date: value, slot: null }))}
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
                    <Button variant="ghost" size="icon-sm" aria-label="Clear patient" onClick={() => setForm((prev) => ({ ...prev, patient: null }))}>
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
                              onClick={() => { setForm((prev) => ({ ...prev, patient: { id: patient.id, name: patient.name, phone: patient.phone }, registrationFee: 0 })); setPatientQuery(""); setPatientDropdownOpen(false); }}
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
                      <Button variant="ghost" size="icon-sm" aria-label="Clear doctor" onClick={() => setForm((prev) => ({ ...prev, doctorId: "", slot: null }))}>
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
                        <Input
                          type="time"
                          value={form.slot ?? ""}
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
                            if (bookedSlots.includes(time)) {
                              toast.error("This time is already booked");
                              return;
                            }
                            setForm((prev) => ({ ...prev, slot: time }));
                          }}
                        />
                        {bookedSlots.length > 0 && (
                          <div>
                            <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Booked</span>
                            <div className="mt-1 flex flex-wrap gap-1">
                              {bookedSlots.map((t) => (
                                <span
                                  key={t}
                                  className="rounded-none border border-red-200 bg-red-50 px-1.5 py-0.5 text-[10px] font-medium text-red-600 line-through"
                                >
                                  {t}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
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
                        <Button variant="ghost" size="icon-sm" aria-label="Clear selected patient" onClick={() => setForm((prev) => ({ ...prev, patient: null }))}>
                          <X className="size-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>

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
                  <div className="border-t border-dashed" />
                  <div>
                    <div className="flex items-center justify-between gap-3">
                      <label htmlFor="a-reg" className="text-sm font-medium">Registration Fee</label>
                      <Input
                        id="a-reg"
                        type="number"
                        min={0}
                        className="w-24 text-right"
                        value={form.registrationFee}
                        onChange={(e) => setForm((prev) => ({ ...prev, registrationFee: Number(e.target.value) || 0 }))}
                      />
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {[50, 100, 200, 400, 500].map((val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setForm((prev) => ({ ...prev, registrationFee: val }))}
                          className={cn(
                            "rounded-none border px-2.5 py-1 text-[11px] font-medium transition-colors",
                            form.registrationFee === val
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-input text-muted-foreground hover:border-primary/50 hover:text-foreground"
                          )}
                        >
                          ₹{val}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="border-t" />
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold">Total</span>
                    <span className="text-lg font-bold text-primary">{currency(form.fee + form.registrationFee)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-end gap-4">
        <Button variant="outline" onClick={goBack}>Cancel</Button>
        <Button onClick={() => updateMutation.mutate()} disabled={!canSave || updateMutation.isPending}>
          {updateMutation.isPending ? "Saving..." : `Save Changes · ${currency(form.fee + form.registrationFee)}`}
        </Button>
      </div>

      <PatientFormSheet
        open={patientSheetOpen || !!editPatientId}
        onOpenChange={(open) => { if (!open) { setPatientSheetOpen(false); setEditPatientId(null); } }}
        editingPatient={editPatientId ? (patientResults.data?.data ?? []).find((p) => p.id === editPatientId) ?? null : null}
        onSaved={(patient) => {
          if (!editPatientId) {
            setForm((prev) => ({ ...prev, patient: { id: patient.id, name: patient.name, phone: patient.phone }, registrationFee: 0 }));
            setPatientQuery("");
          }
          setPatientSheetOpen(false);
          setEditPatientId(null);
        }} />
    </div>
  );
}
