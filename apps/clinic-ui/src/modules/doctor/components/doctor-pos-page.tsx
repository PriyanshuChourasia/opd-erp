import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2,
  Clock,
  Minus,
  Pill,
  Plus,
  Search,
  Stethoscope,
  Trash2,
  UserCheck,
  X,
} from "lucide-react";
import {
  fetchQueue,
  fetchMedicines,
  updateQueueStatus,
  createPrescription,
  type QueueEntry,
  type Medicine,
  type CreatePrescriptionItemInput,
} from "@/lib/api";
import { useAppSelector } from "@/store/hooks";
import { toast } from "sonner";
import { extractApiError } from "@/lib/axios-client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Separator } from "@/components/ui/separator";

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

const QUEUE_STATUS_STYLES: Record<string, string> = {
  WAITING: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  IN_PROGRESS: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  COMPLETED: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  SKIPPED: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  NO_SHOW: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

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

  const prescriptionMutation = useMutation({
    mutationFn: createPrescription,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["queue"] });
      toast.success("Prescription saved successfully");
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
  }

  function clearForm() {
    setSelectedEntry(null);
    setDiagnosis("");
    setNotes("");
    setRxItems([]);
    setMedicineQuery("");
    setShowMedicineSearch(null);
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
    prescriptionMutation.mutate({
      patientId: selectedEntry.patientId,
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">My Patients</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {waiting.length} waiting &middot; {inProgress.length} in progress
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Queue list */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Today's Queue</CardTitle>
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
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted text-xs font-bold">
                          {entry.tokenNumber.slice(-4)}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">{entry.patient.name}</p>
                          <p className="text-xs text-muted-foreground">{entry.patient.phone}</p>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <Badge variant="outline" className={`text-[9px] ${QUEUE_STATUS_STYLES[entry.status] ?? ""}`}>
                            {entry.status.replace("_", " ")}
                          </Badge>
                          {entry.status === "WAITING" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-7"
                              title="Start consultation"
                              onClick={(e) => {
                                e.stopPropagation();
                                statusMutation.mutate({ id: entry.id, status: "IN_PROGRESS" });
                                if (!selectedEntry || selectedEntry.id === entry.id) {
                                  setSelectedEntry({ ...entry, status: "IN_PROGRESS" });
                                }
                              }}
                            >
                              <UserCheck className="size-3.5 text-blue-600" />
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
        <div className="lg:col-span-3">
          {!selectedEntry ? (
            <Card className="flex items-center justify-center min-h-[400px]">
              <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
                <Stethoscope className="size-10 text-muted-foreground/40" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Select a patient from the queue</p>
                  <p className="text-xs text-muted-foreground">to start consultation and write prescription</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {/* Patient header */}
              <Card>
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold">
                      {selectedEntry.tokenNumber.slice(-4)}
                    </span>
                    <div>
                      <p className="text-sm font-semibold">{selectedEntry.patient.name}</p>
                      <p className="text-xs text-muted-foreground">{selectedEntry.patient.phone}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={`text-[10px] ${QUEUE_STATUS_STYLES[selectedEntry.status] ?? ""}`}>
                      {selectedEntry.status.replace("_", " ")}
                    </Badge>
                    <Button variant="ghost" size="icon" className="size-7" onClick={clearForm}>
                      <X className="size-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Diagnosis */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Diagnosis</CardTitle>
                </CardHeader>
                <CardContent>
                  <Input
                    placeholder="e.g. Upper respiratory infection, Type 2 Diabetes..."
                    value={diagnosis}
                    onChange={(e) => setDiagnosis(e.target.value)}
                  />
                </CardContent>
              </Card>

              {/* Medicines */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                  <CardTitle className="text-sm">Prescribed Medicines</CardTitle>
                  <Button variant="outline" size="sm" onClick={() => setShowMedicineSearch(crypto.randomUUID())}>
                    <Pill className="mr-1.5 size-3.5" />Add Medicine
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
                    <p className="py-4 text-center text-xs text-muted-foreground">
                      No medicines added yet. Click "Add Medicine" to search and prescribe.
                    </p>
                  )}

                  {rxItems.map((item) => (
                    <div key={item.tempId} className="rounded-none border p-3 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium">{item.medicineName}</p>
                        <Button variant="ghost" size="icon" className="size-6 shrink-0" onClick={() => removeRxItem(item.tempId)}>
                          <Trash2 className="size-3 text-destructive" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <Field>
                          <FieldLabel className="text-[10px]">Dosage</FieldLabel>
                          <Input
                            className="h-8 text-xs"
                            placeholder="1-0-1"
                            value={item.dosage}
                            onChange={(e) => updateRxItem(item.tempId, { dosage: e.target.value })}
                          />
                        </Field>
                        <Field>
                          <FieldLabel className="text-[10px]">Duration</FieldLabel>
                          <Input
                            className="h-8 text-xs"
                            placeholder="7 days"
                            value={item.duration}
                            onChange={(e) => updateRxItem(item.tempId, { duration: e.target.value })}
                          />
                        </Field>
                        <Field>
                          <FieldLabel className="text-[10px]">Qty</FieldLabel>
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

              {/* Notes */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Doctor's Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <textarea
                    className="flex min-h-[80px] w-full rounded-none border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground"
                    placeholder="Additional notes, follow-up instructions, diet advice..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </CardContent>
              </Card>

              {/* Actions */}
              <div className="flex items-center justify-between gap-3">
                <Button variant="outline" onClick={clearForm}>
                  Cancel
                </Button>
                <div className="flex items-center gap-2">
                  {selectedEntry.status === "IN_PROGRESS" && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        statusMutation.mutate({ id: selectedEntry.id, status: "COMPLETED" });
                        setSelectedEntry({ ...selectedEntry, status: "COMPLETED" });
                      }}
                    >
                      <CheckCircle2 className="mr-1.5 size-4" />
                      Mark Done (No Rx)
                    </Button>
                  )}
                  <Button
                    onClick={handleComplete}
                    disabled={rxItems.length === 0 || prescriptionMutation.isPending}
                  >
                    <Pill className="mr-1.5 size-4" />
                    {prescriptionMutation.isPending ? "Saving..." : "Complete & Prescribe"}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
