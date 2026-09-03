import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CalendarDays,
  Clock,
  Search,
  Stethoscope,
  User,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { extractApiError } from "@/lib/axios-client";
import { createAppointment, fetchAppointments, getPatientName, updateAppointmentStatus, type Appointment, type AppointmentStatus } from "@/lib/api";
import { useCurrentUser } from "@/hooks/use-current-user";
import {
  usePatientSearch,
  usePatient,
  useDoctors,
  useDoctorSlots,
  useDoctorSchedules,
} from "../data/hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { DatePicker } from "@/components/ui/date-picker"

/* ─── Helpers ────────────────────────────────────────────── */

function todayStr() {
  const d = new Date();
  const offset = d.getTimezoneOffset();
  return new Date(d.getTime() - offset * 60_000).toISOString().slice(0, 10);
}

function generateTimeSlots(start: string, end: string, intervalMinutes: number): string[] {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  const startMin = (sh ?? 0) * 60 + (sm ?? 0);
  const endMin = (eh ?? 0) * 60 + (em ?? 0);
  const slots: string[] = [];
  for (let m = startMin; m < endMin; m += intervalMinutes) {
    const h = Math.floor(m / 60);
    const min = m % 60;
    slots.push(`${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`);
  }
  return slots;
}

const consultationTypes = [
  { value: "WALK_IN", label: "Walk-in" },
  { value: "FOLLOW_UP", label: "Follow-up" },
];

/* ─── Main Component ─────────────────────────────────────── */

/**
 * Appointments page — book appointments for patients.
 *
 * SRP: Each sub-section (PatientSearch, SlotPicker, BookingForm)
 * is extracted into its own component. This file is the orchestrator.
 */
const APPT_STATUS_STYLES: Record<string, string> = {
  SCHEDULED: "bg-amber-100 text-amber-700",
  CONFIRMED: "bg-blue-100 text-blue-700",
  IN_PROGRESS: "bg-blue-100 text-blue-700",
  COMPLETED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
  CHECKED_IN: "bg-blue-100 text-blue-700",
};

const APPT_STATUSES: AppointmentStatus[] = ["SCHEDULED", "CONFIRMED", "IN_PROGRESS", "COMPLETED"];

function apptStatusLabel(status: string) {
  if (status === 'IN_PROGRESS') return 'In-Queue';
  return status.replace('_', ' ');
}

