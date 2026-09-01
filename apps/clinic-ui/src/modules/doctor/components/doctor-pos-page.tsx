import { getPatientName } from "@/lib/api";
import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import {
  Activity,
  ArrowRight,
  CalendarDays,
  CalendarX,
  Check,
  CheckCircle2,
  ClipboardList,
  Clock,
  HeartPulse,
  History,
  Minus,
  Pencil,
  Pill,
  Plus,
  Search,
  Stethoscope,
  StickyNote,
  Trash2,
  UserCheck,
  X,
} from "lucide-react";
import {
  fetchQueue,
  fetchMedicines,
  updateQueueStatus,
  createPrescription,
  deleteQueueEntry,
  createProcedureOrder,
  updateAppointmentStatus,
  createPatientVitals,
  type QueueEntry,
  type Medicine,
} from "@/lib/api";
import { useAppSelector } from "@/store/hooks";
import { toast } from "sonner";
import { extractApiError } from "@/lib/axios-client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldLabel } from "@/components/ui/field";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { DiagnosisSelect } from "@/components/diagnosis-select";
import { PatientHistorySheet } from "./patient-history-sheet";
import { PatientFormSheet } from "@/modules/patients/components/patient-form-sheet";
import { fetchAllergies, fetchPatientVitalsLatest } from "@/lib/api";

interface RxItem {
  tempId: string;
  medicineId: string;
  medicineName: string;
  dosage: string;
  duration: string;
  instructions: string;
  quantity: number;
}

function emptyRxItem(): RxItem {
  return {
    tempId: crypto.randomUUID(),
    medicineId: "",
    medicineName: "",
    dosage: "1-0-1",
    duration: "7 days",
    instructions: "",
    quantity: 1,
  };
}

interface ProcedureItem {
  tempId: string;
  procedureName: string;
  category: string;
}

const PROCEDURE_CATEGORIES = ["DIAGNOSTIC", "THERAPEUTIC", "SURGICAL", "PREVENTIVE", "OTHER"];

function calculateAge(dob: string): string {
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
  return `${age} years`;
}

function parseDailyTablets(dosage: string): number {
  const parts = dosage.split("-").map(Number);
  if (parts.length === 3 && parts.every((n) => !isNaN(n))) {
    return (parts[0] ?? 0) + (parts[1] ?? 0) + (parts[2] ?? 0);
  }
  return 1;
}

function parseDays(duration: string): number {
  const match = duration.match(/(\d+)/);
  return match?.[1] ? parseInt(match[1], 10) : 7;
}

function totalTablets(dosage: string, duration: string, quantity: number): number {
  return parseDailyTablets(dosage) * parseDays(duration) * quantity;
}

