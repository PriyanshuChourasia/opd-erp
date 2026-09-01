import { getPatientName } from "@/lib/api";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useLocation, useSearch } from "@tanstack/react-router";
import { ChevronDown, Clock, HeartPulse, History, Pencil, Plus, Search, Stethoscope, Trash2, UserPlus, X } from "lucide-react";
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
  fetchAllDoctorSchedules,
  fetchPatientVitalsLatest,
  createPatientVitals,
  deletePatientVitals,
  type AppointmentType,
  type EmployeeSchedule,
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
import { useAppSelector } from "@/store/hooks";
import { hasPermission } from "@/lib/roles";

const CONSULTATION_TYPES = [
  { value: "WALK_IN", label: "Walk-in Registration", icon: UserPlus },
  { value: "CONSULTATION", label: "Consultation", icon: Stethoscope },
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
  patient: { id: string; firstName: string; middleName?: string | null; lastName: string; contactNo: string } | null;
  doctorId: string;
  type: string;
  amount: number;
  registrationFee: number | null;
  isNewPatient: boolean;
  date: string;
  slot: string | null;
  notes: string;
  allergies: string[];
}

function emptyBookingForm(): BookingForm {
  return { patient: null, doctorId: "", type: "WALK_IN", amount: 0, registrationFee: null, isNewPatient: false, date: todayStr(), slot: null, notes: "", allergies: [] };
}

