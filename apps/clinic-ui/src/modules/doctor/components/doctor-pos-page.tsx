import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Activity,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock,
  History,
  Minus,
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
  createProcedureOrder,
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
import { DiagnosisSelect } from "@/components/diagnosis-select";
import { PatientHistorySheet } from "./patient-history-sheet";

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
  const queryClient = useQueryClient();
  const user = useAppSelector((state) => state.auth.user);
  const doctorId = user?.userableId ?? "";

  const [selectedEntry, setSelectedEntry] = useState<QueueEntry | null>(null);
  const [diagnosis, setDiagnosis] = useState("");
  const [notes, setNotes] = useState("");
  const [rxItems, setRxItems] = useState<RxItem[]>([]);
  const [medicineQuery, setMedicineQuery] = useState("");
  const [showMedicineSearch, setShowMedicineSearch] = useState<string | null>(null);
  const [procedureOrders, setProcedureOrders] = useState<ProcedureItem[]>([]);
  const [newProcedureName, setNewProcedureName] = useState("");
  const [newProcedureCategory, setNewProcedureCategory] = useState<string>("DIAGNOSTIC");
  const [historyOpen, setHistoryOpen] = useState(false);

  const { data: response, isLoading } = useQuery({
    queryKey: ["queue", "doctor", doctorId],
    queryFn: () => fetchQueue({ doctorId, page: 1, limit: 100 }),
    enabled: !!doctorId,
    refetchInterval: 10_000,
  });

  const queue = response?.data ?? [];
  const waiting = queue.filter((e) => e.status === "WAITING");
  const inProgress = queue.filter((e) => e.status === "IN_PROGRESS");
  const active = [...inProgress, ...waiting];

  const medicineResults = useQuery({
    queryKey: ["medicines", "search", medicineQuery],
    queryFn: () => fetchMedicines({ search: medicineQuery, limit: 20 }),
    enabled: medicineQuery.trim().length >= 2,
  });

  const medicines = medicineResults.data?.data ?? [];

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => updateQueueStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["queue"] });
      toast.success("Status updated");
    },
    onError: (err) => toast.error(extractApiError(err)),
  });

  const completeMutation = useMutation({
    mutationFn: async () => {
      if (rxItems.length > 0) {
        await createPrescription({
          patientId: selectedEntry!.patientId,
          doctorId,
          diagnosis: diagnosis || undefined,
          notes: notes || undefined,
          items: rxItems.map((item) => ({
            medicineId: item.medicineId,
            medicineName: item.medicineName,
            dosage: item.dosage,
            duration: item.duration || undefined,
            instructions: item.instructions || undefined,
            quantity: item.quantity,
          })),
        });
      }
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
      // Mark the queue entry as completed
      await updateQueueStatus(selectedEntry!.id, "COMPLETED");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["queue"] });
      toast.success("Saved successfully");
      clearForm();
    },
    onError: (err) => toast.error(extractApiError(err)),
  });

  function selectPatient(entry: QueueEntry) {
    setSelectedEntry(entry);
    setDiagnosis("");
    setNotes("");
    setRxItems([]);
    setMedicineQuery("");
    setShowMedicineSearch(null);
    setProcedureOrders([]);
    setNewProcedureName("");
    setHistoryOpen(false);
  }

  function clearForm() {
    setSelectedEntry(null);
    setDiagnosis("");
    setNotes("");
    setRxItems([]);
    setMedicineQuery("");
    setShowMedicineSearch(null);
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
    setShowMedicineSearch(null);
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
          <h1 className="text-2xl font-semibold tracking-tight">My Patients</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {waiting.length} waiting &middot; {inProgress.length} in progress
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
                          <p className="text-sm font-medium truncate">{entry.patient.name}</p>
                          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-muted-foreground">
                            <span>{entry.patient.phone}</span>
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
                                  {(entry.patient.allergies ?? []).slice(0, 2).join(", ")}
                                  {(entry.patient.allergies ?? []).length > 2 && " +" + ((entry.patient.allergies ?? []).length - 2)}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <Badge variant="outline" className={`text-[9px] ${QUEUE_STATUS_STYLES[entry.status] ?? ""}`}>
                            {entry.status.replace("_", " ")}
                          </Badge>
                          {entry.status === "WAITING" && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs gap-1.5"
                              onClick={(e) => {
                                e.stopPropagation();
                                statusMutation.mutate({ id: entry.id, status: "IN_PROGRESS" });
                                if (!selectedEntry || selectedEntry.id === entry.id) {
                                  setSelectedEntry({ ...entry, status: "IN_PROGRESS" });
                                }
                              }}
                            >
                              <UserCheck className="size-3.5 text-blue-600" />
                              Start Consultation
                            </Button>
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
                        <p className="text-sm font-semibold leading-tight truncate">{selectedEntry.patient.name}</p>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-6 gap-1 px-1.5 text-[10px]"
                          onClick={() => setHistoryOpen(true)}
                        >
                          <History className="size-3" />
                          Past Visits
                        </Button>
                      </div>
                      <p className="mt-0.5 text-[11px] leading-tight text-muted-foreground/70">{selectedEntry.patient.phone}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="outline" className={`text-[10px] ${QUEUE_STATUS_STYLES[selectedEntry.status] ?? ""}`}>
                      {selectedEntry.status.replace("_", " ")}
                    </Badge>
                    <Button variant="ghost" size="icon" className="size-7 text-muted-foreground hover:text-foreground" title="Clear form" onClick={clearForm}>
                      <X className="size-4" />
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
                          {selectedEntry.patient.allergies.slice(0, 2).map((a, i) => (
                            <span
                              key={i}
                              className="inline-flex items-center whitespace-nowrap rounded-sm border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-400"
                            >
                              {a}
                            </span>
                          ))}
                          {selectedEntry.patient.allergies.length > 2 && (
                            <span
                              title={selectedEntry.patient.allergies.slice(2).join(", ")}
                              className="inline-flex cursor-default items-center whitespace-nowrap rounded-sm border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-400"
                            >
                              +{selectedEntry.patient.allergies.length - 2}
                            </span>
                          )}
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
                  <DiagnosisSelect value={diagnosis} onChange={setDiagnosis} />
                </CardContent>
              </Card>

              {/* Medicines */}
              <Card>
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
                  <Button variant="outline" size="sm" onClick={() => setShowMedicineSearch(crypto.randomUUID())}>
                    <Plus className="mr-1.5 size-3.5" />Add Medicine
                  </Button>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Medicine search */}
                  {showMedicineSearch && (
                    <div className="rounded-none border p-3 space-y-2">
                      <div className="relative">
                        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          placeholder="Search medicine by brand or generic name..."
                          className="pl-9"
                          autoFocus
                          value={medicineQuery}
                          onChange={(e) => setMedicineQuery(e.target.value)}
                        />
                      </div>
                      {medicineQuery.trim().length >= 2 && (
                        <div className="max-h-48 overflow-y-auto rounded-none border bg-popover">
                          {medicines.length === 0 ? (
                            <p className="px-3 py-2 text-xs text-muted-foreground">No medicines found</p>
                          ) : (
                            medicines.map((med) => (
                              <button
                                key={med.id}
                                type="button"
                                className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-muted"
                                onClick={() => addMedicineToRx(med)}
                              >
                                <div>
                                  <span className="font-medium">{med.brandName}</span>
                                  {med.strength && <span className="ml-1 text-muted-foreground">{med.strength}</span>}
                                  <span className="ml-2 text-xs text-muted-foreground">{med.genericName}</span>
                                </div>
                                <Plus className="size-4 text-muted-foreground" />
                              </button>
                            ))
                          )}
                        </div>
                      )}
                      <Button variant="ghost" size="sm" onClick={() => { setShowMedicineSearch(null); setMedicineQuery(""); }}>
                        Cancel
                      </Button>
                    </div>
                  )}

                  {/* Rx items */}
                  {rxItems.length === 0 && !showMedicineSearch && (
                    <div className="flex flex-col items-center gap-1.5 py-6 text-center">
                      <Pill className="size-6 text-violet-300 dark:text-violet-700" />
                      <p className="text-xs text-muted-foreground">
                        No medicines added yet. Click "Add Medicine" to search and prescribe.
                      </p>
                    </div>
                  )}

                  {rxItems.map((item) => (
                    <div key={item.tempId} className="rounded-none border p-3 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium">{item.medicineName}</p>
                        <Button variant="ghost" size="icon" className="size-6 shrink-0" title="Remove item" onClick={() => removeRxItem(item.tempId)}>
                          <Trash2 className="size-3 text-destructive" />
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
                              className="size-7"
                              onClick={() => updateRxItem(item.tempId, { quantity: Math.max(1, item.quantity - 1) })}
                            >
                              <Minus className="size-3" />
                            </Button>
                            <span className="w-6 text-center text-sm">{item.quantity}</span>
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              className="size-7"
                              onClick={() => updateRxItem(item.tempId, { quantity: item.quantity + 1 })}
                            >
                              <Plus className="size-3" />
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
                          <Button variant="ghost" size="icon" className="size-6" title="Remove procedure" onClick={() => removeProcedureOrder(p.tempId)}>
                            <Trash2 className="size-3 text-destructive" />
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
        patientName={selectedEntry?.patient.name}
        open={historyOpen}
        onOpenChange={setHistoryOpen}
      />
    </div>
  );
}
