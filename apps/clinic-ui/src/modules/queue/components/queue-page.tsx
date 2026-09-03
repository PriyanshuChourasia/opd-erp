import { getPatientName } from "@/lib/api";
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useDateRangeSync } from "@/lib/date-range-search";
import type { ColumnDef, PaginationState } from "@tanstack/react-table";
import { FileText, HeartPulse, ListOrdered, Pencil, Receipt, Search, Trash2, X } from "lucide-react";
import { fetchQueue, updateQueueStatus, deleteQueueEntry, checkoutAppointment, createPatientVitals, fetchPatientVitalsLatest, type QueueEntry } from "@/lib/api";
import { fetchDoctors, fetchPatients } from "@/lib/api";
import { toast } from "sonner";
import { extractApiError } from "@/lib/axios-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/data-table/data-table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Field, FieldLabel } from "@/components/ui/field";
import { PatientFormSheet } from "@/modules/patients/components/patient-form-sheet";
import { STATUS_STYLES } from "../data/interface";

const QUEUE_STATUSES = ["WAITING", "IN_PROGRESS", "COMPLETED", "SKIPPED", "NO_SHOW"];
const ACTIVE_STATUSES = ["WAITING", "IN_PROGRESS"];
const HISTORY_STATUSES = ["COMPLETED", "SKIPPED", "NO_SHOW"];

type QueueTab = "ACTIVE" | "HISTORY";