export function AdminAppointments() {
  const user = useCurrentUser();
  const queryClient = useQueryClient();

  const [patientId, setPatientId] = useState<string | null>(null);
  const [doctorId, setDoctorId] = useState("");
  const [slot, setSlot] = useState<string | null>(null);
  const [date, setDate] = useState(todayStr());
  const [type, setType] = useState("WALK_IN");

  // ── Date range filter for appointments list ──
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
  });
  const [dateTo, setDateTo] = useState(todayStr());

  // ── Fetch this doctor's appointments ──
  const doctorIdForQuery = user?.userableType === 'Doctor' && user?.userableId ? user.userableId : undefined;
  const { data: appointmentsResponse, isLoading: appointmentsLoading } = useQuery({
    queryKey: ['doctor-admin', 'my-appointments', doctorIdForQuery, dateFrom, dateTo],
    queryFn: () => fetchAppointments({
      doctorId: doctorIdForQuery,
      from: dateFrom ? `${dateFrom}T00:00:00` : undefined,
      to: dateTo ? `${dateTo}T23:59:59` : undefined,
      page: 1,
      limit: 100,
    }),
    enabled: !!doctorIdForQuery,
  });
  const myAppointments = useMemo(() => appointmentsResponse?.data ?? [], [appointmentsResponse]);

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: AppointmentStatus }) =>
      updateAppointmentStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctor-admin', 'my-appointments'] });
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['queue'] });
      toast.success('Appointment status updated');
    },
    onError: (err) => toast.error(extractApiError(err)),
  });

  const { data: selectedPatient } = usePatient(patientId ?? undefined);
  const { data: doctorsResponse } = useDoctors();
  const doctors = useMemo(() => doctorsResponse?.data ?? [], [doctorsResponse]);
  const { data: allSchedules = [] } = useDoctorSchedules();
  const { data: slotsData, isLoading: slotsLoading } = useDoctorSlots(doctorId, date);

  const selectedDoctor = doctors.find((d) => d.id === doctorId);

  const selectedSchedule = useMemo(() => {
    if (!doctorId || !date) return null;
    const dateObj = new Date(date + "T00:00:00");
    const dayOfWeek = (dateObj.getDay() + 6) % 7;
    return allSchedules.find((s) => s.employeeSchedulableId === doctorId && s.dayOfWeek === dayOfWeek) ?? null;
  }, [allSchedules, doctorId, date]);

  const bookedSlots = useMemo(() => {
    if (!slotsData?.slots) return [];
    return slotsData.slots.filter((s) => s.booked > 0).map((s) => s.time);
  }, [slotsData]);

  const availableSlots = useMemo(() => {
    if (!selectedSchedule) return [];
    const all = generateTimeSlots(selectedSchedule.startTime, selectedSchedule.endTime, 30);
    const now = new Date();
    const isToday = date === todayStr();
    const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    return all.filter((t) => !bookedSlots.includes(t) && !(isToday && t < currentTime));
  }, [selectedSchedule, bookedSlots, date]);

  const createMutation = useMutation({
    mutationFn: () =>        createAppointment({
          patientId: patientId!,
          doctorId: doctorId,
          date: `${date}T${slot}:00`,
          type: type as any,
          amount: selectedDoctor?.consultationFee ?? 0,
        }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["doctor-admin"] });
      toast.success("Appointment booked successfully!");
      setPatientId(null);
      setSlot(null);
      setType("WALK_IN");
    },
    onError: (err) => toast.error(extractApiError(err)),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Appointments</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Book new appointments and view your schedule.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 text-sm">
            <CalendarDays className="size-4 text-muted-foreground" />
            <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="h-8 w-36 text-xs" />
            <span className="text-muted-foreground">to</span>
            <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="h-8 w-36 text-xs" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* ─── Left: Patient + Slots ─────────────────────── */}
        <div className="space-y-4">
          <PatientSearch patientId={patientId} onSelect={setPatientId} />

          {/* Doctor select */}
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium">
              <Stethoscope className="size-4" />
              Doctor
            </label>
            <Select value={doctorId} onValueChange={(v) => { setDoctorId(v); setSlot(null); }}>
              <SelectTrigger>
                <SelectValue placeholder="Select doctor" />
              </SelectTrigger>
              <SelectContent>
                {doctors.map((doc) => (
                  <SelectItem key={doc.id} value={doc.id}>
                    Dr. {doc.name ?? "Unknown"}
                    {doc.specialization ? ` (${doc.specialization})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Slot picker */}
          {doctorId && date && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-base">
                  <span className="flex items-center gap-2">
                    <Clock className="size-4" />
                    Available Slots
                  </span>
                  {bookedSlots.length > 0 && (
                    <Badge variant="outline" className="text-[10px]">
                      {bookedSlots.length} booked
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {slotsLoading ? (
                  <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
                    {Array.from({ length: 12 }).map((_, i) => (
                      <Skeleton key={i} className="h-9 rounded-lg" />
                    ))}
                  </div>
                ) : !selectedSchedule ? (
                  <p className="text-sm text-amber-600">No schedule for this doctor on this date.</p>
                ) : availableSlots.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No available slots for this date.</p>
                ) : (
                  <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
                    {availableSlots.map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setSlot(t)}
                        className={cn(
                          "rounded-lg border px-2 py-2 text-xs font-mono font-medium transition-all",
                          slot === t
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-muted text-foreground hover:border-primary/50 hover:bg-primary/5"
                        )}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Booking summary */}
          {patientId && slot && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">
                      {selectedPatient ? getPatientName(selectedPatient) : "Loading..."}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {date} at {slot} · {consultationTypes.find((c) => c.value === type)?.label}
                    </p>
                  </div>
                  <Button
                    onClick={() => createMutation.mutate()}
                    disabled={createMutation.isPending}
                  >
                    {createMutation.isPending ? "Booking..." : "Book Appointment"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* ─── Right: Patient Info ──────────────────────── */}
        <div>
          {selectedPatient ? (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <User className="size-4" />
                  Patient Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                    {getPatientName(selectedPatient).charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium">{getPatientName(selectedPatient)}</p>
                    <p className="text-sm text-muted-foreground">{selectedPatient.contactNo}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-[10px] uppercase text-muted-foreground">Gender</p>
                    <p>{selectedPatient.gender || "—"}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase text-muted-foreground">Blood Group</p>
                    <p>{selectedPatient.bloodGroup || "—"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
              <User className="mb-3 size-10 text-muted-foreground/40" />
              <p className="text-sm font-medium text-muted-foreground">No patient selected</p>
              <p className="mt-1 text-xs text-muted-foreground/60">
                Search and select a patient from the left
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── My Appointments List ── */}
      {doctorIdForQuery && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">My Appointments</h2>
            <span className="text-sm text-muted-foreground">{myAppointments.length} appointment(s)</span>
          </div>
          {appointmentsLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : myAppointments.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-center">
              <CalendarDays className="mb-3 size-10 text-muted-foreground/40" />
              <p className="text-sm font-medium text-muted-foreground">No appointments found</p>
              <p className="mt-1 text-xs text-muted-foreground/60">
                No appointments in the selected date range
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {myAppointments.map((appt) => (
                <div key={appt.id} className="flex items-center justify-between rounded-lg border px-4 py-3">
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <p className="text-lg font-bold text-primary">
                        {new Date(appt.date).toLocaleDateString('en-IN', { day: '2-digit' })}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {new Date(appt.date).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                    <div className="border-l pl-4">
                      <p className="text-sm font-medium">
                        {appt.patient ? getPatientName(appt.patient) : 'Unknown Patient'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(appt.date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} · {appt.type.replace('_', ' ')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold">₹{appt.amount.toFixed(2)}</span>
                    {(appt.status === 'SCHEDULED' || appt.status === 'CONFIRMED') ? (
                      <Button
                        size="sm"
                        className="h-8 text-xs"
                        onClick={() => statusMutation.mutate({ id: appt.id, status: 'IN_PROGRESS' })}
                        disabled={statusMutation.isPending}
                      >
                        Start Consultation
                      </Button>
                    ) : (
                      <Badge variant="outline" className={cn('text-[10px]', APPT_STATUS_STYLES[appt.status] ?? '')}>
                        {appt.status === 'IN_PROGRESS' ? 'In Progress' : appt.status.replace('_', ' ')}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Patient Search ─────────────────────────────────────── */

/**
 * Patient search dropdown — SRP: search and select a patient.
 */
function PatientSearch({
  patientId,
  onSelect,
}: {
  patientId: string | null;
  onSelect: (id: string | null) => void;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const { data: selectedPatient } = usePatient(patientId ?? undefined);
  const { data: searchResults, isLoading } = usePatientSearch(query, query.trim().length >= 1 && !patientId);

  return (
    <div>
      <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium">
        <User className="size-4" />
        Select Patient
      </label>
      {patientId && selectedPatient ? (
        <div className="flex items-center justify-between rounded-lg border bg-muted/30 px-3 py-2">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
              {getPatientName(selectedPatient).charAt(0)}
            </div>
            <div>
              <p className="text-sm font-semibold leading-tight">{getPatientName(selectedPatient)}</p>
              <p className="text-xs text-muted-foreground">{selectedPatient.contactNo}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="size-7" onClick={() => onSelect(null)}>
            <X className="size-3.5" />
          </Button>
        </div>
      ) : (
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name or phone..."
            className="pl-9"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 200)}
          />
          {open && query.trim().length >= 1 && (
            <div className="absolute left-0 right-0 z-[9999] mt-1 w-full rounded-lg border bg-popover shadow-xl max-h-64 overflow-y-auto">
              {isLoading && <p className="px-3 py-2 text-xs text-muted-foreground">Searching...</p>}
              {!isLoading && (searchResults?.data ?? []).length === 0 && (
                <p className="px-3 py-2 text-xs text-muted-foreground">No patients found</p>
              )}
              {(searchResults?.data ?? []).map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-muted transition-colors"
                  onMouseDown={() => { onSelect(p.id); setQuery(""); setOpen(false); }}
                >
                  <div className="flex size-8 items-center justify-center rounded-full bg-muted text-xs font-bold">
                    {getPatientName(p).charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium">{getPatientName(p)}</p>
                    <p className="text-xs text-muted-foreground">{p.contactNo}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