const QUEUE_STATUS_STYLES: Record<string, string> = {
  WAITING: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  SEND_IN: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
  IN_PROGRESS: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  COMPLETED: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  SKIPPED: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  NO_SHOW: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

/** Small detail row used inside the patient-info card */
function DetailRow({ label, value, capitalize, fullWidth }: {
  label: string;
  value: React.ReactNode;
  capitalize?: boolean;
  fullWidth?: boolean;
}) {
  return (
    <div className={cn("flex items-start gap-3 py-2.5", fullWidth ? "flex-col" : "flex-row")}>
      <span className={cn("shrink-0 text-[10px] font-medium uppercase tracking-wider text-muted-foreground/70", fullWidth ? "" : "w-[88px]")}>
        {label}
      </span>
      <div className={cn("min-w-0", fullWidth ? "w-full" : "flex-1")}>
        {value !== null && value !== undefined ? (
          typeof value === 'string' ? (
            <span className={cn("text-sm", capitalize ? "capitalize" : "")}>{value}</span>
          ) : (
            value
          )
        ) : (
          <span className="text-sm italic text-muted-foreground/50">Not recorded</span>
        )}
      </div>
    </div>
  );
}

export function DoctorPosPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useAppSelector((state) => state.auth.user);
  const doctorId = user?.userableId ?? "";

  const [selectedEntry, setSelectedEntry] = useState<QueueEntry | null>(null);
  const [diagnoses, setDiagnoses] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [rxItems, setRxItems] = useState<RxItem[]>([]);
  const [medicineQuery, setMedicineQuery] = useState("");
  const [medicineDropdownOpen, setMedicineDropdownOpen] = useState(false);
  const [procedureOrders, setProcedureOrders] = useState<ProcedureItem[]>([]);
  const [newProcedureName, setNewProcedureName] = useState("");
  const [newProcedureCategory, setNewProcedureCategory] = useState<string>("DIAGNOSTIC");
  const [historyOpen, setHistoryOpen] = useState(false);
  const [editPatientOpen, setEditPatientOpen] = useState(false);
  // ── Cancel appointment ──
  const [cancelTarget, setCancelTarget] = useState<QueueEntry | null>(null);
  const [cancelReason, setCancelReason] = useState("");

  // ── Vitals entry ──
  const [vitalsOpen, setVitalsOpen] = useState(false);
  const [vitalsTarget, setVitalsTarget] = useState<QueueEntry | null>(null);
  const [vitals, setVitals] = useState<Record<string, string>>({
    heightCm: "", weightCm: "", temperatureC: "", pulseBpm: "",
    systolicBp: "", diastolicBp: "", spo2Percent: "", respiratoryRate: "", medicalStatus: "",
  });

  // Fetch patient vitals when a patient is selected
  const { data: patientVitals } = useQuery({
    queryKey: ["patientVitals", "latest", selectedEntry?.patientId],
    queryFn: () => fetchPatientVitalsLatest(selectedEntry!.patientId),
    enabled: !!selectedEntry?.patientId,
  });

  const { data: response, isLoading } = useQuery({
    queryKey: ["queue", "doctor", doctorId],
    queryFn: () => fetchQueue({ doctorId, page: 1, limit: 100 }),
    enabled: !!doctorId,
    refetchInterval: 10_000,
  });

  const queue = response?.data ?? [];
  const waiting = queue.filter((e) => e.status === "WAITING");
  const sendIn = queue.filter((e) => e.status === "SEND_IN");
  const inProgress = queue.filter((e) => e.status === "IN_PROGRESS");
  const active = [...inProgress, ...sendIn, ...waiting];

  const medicineResults = useQuery({
    queryKey: ["medicines", "search", medicineQuery],
    queryFn: () => fetchMedicines({ search: medicineQuery, limit: 20 }),
    enabled: medicineQuery.trim().length >= 2,
  });

  const medicines = medicineResults.data?.data ?? [];

  // Fetch allergy catalog for severity/category tooltips
  const { data: allergyCatalogResponse } = useQuery({
    queryKey: ["allergies", "catalog"],
    queryFn: () => fetchAllergies({ limit: 100 }),
  });

  const allergyCatalog = allergyCatalogResponse?.data ?? [];

  const allergyMap = useMemo(() => {
    const map = new Map<string, { severity: string; category: string }>();
    for (const a of allergyCatalog) {
      map.set(a.name.toLowerCase(), { severity: a.severity, category: a.category });
    }
    return map;
  }, [allergyCatalog]);

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => updateQueueStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["queue"] });
      toast.success("Status updated");
    },
    onError: (err) => toast.error(extractApiError(err)),
  });

  // ── Cancel appointment mutation ──
  const cancelMutation = useMutation({
    mutationFn: async () => {
      if (!cancelTarget?.appointment?.id) return;
      // Cancel the appointment
      await updateAppointmentStatus(cancelTarget.appointment.id, "CANCELLED", { cancellationReason: cancelReason.trim() });
      // Delete the queue entry
      await deleteQueueEntry(cancelTarget.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["queue"] });
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      toast.success("Appointment cancelled");
      const cancelledId = cancelTarget?.id;
      setCancelTarget(null);
      setCancelReason("");
      if (selectedEntry?.id === cancelledId) clearForm();
    },
    onError: (err) => toast.error(extractApiError(err)),
  });

  const emptyVitals = { heightCm: "", weightCm: "", temperatureC: "", pulseBpm: "", systolicBp: "", diastolicBp: "", spo2Percent: "", respiratoryRate: "", medicalStatus: "" };

  // ── Vitals mutation ──
  const vitalsMutation = useMutation({
    mutationFn: async () => {
      if (!vitalsTarget) return;
      const payload: Record<string, string | number> = { patientId: vitalsTarget.patientId };
      if (vitalsTarget.appointment?.id) payload.appointmentId = vitalsTarget.appointment.id;
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
      setVitalsOpen(false);
      setVitalsTarget(null);
      setVitals(emptyVitals);
    },
    onError: (err) => toast.error(extractApiError(err)),
  });

  async function openVitals(entry: QueueEntry) {
    setVitalsTarget(entry);
    setVitals(emptyVitals);
    setVitalsOpen(true);
    // Pre-fill with the patient's last known vitals as editable defaults —
    // the new entry is still saved tagged to this specific appointment.
    const latest = await fetchPatientVitalsLatest(entry.patientId).catch(() => null);
    if (!latest) return;
    setVitals({
      heightCm: latest.heightCm?.toString() ?? "",
      weightCm: latest.weightKg?.toString() ?? "",
      temperatureC: latest.temperatureC?.toString() ?? "",
      pulseBpm: latest.pulseBpm?.toString() ?? "",
      systolicBp: latest.systolicBp?.toString() ?? "",
      diastolicBp: latest.diastolicBp?.toString() ?? "",
      spo2Percent: latest.spo2Percent?.toString() ?? "",
      respiratoryRate: latest.respiratoryRate?.toString() ?? "",
      medicalStatus: latest.medicalStatus ?? "",
    });
  }

  const completeMutation = useMutation({
    mutationFn: async () => {
      // Always create a prescription — even without medicines the
      // doctor's diagnosis and notes need to be recorded.
      await createPrescription({
        patientId: selectedEntry!.patientId,
        doctorId,
        diagnosis: diagnoses.join(", ") || undefined,
        notes: notes || undefined,
        items: rxItems.length > 0
          ? rxItems.map((item) => ({
              medicineId: item.medicineId,
              medicineName: item.medicineName,
              dosage: item.dosage,
              duration: item.duration || undefined,
              instructions: item.instructions || undefined,
              quantity: item.quantity,
            }))
          : [{ medicineId: "remarks", medicineName: "Verbal Instructions", dosage: "As per doctor's advice", quantity: 1 }],
      });
      if (procedureOrders.length > 0) {
        await Promise.all(
          procedureOrders.map((p) =>
            createProcedureOrder({
              patientId: selectedEntry!.patientId,
              doctorId,
              procedureName: p.procedureName,
              category: p.category,
            }),
          ),
        );
      }
      // Update appointment status to COMPLETED
      const appointmentId = selectedEntry!.appointment?.id;
      if (appointmentId) {
        await updateAppointmentStatus(appointmentId, "COMPLETED");
      }
      // Delete the queue entry (remove from queue)
      await deleteQueueEntry(selectedEntry!.id);
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ["queue"] });
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      // Force-refetch prescriptions so the list page has fresh data on navigation
      await queryClient.refetchQueries({ queryKey: ["prescriptions"] });
      toast.success("Consultation completed successfully");
      clearForm();
      navigate({ to: "/doctor/prescriptions" });
    },
    onError: (err) => toast.error(extractApiError(err)),
  });

  function selectPatient(entry: QueueEntry) {
    setSelectedEntry(entry);
    setDiagnoses([]);
    setNotes("");
    setRxItems([]);
    setMedicineQuery("");
    setMedicineDropdownOpen(false);
    setProcedureOrders([]);
    setNewProcedureName("");
    setHistoryOpen(false);
  }

  function clearForm() {
    setSelectedEntry(null);
    setDiagnoses([]);
    setNotes("");
    setRxItems([]);
    setMedicineQuery("");
    setMedicineDropdownOpen(false);
    setProcedureOrders([]);
    setNewProcedureName("");
    setHistoryOpen(false);
  }

  function addProcedureOrder() {
    if (!newProcedureName.trim()) return;
    setProcedureOrders((prev) => [
      ...prev,
      { tempId: crypto.randomUUID(), procedureName: newProcedureName.trim(), category: newProcedureCategory },
    ]);
    setNewProcedureName("");
  }

  function removeProcedureOrder(tempId: string) {
    setProcedureOrders((prev) => prev.filter((p) => p.tempId !== tempId));
  }

  function addMedicineToRx(med: Medicine) {
    setRxItems((prev) => [
      ...prev,
      {
        tempId: crypto.randomUUID(),
        medicineId: med.id,
        medicineName: [med.brandName ?? med.name, med.strength].filter(Boolean).join(" "),
        dosage: "1-0-1",
        duration: "7 days",
        instructions: "",
        quantity: 1,
      },
    ]);
    setMedicineQuery("");
    setMedicineDropdownOpen(false);
  }

  function updateRxItem(tempId: string, patch: Partial<RxItem>) {
    setRxItems((prev) => prev.map((item) => (item.tempId === tempId ? { ...item, ...patch } : item)));
  }

  function removeRxItem(tempId: string) {
    setRxItems((prev) => prev.filter((item) => item.tempId !== tempId));
  }

  function handleComplete() {
    if (!selectedEntry || !doctorId) return;
    if (!notes.trim()) {
      toast.error("Doctor's notes are required before completing");
      return;
    }
    completeMutation.mutate();
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 items-center justify-between pb-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">My Appointments</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {waiting.length} waiting &middot; {sendIn.length} to see &middot; {inProgress.length} in progress
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <CalendarDays className="size-4" />
          <span>{new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 gap-6 overflow-y-auto">
        {/* Queue list */}
        <div className="flex w-2/5 flex-col min-w-0">
          <Card className="flex flex-col">
            <CardHeader className="flex-row items-center justify-between border-b py-3 shrink-0">
              <CardTitle className="flex items-center gap-2 text-base">
                <span className="flex size-6 items-center justify-center rounded-md bg-sky-100 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400">
                  <Clock className="size-3.5" />
                </span>
                Today's Queue
              </CardTitle>
              {active.length > 0 && (
                <Badge variant="outline" className="text-[10px]">{active.length}</Badge>
              )}
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <p className="py-8 text-center text-sm text-muted-foreground">Loading...</p>
              ) : active.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-10 text-center">
                  <Clock className="size-8 text-muted-foreground/50" />
                  <p className="text-sm text-muted-foreground">No patients in queue</p>
                </div>
              ) : (
                <div className="divide-y">
                  {active.map((entry) => {
                    const isSelected = selectedEntry?.id === entry.id;
                    return (
                      <button
                        key={entry.id}
                        type="button"
                        className={cn(
                          "flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50",
                          isSelected && "bg-primary/5 ring-1 ring-primary/20"
                        )}
                        onClick={() => selectPatient(entry)}
                      >
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-none border border-primary/20 bg-primary/5 text-[9px] font-bold font-mono text-primary truncate overflow-hidden px-1">
                          {entry.tokenNumber}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">{getPatientName(entry.patient)}</p>
                          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-muted-foreground">
                            <span>{entry.patient?.contactNo}</span>
                            {entry.patient.bloodGroup && (
                              <>
                                <span className="text-[8px]">·</span>
                                <span className="font-medium text-foreground/70">{entry.patient.bloodGroup}</span>
                              </>
                            )}
                            {(entry.patient.allergies ?? []).length > 0 && (
                              <>
                                <span className="text-[8px]">·</span>
                                <span className="text-amber-600">
                                  {(entry.patient.allergies ?? []).join(", ")}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-1.5">
                          {isSelected && (
                            <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-white">
                              <Check className="size-3" />
                            </span>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-9 shrink-0"
                            title="Record vitals"
                            onClick={(e) => {
                              e.stopPropagation();
                              openVitals(entry);
                            }}
                          >
                            <HeartPulse className="size-4.5 text-rose-500" />
                          </Button>
                          <Badge variant="outline" className={`text-[9px] ${QUEUE_STATUS_STYLES[entry.status] ?? ""}`}>
                            {entry.status.replace("_", " ")}
                          </Badge>
                          {entry.status === "WAITING" && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs gap-1.5"
                              disabled={inProgress.length > 0}
                              title={inProgress.length > 0 ? "Complete the current consultation first" : "Send patient in"}
                              onClick={(e) => {
                                e.stopPropagation();
                                statusMutation.mutate({ id: entry.id, status: "SEND_IN" });
                                if (!selectedEntry || selectedEntry.id === entry.id) {
                                  setSelectedEntry({ ...entry, status: "SEND_IN" });
                                }
                              }}
                            >
                              <ArrowRight className="size-4 text-violet-600" />
                              Send In
                            </Button>
                          )}
                          {entry.status === "SEND_IN" && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs gap-1.5"
                              disabled={inProgress.length > 0}
                              title={inProgress.length > 0 ? "Complete the current consultation first" : "Start consultation"}
                              onClick={(e) => {
                                e.stopPropagation();
                                statusMutation.mutate({ id: entry.id, status: "IN_PROGRESS" });
                                if (!selectedEntry || selectedEntry.id === entry.id) {
                                  setSelectedEntry({ ...entry, status: "IN_PROGRESS" });
                                }
                              }}
                            >
                              <UserCheck className="size-4 text-blue-600" />
                              Start Consultation
                            </Button>
                          )}
                          {(entry.status === "WAITING" || entry.status === "SEND_IN") && entry.appointment && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-9 shrink-0"
                                title="Cancel appointment"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setCancelTarget(entry);
                                  setCancelReason("");
                                }}
                              >
                                <CalendarX className="size-4.5 text-destructive" />
                              </Button>
                            </>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Prescription builder */}
        <div className="flex flex-1 flex-col">
          {!selectedEntry ? (
            <Card className="flex items-center justify-center">
              <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
                <Stethoscope className="size-10 text-muted-foreground/40" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Select a patient from the queue</p>
                  <p className="text-xs text-muted-foreground">to start consultation and write prescription</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="flex flex-col space-y-4 pr-1">
              {/* Patient header — fixed two-row card */}
              <Card className="overflow-hidden">
                {/* Row 1: identity + status/close */}
                <div className="flex items-center justify-between gap-3 border-b border-border/50 px-4 py-3.5">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex shrink-0 flex-col items-center justify-center border-2 border-primary/15 bg-primary/[0.06] px-2.5 py-1.5">
                      <span className="text-[10px] font-bold font-mono text-primary tracking-wider leading-none">
                        {selectedEntry.tokenNumber}
                      </span>
                      <span className="mt-0.5 font-mono text-[8px] tracking-wider text-muted-foreground/50 leading-none">
                        {selectedEntry.patient.id.slice(-8).toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold leading-tight truncate">{selectedEntry.patient ? getPatientName(selectedEntry.patient) : "—"}</p>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-7 gap-1.5 px-2 text-xs"
                          onClick={() => setEditPatientOpen(true)}
                        >
                          <Pencil className="size-3.5" />
                          Edit
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-7 gap-1.5 px-2 text-xs"
                          onClick={() => setHistoryOpen(true)}
                        >
                          <History className="size-3.5" />
                          All Prescriptions
                        </Button>
                      </div>
                      <p className="mt-0.5 text-[11px] leading-tight text-muted-foreground/70">{selectedEntry.patient?.contactNo}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="outline" className={`text-[10px] ${QUEUE_STATUS_STYLES[selectedEntry.status] ?? ""}`}>
                      {selectedEntry.status.replace("_", " ")}
                    </Badge>
                    <Button variant="ghost" size="icon" className="size-9 text-muted-foreground hover:text-foreground" title="Clear form" onClick={clearForm}>
                      <X className="size-5" />
                    </Button>
                  </div>
                </div>

                {/* Row 2: clinical facts, fixed grid so height never grows */}
                <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 px-4 py-3.5 sm:grid-cols-5">
                  <div className="min-w-0">
                    <span className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground">DOB/Age</span>
                    <p className="truncate text-xs font-medium">
                      {selectedEntry.patient.dateOfBirth
                        ? `${new Date(selectedEntry.patient.dateOfBirth).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} (${calculateAge(selectedEntry.patient.dateOfBirth)})`
                        : <span className="italic text-muted-foreground/50">—</span>}
                    </p>
                  </div>

                  <div className="min-w-0">
                    <span className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground">Gender</span>
                    <p className="truncate text-xs font-medium capitalize">
                      {selectedEntry.patient.gender ? selectedEntry.patient.gender.toLowerCase() : <span className="italic text-muted-foreground/50 normal-case">—</span>}
                    </p>
                  </div>

                  <div className="min-w-0">
                    <span className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground">Blood Group</span>
                    <p className="mt-0.5 truncate">
                      {selectedEntry.patient.bloodGroup ? (
                        <span className="inline-flex items-center rounded-sm border border-red-200 bg-red-50 px-1.5 py-0.5 text-[10px] font-bold text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-400">
                          {selectedEntry.patient.bloodGroup}
                        </span>
                      ) : (
                        <span className="text-xs italic text-muted-foreground/50">—</span>
                      )}
                    </p>
                  </div>

                  <div className="min-w-0 col-span-2 sm:col-span-1">
                    <span className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground">Allergies</span>
                    <div className="mt-0.5 flex flex-wrap items-center gap-1">
                      {selectedEntry.patient.allergies && selectedEntry.patient.allergies.length > 0 ? (
                        <>
                          {selectedEntry.patient.allergies.map((a, i) => {
                            const allergyInfo = allergyMap.get(a.toLowerCase());
                            return (
                              <span
                                key={i}
                                className={cn(
                                  "inline-flex items-center whitespace-nowrap rounded-sm border px-1.5 py-0.5 text-[10px] font-medium",
                                  allergyInfo?.severity === "SEVERE" || allergyInfo?.severity === "LIFE_THREATENING"
                                    ? "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-400"
                                    : allergyInfo?.severity === "MODERATE"
                                      ? "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-800 dark:bg-orange-950 dark:text-orange-400"
                                      : "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-400"
                                )}
                              >
                                {a}
                              </span>
                            );
                          })}
                        </>
                      ) : (
                        <span className="text-xs italic text-muted-foreground/50">None recorded</span>
                      )}
                    </div>
                  </div>

                  <div className="min-w-0">
                    <span className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground">Visit Type</span>
                    <p className="mt-0.5 truncate">
                      {selectedEntry.patient.isFollowUp ? (
                        <span className="inline-flex items-center rounded-sm border border-blue-200 bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-400">
                          Follow-up
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">New</span>
                      )}
                    </p>
                  </div>
                </div>

                {/* Patient Vitals */}
                {patientVitals && (
                  <div className="border-t border-border/50 px-4 py-3">
                    <span className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground">Patient Vitals</span>
                    <div className="mt-1.5 grid grid-cols-4 gap-x-4 gap-y-1.5">
                      {patientVitals.heightCm != null && (
                        <div><span className="text-[9px] text-muted-foreground">Height</span><p className="text-xs font-medium">{patientVitals.heightCm} cm</p></div>
                      )}
                      {patientVitals.weightKg != null && (
                        <div><span className="text-[9px] text-muted-foreground">Weight</span><p className="text-xs font-medium">{patientVitals.weightKg} kg</p></div>
                      )}
                      {patientVitals.bmi != null && (
                        <div><span className="text-[9px] text-muted-foreground">BMI</span><p className="text-xs font-medium">{patientVitals.bmi}</p></div>
                      )}
                      {patientVitals.temperatureC != null && (
                        <div><span className="text-[9px] text-muted-foreground">Temp</span><p className="text-xs font-medium">{patientVitals.temperatureC}°F</p></div>
                      )}
                      {patientVitals.pulseBpm != null && (
                        <div><span className="text-[9px] text-muted-foreground">Pulse</span><p className="text-xs font-medium">{patientVitals.pulseBpm} bpm</p></div>
                      )}
                      {patientVitals.systolicBp != null && patientVitals.diastolicBp != null && (
                        <div><span className="text-[9px] text-muted-foreground">BP</span><p className="text-xs font-medium">{patientVitals.systolicBp}/{patientVitals.diastolicBp} mmHg</p></div>
                      )}
                      {patientVitals.spo2Percent != null && (
                        <div><span className="text-[9px] text-muted-foreground">SpO₂</span><p className="text-xs font-medium">{patientVitals.spo2Percent}%</p></div>
                      )}
                      {patientVitals.respiratoryRate != null && (
                        <div><span className="text-[9px] text-muted-foreground">Resp Rate</span><p className="text-xs font-medium">{patientVitals.respiratoryRate}/min</p></div>
                      )}
                      {patientVitals.medicalStatus && (
                        <div className="col-span-4"><span className="text-[9px] text-muted-foreground">Status</span><p className="text-xs font-medium text-amber-600">{patientVitals.medicalStatus}</p></div>
                      )}
                    </div>
                  </div>
                )}
              </Card>

              {/* Diagnosis */}
              <Card className="overflow-visible">
                <CardHeader className="flex flex-row items-center justify-between border-b py-3">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <span className="flex size-6 items-center justify-center rounded-md bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                      <ClipboardList className="size-3.5" />
                    </span>
                    Diagnosis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <DiagnosisSelect value={diagnoses} onChange={setDiagnoses} />
                </CardContent>
              </Card>

              {/* Medicines */}
              <Card className="overflow-visible">
                <CardHeader className="flex flex-row items-center justify-between border-b py-3">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <span className="flex size-6 items-center justify-center rounded-md bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400">
                      <Pill className="size-3.5" />
                    </span>
                    Prescribed Medicines
                    {rxItems.length > 0 && (
                      <Badge variant="outline" className="text-[10px]">{rxItems.length}</Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Always-visible medicine search */}
                  <div className="relative">
                    <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search medicine by brand or generic name..."
                      className="pl-9"
                      value={medicineQuery}
                      onChange={(e) => { setMedicineQuery(e.target.value); setMedicineDropdownOpen(true); }}
                      onFocus={() => setMedicineDropdownOpen(true)}
                      onBlur={() => setTimeout(() => setMedicineDropdownOpen(false), 200)}
                    />
                    {medicineDropdownOpen && medicineQuery.trim().length >= 2 && (
                      <div className="absolute z-50 mt-1 w-full rounded-none border bg-popover shadow-md max-h-52 overflow-y-auto">
                        {medicines.length === 0 ? (
                          <p className="px-3 py-2 text-xs text-muted-foreground">No medicines found</p>
                        ) : (
                          <div className="divide-y">
                            {medicines.map((med) => (
                              <button
                                key={med.id}
                                type="button"
                                className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-muted transition-colors"
                                onClick={() => addMedicineToRx(med)}
                              >
                                <Pill className="size-3.5 shrink-0 text-muted-foreground" />
                                <div className="flex-1 min-w-0">
                                  <span className="font-medium">{med.brandName}</span>
                                  {med.strength && <span className="ml-1 text-muted-foreground">{med.strength}</span>}
                                  <span className="ml-2 text-xs text-muted-foreground">{med.genericName}</span>
                                </div>
                                <span className="shrink-0 text-xs font-medium text-muted-foreground">{med.price ? `₹${med.price}` : ''}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Rx items */}
                  {rxItems.length === 0 ? (
                    <div className="flex flex-col items-center gap-1.5 py-6 text-center">
                      <Pill className="size-6 text-violet-300 dark:text-violet-700" />
                      <p className="text-xs text-muted-foreground">
                        No medicines added yet. Search above to find and prescribe medicines.
                      </p>
                    </div>
                  ) : (
                    <>
                      {rxItems.map((item) => (
                        <div key={item.tempId} className="rounded-none border p-3 space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-medium">{item.medicineName}</p>
                            <Button variant="ghost" size="icon" className="size-8 shrink-0" title="Remove item" onClick={() => removeRxItem(item.tempId)}>
                              <Trash2 className="size-4 text-destructive" />
                            </Button>
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            <Field>
                              <FieldLabel className="text-[10px]">Dosage (daily)</FieldLabel>
                              <Input
                                className="h-8 text-xs"
                                placeholder="1-0-1"
                                value={item.dosage}
                                onChange={(e) => updateRxItem(item.tempId, { dosage: e.target.value })}
                              />
                            </Field>
                            <Field>
                              <FieldLabel className="text-[10px]">Duration (days)</FieldLabel>
                              <Input
                                className="h-8 text-xs"
                                placeholder="7 days"
                                value={item.duration}
                                onChange={(e) => updateRxItem(item.tempId, { duration: e.target.value })}
                              />
                            </Field>
                            <Field>
                              <FieldLabel className="text-[10px]">Tablets</FieldLabel>
                              <div className="flex items-center gap-1">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="icon"
                                  className="size-8"
                                  onClick={() => updateRxItem(item.tempId, { quantity: Math.max(1, item.quantity - 1) })}
                                >
                                  <Minus className="size-4" />
                                </Button>
                                <span className="w-6 text-center text-sm">{item.quantity}</span>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="icon"
                                  className="size-8"
                                  onClick={() => updateRxItem(item.tempId, { quantity: item.quantity + 1 })}
                                >
                                  <Plus className="size-4" />
                                </Button>
                              </div>
                            </Field>
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                            <span>{parseDailyTablets(item.dosage)} tab/day</span>
                            <span>&middot;</span>
                            <span>{parseDays(item.duration)} days</span>
                            <span>&middot;</span>
                            <span className="font-medium text-foreground">{totalTablets(item.dosage, item.duration, item.quantity)} tablets total</span>
                          </div>
                          <Field>
                            <FieldLabel className="text-[10px]">Instructions</FieldLabel>
                            <Input
                              className="h-8 text-xs"
                              placeholder="e.g. After meals, Before bed..."
                              value={item.instructions}
                              onChange={(e) => updateRxItem(item.tempId, { instructions: e.target.value })}
                            />
                          </Field>
                        </div>
                      ))}
                      {/* Add Medicine button in the list */}
                      <div className="flex justify-center border-t pt-3">
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1.5"
                          onClick={() => {
                            const searchInput = document.querySelector<HTMLInputElement>('input[placeholder*="Search medicine"]');
                            searchInput?.focus();
                          }}
                        >
                          <Plus className="size-3.5" />
                          Add Medicine
                        </Button>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Procedures */}
              <Card>
                <CardHeader className="border-b py-3">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <span className="flex size-6 items-center justify-center rounded-md bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
                      <Activity className="size-3.5" />
                    </span>
                    Procedures
                    {procedureOrders.length > 0 && (
                      <Badge variant="outline" className="text-[10px]">{procedureOrders.length}</Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex gap-2">
                    <Input
                      placeholder="e.g. ECG, Dressing, Nebulization..."
                      value={newProcedureName}
                      onChange={(e) => setNewProcedureName(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") addProcedureOrder(); }}
                    />
                    <select
                      className="flex h-9 w-36 shrink-0 rounded-none border border-input bg-background px-2 text-xs"
                      value={newProcedureCategory}
                      onChange={(e) => setNewProcedureCategory(e.target.value)}
                    >
                      {PROCEDURE_CATEGORIES.map((c) => (<option key={c} value={c}>{c}</option>))}
                    </select>
                    <Button variant="outline" onClick={addProcedureOrder} disabled={!newProcedureName.trim()}>
                      <Plus className="size-4" />
                    </Button>
                  </div>
                  {procedureOrders.length === 0 ? (
                    <div className="flex flex-col items-center gap-1.5 py-4 text-center">
                      <Activity className="size-6 text-amber-300 dark:text-amber-700" />
                      <p className="text-xs text-muted-foreground">No procedures ordered yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {procedureOrders.map((p) => (
                        <div key={p.tempId} className="flex items-center justify-between rounded-none border p-2">
                          <div>
                            <p className="text-sm font-medium">{p.procedureName}</p>
                            <p className="text-[10px] text-muted-foreground">{p.category}</p>
                          </div>
                          <Button variant="ghost" size="icon" className="size-8" title="Remove procedure" onClick={() => removeProcedureOrder(p.tempId)}>
                            <Trash2 className="size-4 text-destructive" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Notes (required) */}
              <Card>
                <CardHeader className="border-b py-3">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <span className="flex size-6 items-center justify-center rounded-md bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400">
                      <StickyNote className="size-3.5" />
                    </span>
                    Doctor's Notes
                    <span className="text-xs font-normal text-destructive">* required</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <textarea
                    className={cn(
                      "flex min-h-[80px] w-full rounded-none border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground",
                      !notes.trim() && "border-destructive/50 focus-visible:ring-destructive/30"
                    )}
                    placeholder="Additional notes, follow-up instructions, diet advice..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                  {!notes.trim() && (
                    <p className="mt-1 text-xs text-destructive">Notes are required before completing this consultation.</p>
                  )}
                </CardContent>
              </Card>

              {/* Actions */}
              <div className="flex items-center justify-between gap-3">
                <Button variant="outline" onClick={clearForm}>
                  Cancel
                </Button>
                <Button
                  onClick={handleComplete}
                  disabled={!notes.trim() || completeMutation.isPending}
                >
                  <CheckCircle2 className="mr-1.5 size-4" />
                  {completeMutation.isPending ? "Saving..." : "Complete Consultation"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      <PatientHistorySheet
        patientId={selectedEntry?.patientId ?? null}
        patientName={selectedEntry?.patient ? getPatientName(selectedEntry.patient) : ""}
        open={historyOpen}
        onOpenChange={setHistoryOpen}
      />

      <PatientFormSheet
        open={editPatientOpen}
        onOpenChange={setEditPatientOpen}
        editingPatient={selectedEntry?.patient ?? null}
        onSaved={() => {
          queryClient.invalidateQueries({ queryKey: ["queue"] });
          queryClient.invalidateQueries({ queryKey: ["patientVitals"] });
          setEditPatientOpen(false);
          toast.success("Patient updated successfully");
        }}
      />

      {/* ── Record Vitals Sheet ── */}
      <Sheet open={vitalsOpen} onOpenChange={(open) => { if (!open) { setVitalsOpen(false); setVitalsTarget(null); } }}>
        <SheetContent side="right" className="sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <HeartPulse className="size-5 text-rose-500" />
              Record Vitals
            </SheetTitle>
          </SheetHeader>
          <div className="space-y-4 px-4 py-4">
            {vitalsTarget && (
              <div className="rounded-none border bg-muted/20 p-3 text-sm">
                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Patient</span>
                <p className="mt-0.5 font-medium">{vitalsTarget.patient ? getPatientName(vitalsTarget.patient) : "—"}</p>
                <p className="text-xs text-muted-foreground">{vitalsTarget.patient?.contactNo}</p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <Field>
                <FieldLabel className="text-[10px]">Height (cm)</FieldLabel>
                <Input className="h-8 text-xs" type="number" placeholder="170" value={vitals.heightCm} onChange={(e) => setVitals((v) => ({ ...v, heightCm: e.target.value }))} />
              </Field>
              <Field>
                <FieldLabel className="text-[10px]">Weight (kg)</FieldLabel>
                <Input className="h-8 text-xs" type="number" placeholder="70" value={vitals.weightCm} onChange={(e) => setVitals((v) => ({ ...v, weightCm: e.target.value }))} />
              </Field>
              <Field>
                <FieldLabel className="text-[10px]">Temperature (°F)</FieldLabel>
                <Input className="h-8 text-xs" type="number" step="0.1" placeholder="98.6" value={vitals.temperatureC} onChange={(e) => setVitals((v) => ({ ...v, temperatureC: e.target.value }))} />
              </Field>
              <Field>
                <FieldLabel className="text-[10px]">Pulse (bpm)</FieldLabel>
                <Input className="h-8 text-xs" type="number" placeholder="72" value={vitals.pulseBpm} onChange={(e) => setVitals((v) => ({ ...v, pulseBpm: e.target.value }))} />
              </Field>
              <Field>
                <FieldLabel className="text-[10px]">Systolic BP</FieldLabel>
                <Input className="h-8 text-xs" type="number" placeholder="120" value={vitals.systolicBp} onChange={(e) => setVitals((v) => ({ ...v, systolicBp: e.target.value }))} />
              </Field>
              <Field>
                <FieldLabel className="text-[10px]">Diastolic BP</FieldLabel>
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
              <Field className="col-span-2">
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
          <SheetFooter>
            <Button variant="outline" onClick={() => { setVitalsOpen(false); setVitalsTarget(null); }}>Cancel</Button>
            <Button
              onClick={() => vitalsMutation.mutate()}
              disabled={!Object.values(vitals).some((v) => v !== "") || vitalsMutation.isPending}
            >
              {vitalsMutation.isPending ? "Saving..." : "Save Vitals"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* ── Cancel Appointment Confirmation ── */}
      {cancelTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-sm rounded-none border bg-background p-6 shadow-lg">
            <h3 className="text-lg font-semibold">Cancel Appointment</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Cancel appointment for {cancelTarget.patient ? getPatientName(cancelTarget.patient) : "this patient"}?
            </p>
            <Field className="mt-4">
              <FieldLabel className="text-xs">Reason *</FieldLabel>
              <Input
                placeholder="Enter cancellation reason..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && cancelReason.trim()) cancelMutation.mutate(); }}
              />
            </Field>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={() => { setCancelTarget(null); setCancelReason(""); }}>Back</Button>
              <Button
                variant="destructive"
                onClick={() => cancelMutation.mutate()}
                disabled={cancelMutation.isPending || !cancelReason.trim()}
              >
                {cancelMutation.isPending ? "Cancelling..." : "Cancel Appointment"}
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