export function QueuePage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [filterDoctor, setFilterDoctor] = useState("");
  const [doctorFilterQuery, setDoctorFilterQuery] = useState("");
  const [tab, setTab] = useState<QueueTab>("ACTIVE");
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [editPatientId, setEditPatientId] = useState<string | null>(null);
  // ── Vitals entry ──
  const [vitalsOpen, setVitalsOpen] = useState(false);
  const [vitalsEntry, setVitalsEntry] = useState<QueueEntry | null>(null);
  const [vitals, setVitals] = useState<Record<string, string>>({
    heightCm: "", weightCm: "", temperatureC: "", pulseBpm: "",
    systolicBp: "", diastolicBp: "", spo2Percent: "", respiratoryRate: "", medicalStatus: "",
  });

  const { dateRange } = useDateRangeSync();

  const { data: response, isLoading } = useQuery({
    queryKey: ["queue", filterDoctor, dateRange.from, dateRange.to],
    queryFn: () => fetchQueue({
      doctorId: filterDoctor || undefined,
      from: dateRange.from ?? undefined,
      to: dateRange.to ?? undefined,
      page: 1,
      limit: 100,
    }),
    placeholderData: (previous) => previous,
    refetchInterval: 15_000,
  });

  const allQueue = response?.data ?? [];
  const activeQueue = useMemo(() => allQueue
    .filter((e) => ACTIVE_STATUSES.includes(e.status))
    .sort((a, b) => {
      // IN_PROGRESS entries appear first, then WAITING by token number
      if (a.status === 'IN_PROGRESS' && b.status !== 'IN_PROGRESS') return -1;
      if (a.status !== 'IN_PROGRESS' && b.status === 'IN_PROGRESS') return 1;
      const aNum = parseInt(a.tokenNumber ?? '0', 10) || 0;
      const bNum = parseInt(b.tokenNumber ?? '0', 10) || 0;
      return aNum - bNum;
    }), [allQueue]);
  const historyQueue = useMemo(() => allQueue.filter((e) => HISTORY_STATUSES.includes(e.status)), [allQueue]);
  const tabQueue = tab === "ACTIVE" ? activeQueue : historyQueue;

  const pageCount = Math.max(1, Math.ceil(tabQueue.length / pagination.pageSize));
  const queue = useMemo(
    () => tabQueue.slice(pagination.pageIndex * pagination.pageSize, (pagination.pageIndex + 1) * pagination.pageSize),
    [tabQueue, pagination.pageIndex, pagination.pageSize],
  );

  function setTabAndResetPage(next: QueueTab) {
    setTab(next);
    setPagination((p) => ({ ...p, pageIndex: 0 }));
  }

  const { data: doctorsResp } = useQuery({ queryKey: ["doctors", "", 0, 100], queryFn: () => fetchDoctors({ limit: 100 }) });
  const doctors = doctorsResp?.data ?? [];
  const { data: patientsResp } = useQuery({ queryKey: ["patients", "", 0, 100], queryFn: () => fetchPatients({ limit: 100 }) });
  const patients = patientsResp?.data ?? [];

  const selectedFilterDoctor = doctors.find((d) => d.id === filterDoctor);
  const filteredDoctorOptions = doctorFilterQuery.trim()
    ? doctors.filter((d) => (d.name ?? d.medicalRegistrationNo ?? "").toLowerCase().includes(doctorFilterQuery.trim().toLowerCase()))
    : doctors;

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => updateQueueStatus(id, status),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["queue"] }); toast.success("Queue status updated"); },
    onError: (err) => { toast.error(extractApiError(err)); },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteQueueEntry,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["queue"] }); setDeleteConfirm(null); toast.success("Queue entry removed"); },
    onError: (err) => { toast.error(extractApiError(err)); },
  });

  const emptyVitals = { heightCm: "", weightCm: "", temperatureC: "", pulseBpm: "", systolicBp: "", diastolicBp: "", spo2Percent: "", respiratoryRate: "", medicalStatus: "" };

  const vitalsMutation = useMutation({
    mutationFn: async () => {
      if (!vitalsEntry) return;
      const payload: Record<string, string | number> = { patientId: vitalsEntry.patientId };
      if (vitalsEntry.appointment?.id) payload.appointmentId = vitalsEntry.appointment.id;
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
      setVitalsEntry(null);
      setVitals(emptyVitals);
    },
    onError: (err) => toast.error(extractApiError(err)),
  });

  async function openVitals(entry: QueueEntry) {
    setVitalsEntry(entry);
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

  const checkoutMutation = useMutation({
    mutationFn: (appointmentId: string) => checkoutAppointment(appointmentId),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["queue"] }); toast.success("Invoice generated successfully"); },
    onError: (err) => { toast.error(extractApiError(err)); },
  });

  const waitingCount = allQueue.filter((e) => e.status === "WAITING").length;

  const columns = useMemo<ColumnDef<QueueEntry>[]>(() => [
    {
      accessorKey: "tokenNumber",
      header: "Token #",
      cell: ({ row }) => {
        const entry = row.original;
        return (
          <span className={`flex shrink-0 items-center justify-center rounded-md px-2 py-0.5 text-[10px] font-mono font-bold ${
            entry.status === "IN_PROGRESS" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" :
            entry.status === "COMPLETED" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
            "bg-muted text-muted-foreground"
          }`}>{entry.tokenNumber}</span>
        );
      },
    },
    {
      id: "patient",
      header: "Patient",
      cell: ({ row }) => <p className="text-sm font-medium">{getPatientName(row.original.patient)}</p>,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const entry = row.original;
        return <Badge variant="outline" className={`text-[10px] ${STATUS_STYLES[entry.status] ?? ""}`}>{entry.status.replace("_", " ")}</Badge>;
      },
    },
    {
      id: "doctor",
      header: "Doctor",
      cell: ({ row }) => <span className="text-xs text-muted-foreground">{row.original.doctor?.name ?? row.original.doctor?.medicalRegistrationNo ?? 'Doctor'}</span>,
    },
    {
      id: "bookedDate",
      header: "Booked At",
      cell: ({ row }) => {
        const createdAt = row.original.createdAt;
        return (
          <span className="text-xs text-muted-foreground">
            {createdAt ? new Date(createdAt).toLocaleDateString() + " " + new Date(createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}
          </span>
        );
      },
    },
    {
      id: "checkupDate",
      header: "Checkup Date",
      cell: ({ row }) => {
        const apptDate = row.original.appointment?.date;
        const queueDate = row.original.queueDate;
        const displayDate = apptDate || queueDate;
        return (
          <span className="text-xs text-muted-foreground">
            {displayDate ? new Date(displayDate).toLocaleDateString() + " " + new Date(displayDate).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}
          </span>
        );
      },
    },
    {
      id: "actions",
      header: "Action",
      cell: ({ row }) => {
        const entry = row.original;
        return (
          <TooltipProvider>
          <div className="flex items-center gap-1">
            {entry.status === "COMPLETED" && entry.appointment && (
              entry.appointment.bill ? (
                <Badge variant="outline" className="text-[10px]">{entry.appointment.bill.invoiceNo}</Badge>
              ) : (
                <div className="flex items-center gap-1">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="size-9" aria-label="Generate invoice directly" onClick={() => checkoutMutation.mutate(entry.appointment!.id)}>
                        <FileText className="size-4.5 text-green-600" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Generate Invoice</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="size-9" aria-label="Generate invoice via POS checkout" onClick={() => navigate({ to: "/pos", search: { appointmentId: entry.appointment!.id } })}>
                        <Receipt className="size-4.5 text-primary" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Invoice via POS</TooltipContent>
                  </Tooltip>
                </div>
              )
            )}
            {entry.status !== "COMPLETED" && entry.status !== "SKIPPED" && entry.status !== "NO_SHOW" && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="size-9" aria-label="Record patient vitals" onClick={() => openVitals(entry)}>
                    <HeartPulse className="size-4.5 text-rose-500" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Record Vitals</TooltipContent>
              </Tooltip>
            )}
            {deleteConfirm === entry.id ? (
              <div className="flex items-center gap-1">
                <Button variant="destructive" size="sm" className="h-8 text-xs" onClick={() => deleteMutation.mutate(entry.id)}>Confirm</Button>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="size-9" onClick={() => setDeleteConfirm(null)}><X className="size-4.5" /></Button>
                  </TooltipTrigger>
                  <TooltipContent>Cancel</TooltipContent>
                </Tooltip>
              </div>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="size-9 text-destructive hover:text-destructive" aria-label="Remove from queue" onClick={() => setDeleteConfirm(entry.id)}>
                    <Trash2 className="size-4.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Remove from Queue</TooltipContent>
              </Tooltip>
            )}
          </div>
          </TooltipProvider>
        );
      },
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [deleteConfirm]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Queue</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage the live token queue — {waitingCount} waiting</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button variant={!filterDoctor ? "default" : "outline"} size="sm" onClick={() => { setFilterDoctor(""); setDoctorFilterQuery(""); setPagination((p) => ({ ...p, pageIndex: 0 })); }}>All</Button>
        <div className="relative w-64">
          {selectedFilterDoctor ? (
            <div className="flex h-9 items-center justify-between rounded-none border px-3 text-sm">
              <span className="truncate">{selectedFilterDoctor.name ?? selectedFilterDoctor.medicalRegistrationNo}</span>
              <Button variant="ghost" size="icon-sm" title="Clear doctor filter" aria-label="Clear doctor filter" onClick={() => { setFilterDoctor(""); setDoctorFilterQuery(""); setPagination((p) => ({ ...p, pageIndex: 0 })); }}><X className="size-3.5" /></Button>
            </div>
          ) : (
            <>
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search doctor by name..."
                className="h-9 pl-9"
                value={doctorFilterQuery}
                onChange={(e) => setDoctorFilterQuery(e.target.value)}
              />
              {doctorFilterQuery.trim().length >= 1 && (
                <div className="absolute z-50 mt-1 max-h-64 w-full divide-y overflow-y-auto rounded-none border bg-popover shadow-md">
                  {filteredDoctorOptions.length ? (
                    filteredDoctorOptions.map((d) => (
                      <button
                        key={d.id}
                        type="button"
                        className="flex w-full flex-col items-start px-3 py-2 text-left text-sm hover:bg-muted"
                        onClick={() => { setFilterDoctor(d.id); setDoctorFilterQuery(""); setPagination((p) => ({ ...p, pageIndex: 0 })); }}
                      >
                        <span className="font-medium">{d.name ?? d.medicalRegistrationNo}</span>
                        {d.specialization && <span className="text-xs text-muted-foreground">{d.specialization}</span>}
                      </button>
                    ))
                  ) : (
                    <p className="p-3 text-center text-sm text-muted-foreground">No doctors found.</p>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 border-b">
        <button
          type="button"
          className={`border-b-2 px-3 py-2 text-sm font-medium transition-colors ${tab === "ACTIVE" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
          onClick={() => setTabAndResetPage("ACTIVE")}
        >
          Waiting / In Progress ({activeQueue.length})
        </button>
        <button
          type="button"
          className={`border-b-2 px-3 py-2 text-sm font-medium transition-colors ${tab === "HISTORY" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
          onClick={() => setTabAndResetPage("HISTORY")}
        >
          Completed / Skipped / No-show ({historyQueue.length})
        </button>
      </div>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">{tab === "ACTIVE" ? "Today's Queue" : "Queue History"}</CardTitle></CardHeader>
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={queue}
            pageCount={pageCount}
            pagination={pagination}
            onPaginationChange={setPagination}
            isLoading={isLoading}
            emptyState={
              <div className="flex flex-col items-center gap-2 py-6 text-center">
                <ListOrdered className="size-8 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">Queue is empty</p>
              </div>
            }
          />
        </CardContent>
      </Card>

      <PatientFormSheet
        open={!!editPatientId}
        onOpenChange={(open) => { if (!open) setEditPatientId(null); }}
        editingPatient={editPatientId ? patients.find((p) => p.id === editPatientId) ?? null : null}
        onSaved={() => { queryClient.invalidateQueries({ queryKey: ["patients"] }); setEditPatientId(null); }}
      />

      {/* ── Record Vitals Sheet ── */}
      <Sheet open={vitalsOpen} onOpenChange={(open) => { if (!open) { setVitalsOpen(false); setVitalsEntry(null); } }}>
        <SheetContent side="right" className="sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <HeartPulse className="size-5 text-rose-500" />
              Record Vitals
            </SheetTitle>
          </SheetHeader>
          <div className="space-y-4 px-4 py-4">
            {vitalsEntry && (
              <div className="rounded-none border bg-muted/20 p-3 text-sm">
                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Patient</span>
                <p className="mt-0.5 font-medium">{getPatientName(vitalsEntry.patient)}</p>
                <p className="text-xs text-muted-foreground">{vitalsEntry.patient?.contactNo}</p>
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
            <Button variant="outline" onClick={() => { setVitalsOpen(false); setVitalsEntry(null); }}>Cancel</Button>
            <Button
              onClick={() => vitalsMutation.mutate()}
              disabled={!Object.values(vitals).some((v) => v !== "") || vitalsMutation.isPending}
            >
              {vitalsMutation.isPending ? "Saving..." : "Save Vitals"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