export function NewAppointmentPage({ hideTitle }: { hideTitle?: boolean } = {}) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();
  const isReceptionist = location.pathname.startsWith('/receptionist');
  const searchParams = useSearch({ strict: false }) as Record<string, string | undefined>;
  const preselectedDoctorId = searchParams.doctorId;
  const permissions = useAppSelector((state) => state.auth.user?.permissions);
  const canReadOrganisation = hasPermission(permissions, "read", "company");
  const canReadEmployeeSchedules = hasPermission(permissions, "read", "employee-schedules");
  const [form, setForm] = useState<BookingForm>(emptyBookingForm());
  const [patientQuery, setPatientQuery] = useState("");
  const [patientDropdownOpen, setPatientDropdownOpen] = useState(false);
  const [patientSheetOpen, setPatientSheetOpen] = useState(false);
  const [editPatientId, setEditPatientId] = useState<string | null>(null);
  const [doctorSearchQuery, setDoctorSearchQuery] = useState("");
  const [doctorSearchOpen, setDoctorSearchOpen] = useState(false);
  const [patientInfoOpen, setPatientInfoOpen] = useState(false);
  const [doctorFormOpen, setDoctorFormOpen] = useState(false);
  const [vitalsModalOpen, setVitalsModalOpen] = useState(false);
  const [vitalsViewOpen, setVitalsViewOpen] = useState(false);
  const [vitals, setVitals] = useState<Record<string, string>>({
    heightCm: "", weightCm: "", temperatureC: "", pulseBpm: "",
    systolicBp: "", diastolicBp: "", spo2Percent: "", respiratoryRate: "", medicalStatus: "",
  });
  // Auto-calculate BMI from height and weight
  const computedBmi = useMemo(() => {
    const h = parseFloat(vitals.heightCm ?? "");
    const w = parseFloat(vitals.weightCm ?? "");
    if (h > 0 && w > 0) return (w / ((h / 100) ** 2)).toFixed(1);
    return null;
  }, [vitals.heightCm, vitals.weightCm]);

  // Check if at least one vitals field has a value
  const hasVitalsData = useMemo(() => {
    return Object.entries(vitals).some(([key, val]) => key !== "medicalStatus" && val !== "") || vitals.medicalStatus !== "";
  }, [vitals]);

  // ── Vitals mutation ──
  const vitalsMutation = useMutation({
    mutationFn: async () => {
      if (!form.patient) return;
      const payload: Record<string, string | number> = { patientId: form.patient.id };
      if (vitals.heightCm) payload.heightCm = parseFloat(vitals.heightCm);
      if (vitals.weightCm) payload.weightKg = parseFloat(vitals.weightCm);
      if (vitals.temperatureC) payload.temperatureC = parseFloat(vitals.temperatureC);
      if (vitals.pulseBpm) payload.pulseBpm = parseInt(vitals.pulseBpm, 10);
      if (vitals.systolicBp) payload.systolicBp = parseInt(vitals.systolicBp, 10);
      if (vitals.diastolicBp) payload.diastolicBp = parseInt(vitals.diastolicBp, 10);
      if (vitals.spo2Percent) payload.spo2Percent = parseFloat(vitals.spo2Percent);
      if (vitals.respiratoryRate) payload.respiratoryRate = parseInt(vitals.respiratoryRate, 10);
      if (vitals.medicalStatus) payload.medicalStatus = vitals.medicalStatus;
      await createPatientVitals(payload as any);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patientVitals"] });
      toast.success("Vitals recorded successfully");
      setVitalsModalOpen(false);
      setVitals({ heightCm: "", weightCm: "", temperatureC: "", pulseBpm: "", systolicBp: "", diastolicBp: "", spo2Percent: "", respiratoryRate: "", medicalStatus: "" });
    },
    onError: (err) => toast.error(extractApiError(err)),
  });

  const deleteVitalsMutation = useMutation({
    mutationFn: (id: string) => deletePatientVitals(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patientVitals"] });
      toast.success("Vitals deleted");
    },
    onError: (err) => toast.error(extractApiError(err)),
  });

  const [paymentSheetOpen, setPaymentSheetOpen] = useState(false);
  const [newDoctorForm, setNewDoctorForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    username: "",
    password: "",
    mobileNumber: "",
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

  // Fetch latest vitals for selected patient
  const { data: patientVitals } = useQuery({
    queryKey: ["patientVitals", "latest", form.patient?.id],
    queryFn: () => fetchPatientVitalsLatest(form.patient!.id),
    enabled: !!form.patient?.id,
  });

  useEffect(() => {
    if (selectedPatient) {
      setForm((prev) => ({ ...prev, allergies: selectedPatient.allergies ?? [] }));
    }
  }, [selectedPatient?.id]);

  const { data: doctorsResponse } = useQuery({
    queryKey: ["doctors", "list", "all"],
    queryFn: () => fetchDoctors({ limit: 100 }),
    refetchOnMount: true,
  });
  const doctors = useMemo(() => doctorsResponse?.data ?? [], [doctorsResponse]);

  // Preselect doctor from URL search param on mount
  useEffect(() => {
    if (preselectedDoctorId && doctors.length > 0 && !form.doctorId) {
      const doctor = doctors.find((d) => d.id === preselectedDoctorId);
      if (doctor) {
        setForm((prev) => ({ ...prev, doctorId: doctor.id, slot: null, amount: doctor.consultationFee ?? prev.amount }));
      }
      // If doctor not found (invalid/stale id), fail silently — leave field unset
    }
  }, [preselectedDoctorId, doctors]); // eslint-disable-line react-hooks/exhaustive-deps

  // Only one doctor in the system — default-select them so the receptionist
  // doesn't have to pick from a list of one.
  useEffect(() => {
    const doctor = doctors[0];
    if (!preselectedDoctorId && doctors.length === 1 && doctor && !form.doctorId) {
      setForm((prev) => ({ ...prev, doctorId: doctor.id, slot: null, amount: doctor.consultationFee ?? prev.amount }));
    }
  }, [preselectedDoctorId, doctors]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch all doctor schedules in one call (no dependency on doctors list)
  const { data: allSchedules = [] } = useQuery({
    queryKey: ["employee-schedules", "all-doctors"],
    queryFn: async (): Promise<EmployeeSchedule[]> => {
      const res = await fetchAllDoctorSchedules();
      return res?.data ?? [];
    },
    enabled: canReadEmployeeSchedules,
    refetchOnMount: true,
    staleTime: 0,
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
  const slotsQuery = useQuery({ queryKey: ["doctor-slots", form.doctorId, form.date], queryFn: () => fetchDoctorSlots(form.doctorId, form.date), enabled: canReadEmployeeSchedules && !!form.doctorId && !!form.date });

  // ── Selected doctor's schedule for the chosen date ──
  const selectedDoctorSchedule = useMemo(() => {
    if (!form.doctorId || !form.date) return null;
    const dateObj = new Date(form.date + "T00:00:00");
    const dayOfWeek = (dateObj.getDay() + 6) % 7;
    return allSchedules.find(
      (s) => s.employeeSchedulableId === form.doctorId && s.dayOfWeek === dayOfWeek
    ) ?? null;
  }, [allSchedules, form.doctorId, form.date]);

  // ── Auto-advance date to next available weekday when current date has no schedule ──
  useEffect(() => {
    if (!form.doctorId || !allSchedules.length || !form.date) return;
    if (selectedDoctorSchedule) return; // current date has a schedule, no need to advance
    // Find next available date (up to 14 days ahead)
    const base = new Date(form.date + "T00:00:00");
    for (let i = 1; i <= 14; i++) {
      const next = new Date(base);
      next.setDate(next.getDate() + i);
      const dow = (next.getDay() + 6) % 7;
      const hasSchedule = allSchedules.some(
        (s) => s.employeeSchedulableId === form.doctorId && s.dayOfWeek === dow,
      );
      if (hasSchedule) {
        const offset = next.getTimezoneOffset();
        const nextStr = new Date(next.getTime() - offset * 60_000).toISOString().slice(0, 10);
        setForm((prev) => ({ ...prev, date: nextStr, slot: null }));
        break;
      }
    }
  }, [form.doctorId, form.date, allSchedules, selectedDoctorSchedule]);

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

  const { data: organisation } = useQuery({ queryKey: ["organisation"], queryFn: fetchOrganisation, enabled: canReadOrganisation });
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
        amount: form.amount,
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
        amount: form.amount,
        ...(form.registrationFee !== null ? { registrationFee: form.registrationFee } : {}),
        notes: form.notes || undefined,
      });
      await checkoutAppointment(appointment.id, {
        paymentMethod: payload.paymentMethod,
        ...(payload.referenceNumber ? { referenceNumber: payload.referenceNumber } : {}),
        discountRuleId: payload.discountRuleId,
        tax: payload.tax > 0 ? payload.tax : undefined,
        paidAmount: payload.paidAmount,
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
      setForm((prev) => ({ ...prev, doctorId: doctor.id, slot: null, amount: doctor.consultationFee ?? prev.amount }));
      setDoctorFormOpen(false);
      setNewDoctorForm({ firstName: "", lastName: "", email: "", username: "", password: "", mobileNumber: "", medicalRegistrationNo: "", specialization: "", consultationFee: 0 });
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
            {/* ── Left Column: Patient + Doctor → Allergies ── */}
            <div className="space-y-6">
              {/* ── Patient + Doctor (side by side) ── */}
              <div className="flex gap-4">
              {/* ── Patient ── */}
              <div className="flex-1 space-y-1.5 min-w-0">
                <label className="text-sm font-medium leading-none">Patient *</label>
                <div className="relative">
                  <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search patient by name or phone"
                    className="pl-9"
                    value={form.patient && selectedPatient ? getPatientName(selectedPatient) : patientQuery}
                    onChange={(e) => {
                      if (form.patient) {
                        setForm((prev) => ({ ...prev, patient: null }));
                        setPatientQuery(e.target.value);
                      } else {
                        setPatientQuery(e.target.value);
                      }
                      setPatientDropdownOpen(true);
                    }}
                    onFocus={() => { if (form.patient) { setPatientQuery(''); } setPatientDropdownOpen(true); }}
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
                            onClick={() => { setForm((prev) => ({ ...prev, patient: { id: patient.id, firstName: patient.firstName, middleName: patient.middleName, lastName: patient.lastName, contactNo: patient.contactNo }, isNewPatient: false, registrationFee: null })); setPatientQuery(''); setPatientDropdownOpen(false); }}
                          >
                            <span className="font-medium">{getPatientName(patient)}</span>
                            <span className="text-xs text-muted-foreground">{patient.contactNo}</span>
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
              </div>

              {/* ── Doctor ── */}
              <div className="flex-1 space-y-1.5 min-w-0">
                <label className="text-sm font-medium leading-none">Doctor *</label>
                <div className="relative">
                  <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="a-doctor"
                    placeholder="Search doctor..."
                    className="pl-9"
                    value={form.doctorId ? (doctors.find((d) => d.id === form.doctorId)?.name ?? '') : doctorSearchQuery}
                    onChange={(e) => {
                      if (form.doctorId) {
                        setForm((prev) => ({ ...prev, doctorId: '', slot: null }));
                        setDoctorSearchQuery(e.target.value);
                      } else {
                        setDoctorSearchQuery(e.target.value);
                      }
                      setDoctorSearchOpen(true);
                    }}
                    onFocus={() => { if (form.doctorId) { setDoctorSearchQuery(''); } setDoctorSearchOpen(true); }}
                    onBlur={() => setTimeout(() => setDoctorSearchOpen(false), 200)}
                  />
                  {doctorSearchOpen && (!form.doctorId || doctorSearchQuery.trim().length >= 1) && (
                    <div className="absolute z-50 mt-1 max-h-56 w-full overflow-y-auto rounded-none border bg-popover shadow-md">
                      {doctors
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
                              setForm((prev) => ({ ...prev, doctorId: d.id, slot: null, amount: d.consultationFee ?? prev.amount }));
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
                      {doctors.length === 0 && (
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
              </div>
              </div>

              {/* ── Allergies ── */}
              <Field><FieldLabel>Allergies</FieldLabel>
                <AllergySelect
                  value={form.allergies}
                  onChange={(allergies) => setForm((prev) => ({ ...prev, allergies }))}
                />
              </Field>

              {/* ── Slot + Consultation type (side by side) ── */}
              <div className="grid grid-cols-2 gap-4">
                <Field><FieldLabel>Slot *</FieldLabel>
                  {form.doctorId ? (
                    slotsQuery.isLoading ? (
                      <p className="text-sm text-muted-foreground">Loading slots...</p>
                    ) : !selectedDoctorSchedule ? (
                      <div className="space-y-2">
                        <p className="text-sm text-amber-600">No schedule for this day. Select a different date.</p>
                        <Input
                          type="time"
                          value={form.slot ?? ""}
                          onChange={(e) => setForm((prev) => ({ ...prev, slot: e.target.value || null }))}
                        />
                      </div>
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
                    )
                  ) : (
                    <div className="flex h-9.5 items-center rounded-none border border-dashed border-input bg-muted/30 px-3">
                      <p className="text-sm text-muted-foreground/60">Select a doctor to view available slots</p>
                    </div>
                  )}
                </Field>
                <Field><FieldLabel>Consultation type *</FieldLabel>
                  <div className="grid grid-cols-1 gap-2">
                    {CONSULTATION_TYPES.map((t) => {
                      const Icon = t.icon;
                      return (
                        <button key={t.value} type="button" className={cn("flex items-center gap-2 rounded-none border px-3 py-2 text-left text-xs", form.type === t.value ? "border-primary bg-primary/10 text-primary" : "text-muted-foreground")} onClick={() => setForm((prev) => ({ ...prev, type: t.value }))}>
                          <Icon className="size-4 shrink-0" />
                          <p className="font-medium text-foreground">{t.label}</p>
                        </button>
                      );
                    })}
                  </div>
                </Field>
              </div>

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
                      {selectedPatient ? getPatientName(selectedPatient).charAt(0).toUpperCase() : "?"}
                    </div>
                    <div>
                      <p className={cn("text-sm font-semibold", !selectedPatient && "text-muted-foreground")}>
                        {selectedPatient ? getPatientName(selectedPatient) : "Patient Name"}
                      </p>
                      <p className={cn("text-xs", selectedPatient ? "text-muted-foreground" : "text-muted-foreground/50")}>
                        {selectedPatient ? selectedPatient.contactNo : "Phone number"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {selectedPatient && (
                      <>
                        <Button
                          size="sm"
                          className="gap-1.5 text-xs"
                          onClick={() => setVitalsViewOpen(true)}
                        >
                          <HeartPulse className="size-3" />
                          Patient Vitals
                        </Button>
                        <Button
                          size="sm"
                          className="gap-1.5 text-xs"
                          onClick={() => setEditPatientId(selectedPatient.id)}
                        >
                          <Pencil className="size-3" />
                          Edit
                        </Button>
                        <Button variant="ghost" size="icon-sm" title="Clear patient" aria-label="Clear patient" onClick={() => setForm((prev) => ({ ...prev, patient: null, allergies: [] }))}>
                          <X className="size-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                {/* Details grid — 3 columns */}
                <div className="grid grid-cols-3 gap-x-4 gap-y-3 px-4 py-3 text-sm">
                  <PlaceholderField label="Gender" value={selectedPatient?.gender} />
                  <PlaceholderField
                    label="Age / DOB"
                    value={selectedPatient?.dateOfBirth ? `${Math.floor((Date.now() - new Date(selectedPatient.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))} yrs` : undefined}
                  />
                  <PlaceholderField label="Blood Group" value={selectedPatient?.bloodGroup} />
                  <PlaceholderField label="Email" value={selectedPatient?.email} />
                  <PlaceholderField label="Registered On" value={selectedPatient?.createdAt ? new Date(selectedPatient.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : undefined} />
                  <div>
                    <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Address</span>
                    <p className={cn("mt-0.5 truncate", selectedPatient?.address ? "" : "text-muted-foreground/50")}>
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
                    patientInfoOpen ? "max-h-200 opacity-100" : "max-h-0 opacity-0"
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
                    </div>              </div>
              </div>
              </div>

              {/* ── Invoice-style Fee Summary ── */}
              <div className="rounded-none border">
                <div className="px-4 py-4">
                  {/* Column headers */}
                  <div className="grid grid-cols-[1fr_auto] gap-4 pb-2 border-b">
                    <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Fee Type</span>
                    <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground text-right">Amount</span>
                  </div>

                  {/* Consultation Fee */}
                  <div className="grid grid-cols-[1fr_auto] gap-4 items-center py-3">
                    <label htmlFor="a-fee" className="text-sm font-medium">Consultation Fee</label>
                    <Input
                      id="a-fee"
                      type="number"
                      min={0}
                      className="w-28 text-right h-8 text-xs"
                      value={form.amount}
                      onChange={(e) => setForm((prev) => ({ ...prev, amount: Math.max(0, Number(e.target.value) || 0) }))}
                    />
                  </div>
                  <div className="flex flex-wrap gap-1.5 pb-3">
                    {[0, 50, 100, 200, 400, 500, 1000].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setForm((prev) => ({ ...prev, amount: val }))}
                        className={cn(
                          "w-14 text-center rounded-none border px-2 py-0.5 text-[11px] font-medium transition-colors",
                          form.amount === val
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-input text-muted-foreground hover:border-primary/50 hover:text-foreground"
                        )}
                      >
                        ₹{val}
                      </button>
                    ))}
                  </div>

                  {/* Divider */}
                  <div className="border-t border-dashed" />

                  {/* Registration Fee */}
                  <div className="grid grid-cols-[1fr_auto] gap-4 items-center py-3">
                    <label htmlFor="a-reg" className="text-sm font-medium">Registration Fee</label>
                    <Input
                      id="a-reg"
                      type="number"
                      min={0}
                      className="w-28 text-right h-8 text-xs"
                      value={regFeeAmount}
                      onChange={(e) => setForm((prev) => ({ ...prev, registrationFee: Math.max(0, Number(e.target.value) || 0) }))}
                    />
                  </div>
                  <div className="flex flex-wrap gap-1.5 pb-3">
                    {[50, 100, 200, 400, 500].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setForm((prev) => ({ ...prev, registrationFee: val }))}
                        className={cn(
                          "w-14 text-center rounded-none border px-2 py-0.5 text-[11px] font-medium transition-colors",
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

                  {/* Divider */}
                  <div className="border-t border-dashed" />

                  {/* Total */}
                  <div className="border-t" />
                  <div className="grid grid-cols-[1fr_auto] gap-4 items-center pt-3">
                    <span className="text-sm font-semibold">Total</span>
                    <span className="text-lg font-bold text-primary">{currency(Math.max(0, form.amount + regFeeAmount))}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="sticky bottom-0 left-0 right-0 z-40 border-t bg-background px-6 py-3">
        <div className="flex items-center justify-end gap-4">
          <Button variant="outline" onClick={goBack}>Cancel</Button>
          <div className="flex items-center gap-2">
            <Button onClick={() => createMutation.mutate()} disabled={!canBook || createMutation.isPending || bookAndPayMutation.isPending}>
              {createMutation.isPending ? "Booking..." : "Book"}
            </Button>
            <Button
              variant="default"
              className="gap-1.5"
              onClick={() => setPaymentSheetOpen(true)}
              disabled={!canBook || bookAndPayMutation.isPending || createMutation.isPending}
            >
              {bookAndPayMutation.isPending ? "Processing..." : "Book & Pay"}
            </Button>
          </div>
        </div>
      </div>

      <PatientFormSheet
        open={patientSheetOpen || !!editPatientId}
        onOpenChange={(open) => { if (!open) { setPatientSheetOpen(false); setEditPatientId(null); } }}
        editingPatient={editPatientId ? (selectedPatient?.id === editPatientId ? selectedPatient : (patientResults.data?.data ?? []).find((p) => p.id === editPatientId) ?? null) : null}
        onSaved={(patient) => {
          if (!editPatientId) {
            setForm((prev) => ({ ...prev, patient: { id: patient.id, firstName: patient.firstName, middleName: patient.middleName, lastName: patient.lastName, contactNo: patient.contactNo }, isNewPatient: true, registrationFee: null }));
            setPatientQuery("");
          }
          setPatientSheetOpen(false);
          setEditPatientId(null);
        }} />

      {/* ── Payment Sheet ── */}
      <PaymentSheet
        open={paymentSheetOpen}
        onOpenChange={setPaymentSheetOpen}
        subtotal={Math.max(0, form.amount + regFeeAmount)}
        isPending={bookAndPayMutation.isPending}
        onSubmit={(payload) => bookAndPayMutation.mutate(payload)}
        submitLabel="Confirm & Book"
      />

      {/* ── New Doctor Sheet ── */}
      <Sheet open={doctorFormOpen} onOpenChange={(open) => { if (!open) { setDoctorFormOpen(false); setNewDoctorForm({ firstName: "", lastName: "", email: "", username: "", password: "", mobileNumber: "", medicalRegistrationNo: "", specialization: "", consultationFee: 0 }); }}}>
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
            <div className="grid grid-cols-2 gap-3">
              <Field>
                <FieldLabel>Email *</FieldLabel>
                <Input type="email" placeholder="doctor@clinic.com" value={newDoctorForm.email} onChange={(e) => setNewDoctorForm((p) => ({ ...p, email: e.target.value }))} />
              </Field>
              <Field>
                <FieldLabel>Mobile Number *</FieldLabel>
                <Input placeholder="9876543210" value={newDoctorForm.mobileNumber} onChange={(e) => setNewDoctorForm((p) => ({ ...p, mobileNumber: e.target.value }))} />
              </Field>
            </div>
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
            <Button variant="outline" onClick={() => { setDoctorFormOpen(false); setNewDoctorForm({ firstName: "", lastName: "", email: "", username: "", password: "", mobileNumber: "", medicalRegistrationNo: "", specialization: "", consultationFee: 0 }); }}>
              Cancel
            </Button>
            <Button
              onClick={() => createDoctorMutation.mutate({
                firstName: newDoctorForm.firstName.trim(),
                lastName: newDoctorForm.lastName.trim(),
                email: newDoctorForm.email.trim(),
                mobileNumber: newDoctorForm.mobileNumber.trim(),
                username: newDoctorForm.username.trim(),
                password: newDoctorForm.password,
                medicalRegistrationNo: newDoctorForm.medicalRegistrationNo.trim(),
                specialization: newDoctorForm.specialization.trim() || undefined,
                consultationFee: newDoctorForm.consultationFee > 0 ? newDoctorForm.consultationFee : undefined,
              })}
              disabled={!newDoctorForm.firstName.trim() || !newDoctorForm.lastName.trim() || !newDoctorForm.email.trim() || !newDoctorForm.mobileNumber.trim() || !newDoctorForm.username.trim() || !newDoctorForm.password.trim() || !newDoctorForm.medicalRegistrationNo.trim() || createDoctorMutation.isPending}
            >
              {createDoctorMutation.isPending ? "Creating..." : "Create & Select"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* ── Patient Vitals Sheet ── */}
      <Sheet open={vitalsModalOpen} onOpenChange={(open) => {
        if (!open) {
          setVitalsModalOpen(false);
          setVitals({ heightCm: "", weightCm: "", temperatureC: "", pulseBpm: "", systolicBp: "", diastolicBp: "", spo2Percent: "", respiratoryRate: "", medicalStatus: "" });
        }
      }}>
        <SheetContent side="right" className="sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Record Patient Vitals</SheetTitle>
            <SheetDescription>
              {form.patient ? `${form.patient.firstName} ${form.patient.lastName}` : 'Patient'}
            </SheetDescription>
          </SheetHeader>
          <div className="space-y-5 px-4 py-4">
            {/* ── Body Measurements ── */}
            <div>
              <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Body Measurements</span>
              <div className="mt-2 grid grid-cols-2 gap-3">
                <Field>
                  <FieldLabel className="text-[10px]">Height (cm)</FieldLabel>
                  <Input className="h-8 text-xs" type="number" placeholder="170" value={vitals.heightCm} onChange={(e) => setVitals((v) => ({ ...v, heightCm: e.target.value }))} />
                </Field>
                <Field>
                  <FieldLabel className="text-[10px]">Weight (kg)</FieldLabel>
                  <Input className="h-8 text-xs" type="number" placeholder="70" value={vitals.weightCm} onChange={(e) => setVitals((v) => ({ ...v, weightCm: e.target.value }))} />
                </Field>
              </div>
              {computedBmi && (
                <div className="mt-2 rounded-none border border-dashed border-input bg-muted/30 px-3 py-1.5">
                  <span className="text-[10px] text-muted-foreground">BMI</span>
                  <span className="ml-2 text-xs font-semibold">{computedBmi} kg/m²</span>
                </div>
              )}
            </div>

            {/* ── Vital Signs ── */}
            <div>
              <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Vital Signs</span>
              <div className="mt-2 grid grid-cols-2 gap-3">
                <Field>
                  <FieldLabel className="text-[10px]">Temperature (°F)</FieldLabel>
                  <Input className="h-8 text-xs" type="number" step="0.1" placeholder="98.6" value={vitals.temperatureC} onChange={(e) => setVitals((v) => ({ ...v, temperatureC: e.target.value }))} />
                </Field>
                <Field>
                  <FieldLabel className="text-[10px]">Pulse (bpm)</FieldLabel>
                  <Input className="h-8 text-xs" type="number" placeholder="72" value={vitals.pulseBpm} onChange={(e) => setVitals((v) => ({ ...v, pulseBpm: e.target.value }))} />
                </Field>
                <Field>
                  <FieldLabel className="text-[10px]">Systolic BP (mmHg)</FieldLabel>
                  <Input className="h-8 text-xs" type="number" placeholder="120" value={vitals.systolicBp} onChange={(e) => setVitals((v) => ({ ...v, systolicBp: e.target.value }))} />
                </Field>
                <Field>
                  <FieldLabel className="text-[10px]">Diastolic BP (mmHg)</FieldLabel>
                  <Input className="h-8 text-xs" type="number" placeholder="80" value={vitals.diastolicBp} onChange={(e) => setVitals((v) => ({ ...v, diastolicBp: e.target.value }))} />
                </Field>
                <Field>
                  <FieldLabel className="text-[10px]">SpO₂ (%)</FieldLabel>
                  <Input className="h-8 text-xs" type="number" placeholder="98" value={vitals.spo2Percent} onChange={(e) => setVitals((v) => ({ ...v, spo2Percent: e.target.value }))} />
                </Field>
                <Field>
                  <FieldLabel className="text-[10px]">Resp. Rate (/min)</FieldLabel>
                  <Input className="h-8 text-xs" type="number" placeholder="16" value={vitals.respiratoryRate} onChange={(e) => setVitals((v) => ({ ...v, respiratoryRate: e.target.value }))} />
                </Field>
              </div>
            </div>

            {/* ── Clinical Context ── */}
            <div>
              <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Clinical Context</span>
              <div className="mt-2">
                <Field>
                  <FieldLabel className="text-[10px]">Medical Status</FieldLabel>
                  <select
                    className="flex h-8 w-full rounded-none border border-input bg-background px-2 text-xs"
                    value={vitals.medicalStatus}
                    onChange={(e) => setVitals((v) => ({ ...v, medicalStatus: e.target.value }))}
                  >
                    <option value="">Select status...</option>
                    <option value="Before Fasting">Before Fasting</option>
                    <option value="After Fasting">After Fasting</option>
                    <option value="Before Meals">Before Meals</option>
                    <option value="After Meals">After Meals</option>
                    <option value="Before Sleep">Before Sleep</option>
                    <option value="After Waking Up">After Waking Up</option>
                    <option value="After Exercise">After Exercise</option>
                    <option value="At Rest">At Rest</option>
                    <option value="During Stress">During Stress</option>
                    <option value="Before Medication">Before Medication</option>
                    <option value="After Medication">After Medication</option>
                    <option value="During Menstruation">During Menstruation</option>
                    <option value="Pregnancy">Pregnancy</option>
                    <option value="Post Surgery">Post Surgery</option>
                    <option value="Other">Other</option>
                  </select>
                </Field>
              </div>
            </div>
          </div>
          <SheetFooter>
            <Button variant="outline" onClick={() => {
              setVitalsModalOpen(false);
              setVitals({ heightCm: "", weightCm: "", temperatureC: "", pulseBpm: "", systolicBp: "", diastolicBp: "", spo2Percent: "", respiratoryRate: "", medicalStatus: "" });
            }}>Cancel</Button>
            <Button disabled={!hasVitalsData || vitalsMutation.isPending} onClick={() => vitalsMutation.mutate()}>
              {vitalsMutation.isPending ? "Saving..." : "Record Vitals"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* ── View Patient Vitals Sheet ── */}
      <Sheet open={vitalsViewOpen} onOpenChange={(open) => { if (!open) setVitalsViewOpen(false); }}>
        <SheetContent side="right" className="sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <HeartPulse className="size-5 text-rose-500" />
              Patient Vitals
            </SheetTitle>
            <SheetDescription>
              {form.patient ? `${form.patient.firstName} ${form.patient.lastName}` : ''}
            </SheetDescription>
          </SheetHeader>
          <div className="space-y-4 px-4 py-4">
            {patientVitals && (
              <div className="rounded-none border p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground">Latest Vitals</span>
                  <span className="text-[10px] text-muted-foreground">{new Date(patientVitals.recordedAt).toLocaleString()}</span>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
                  {patientVitals.heightCm != null && (
                    <div><span className="text-[10px] text-muted-foreground">Height</span><p className="font-medium">{patientVitals.heightCm} cm</p></div>
                  )}
                  {patientVitals.weightKg != null && (
                    <div><span className="text-[10px] text-muted-foreground">Weight</span><p className="font-medium">{patientVitals.weightKg} kg</p></div>
                  )}
                  {patientVitals.bmi != null && (
                    <div><span className="text-[10px] text-muted-foreground">BMI</span><p className="font-medium">{patientVitals.bmi}</p></div>
                  )}
                  {patientVitals.temperatureC != null && (
                    <div><span className="text-[10px] text-muted-foreground">Temp</span><p className="font-medium">{patientVitals.temperatureC}°F</p></div>
                  )}
                  {patientVitals.pulseBpm != null && (
                    <div><span className="text-[10px] text-muted-foreground">Pulse</span><p className="font-medium">{patientVitals.pulseBpm} bpm</p></div>
                  )}
                  {patientVitals.systolicBp != null && patientVitals.diastolicBp != null && (
                    <div><span className="text-[10px] text-muted-foreground">BP</span><p className="font-medium">{patientVitals.systolicBp}/{patientVitals.diastolicBp} mmHg</p></div>
                  )}
                  {patientVitals.spo2Percent != null && (
                    <div><span className="text-[10px] text-muted-foreground">SpO₂</span><p className="font-medium">{patientVitals.spo2Percent}%</p></div>
                  )}
                  {patientVitals.respiratoryRate != null && (
                    <div><span className="text-[10px] text-muted-foreground">Resp Rate</span><p className="font-medium">{patientVitals.respiratoryRate}/min</p></div>
                  )}
                </div>
                <div className="mt-3 flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => { setVitalsViewOpen(false); setVitalsModalOpen(true); }}
                  >
                    <Plus className="size-3.5" /> Add New Vitals
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => {
                      if (confirm('Delete this vitals record?')) {
                        deleteVitalsMutation.mutate(patientVitals.id, {
                          onSuccess: () => { setVitalsViewOpen(false); }
                        });
                      }
                    }}
                    disabled={deleteVitalsMutation.isPending}
                  >
                    <Trash2 className="size-3.5" /> Delete
                  </Button>
                </div>
              </div>
            )}
            {!patientVitals && (
              <div className="rounded-none border p-4 text-center space-y-3">
                <p className="text-xs text-muted-foreground">No vitals recorded yet for this patient.</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { setVitalsViewOpen(false); setVitalsModalOpen(true); }}
                >
                  <Plus className="size-3.5" /> Add Vitals
                </Button>
              </div>
            )}
          </div>
          <SheetFooter>
            <Button variant="outline" onClick={() => setVitalsViewOpen(false)}>Close</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
