import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import type { ColumnDef, PaginationState } from "@tanstack/react-table";
import { FileText, ListOrdered, Pencil, Receipt, Search, Trash2, X } from "lucide-react";
import { fetchQueue, updateQueueStatus, deleteQueueEntry, checkoutAppointment, type QueueEntry } from "@/lib/api";
import { fetchDoctors, fetchPatients } from "@/lib/api";
import { toast } from "sonner";
import { extractApiError } from "@/lib/axios-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/data-table/data-table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 20 });
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [editPatientId, setEditPatientId] = useState<string | null>(null);

  // Fetch the whole day's queue (a single day's volume is always small) and
  // split/paginate it client-side into the Active / History tabs below.
  const { data: response, isLoading } = useQuery({
    queryKey: ["queue", filterDoctor],
    queryFn: () => fetchQueue({
      doctorId: filterDoctor || undefined,
      page: 1,
      limit: 100,
    }),
    placeholderData: (previous) => previous,
    refetchInterval: 15_000,
  });

  const allQueue = response?.data ?? [];
  const activeQueue = useMemo(() => allQueue.filter((e) => ACTIVE_STATUSES.includes(e.status)), [allQueue]);
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
      cell: ({ row }) => <p className="text-sm font-medium">{row.original.patient.name}</p>,
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
          <div className="flex items-center justify-end gap-1">
            {entry.status === "COMPLETED" && entry.appointment && (
              entry.appointment.bill ? (
                <Badge variant="outline" className="text-[10px]" title={`Invoice ${entry.appointment.bill.invoiceNo}`}>{entry.appointment.bill.invoiceNo}</Badge>
              ) : (
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="size-8" title="Generate invoice (direct)" aria-label="Generate invoice directly" onClick={() => checkoutMutation.mutate(entry.appointment!.id)}>
                    <FileText className="size-4 text-green-600" />
                  </Button>
                  <Button variant="ghost" size="icon" className="size-8" title="Generate invoice (POS)" aria-label="Generate invoice via POS checkout" onClick={() => navigate({ to: "/pos", search: { appointmentId: entry.appointment!.id } })}>
                    <Receipt className="size-4 text-primary" />
                  </Button>
                </div>
              )
            )}
            {deleteConfirm === entry.id ? (
              <div className="flex items-center gap-1">
                <Button variant="destructive" size="sm" className="h-8 text-xs" onClick={() => deleteMutation.mutate(entry.id)}>Confirm</Button>
                <Button variant="ghost" size="icon" className="size-8" onClick={() => setDeleteConfirm(null)}><X className="size-3.5" /></Button>
              </div>
            ) : (
              <>
                <Select
                  value={entry.status}
                  onValueChange={(value) => {
                    if (value === entry.status) return;
                    statusMutation.mutate({ id: entry.id, status: value });
                  }}
                >
                  <SelectTrigger size="sm" className="h-8 text-xs" aria-label="Change queue status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {QUEUE_STATUSES.map((status) => (
                      <SelectItem key={status} value={status}>{status.replace("_", " ")}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="ghost" size="icon" className="size-8 text-destructive hover:text-destructive" onClick={() => setDeleteConfirm(entry.id)}><Trash2 className="size-3.5" /></Button>
              </>
            )}
          </div>
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
              <Button variant="ghost" size="icon-sm" aria-label="Clear doctor filter" onClick={() => { setFilterDoctor(""); setDoctorFilterQuery(""); setPagination((p) => ({ ...p, pageIndex: 0 })); }}><X className="size-3.5" /></Button>
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
    </div>
  );
}
