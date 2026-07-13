import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef, PaginationState } from "@tanstack/react-table";
import { ChevronRight, ListOrdered, Plus, SkipForward, Trash2, UserCheck, UserX, X } from "lucide-react";
import { fetchQueue, createQueueEntry, updateQueueStatus, deleteQueueEntry, type QueueEntry } from "@/lib/api";
import { fetchDoctors, fetchPatients } from "@/lib/api";
import { toast } from "sonner";
import { extractApiError } from "@/lib/axios-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger,
} from "@/components/ui/sheet";
import { DataTable } from "@/components/data-table/data-table";
import { STATUS_STYLES, NEXT_STATUS } from "../data/interface";

export function QueuePage() {
  const queryClient = useQueryClient();
  const [filterDoctor, setFilterDoctor] = useState("");
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 20 });
  const [sheetOpen, setSheetOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [form, setForm] = useState<{ patientId: string; doctorId: string }>({ patientId: "", doctorId: "" });

  const { data: response, isLoading } = useQuery({
    queryKey: ["queue", filterDoctor, pagination.pageIndex, pagination.pageSize],
    queryFn: () => fetchQueue({
      doctorId: filterDoctor || undefined,
      page: pagination.pageIndex + 1,
      limit: pagination.pageSize,
    }),
    placeholderData: (previous) => previous,
    refetchInterval: 15_000,
  });

  const queue = response?.data ?? [];
  const pageCount = response?.meta?.totalPages ?? 0;

  const { data: doctorsResp } = useQuery({ queryKey: ["doctors", "", 0, 100], queryFn: () => fetchDoctors({ limit: 100 }) });
  const doctors = doctorsResp?.data ?? [];
  const { data: patientsResp } = useQuery({ queryKey: ["patients", "", 0, 100], queryFn: () => fetchPatients({ limit: 100 }) });
  const patients = patientsResp?.data ?? [];

  const createMutation = useMutation({
    mutationFn: createQueueEntry,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["queue"] }); setSheetOpen(false); setForm({ patientId: "", doctorId: "" }); toast.success("Patient added to queue"); },
    onError: (err) => { toast.error(extractApiError(err)); },
  });

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

  const waitingCount = queue.filter((e) => e.status === "WAITING").length;
  const inProgress = queue.filter((e) => e.status === "IN_PROGRESS");

  const columns = useMemo<ColumnDef<QueueEntry>[]>(() => [
    {
      accessorKey: "tokenNumber",
      header: "Token #",
      cell: ({ row }) => {
        const entry = row.original;
        return (
          <span className={`flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
            entry.status === "IN_PROGRESS" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" :
            entry.status === "COMPLETED" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
            "bg-muted text-muted-foreground"
          }`}>{String(entry.tokenNumber).padStart(2, "0")}</span>
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
      cell: ({ row }) => <span className="text-xs text-muted-foreground">{row.original.doctor?.medicalRegistrationNo ?? 'Doctor'}</span>,
    },
    {
      id: "checkedInAt",
      header: "Checked-in time",
      cell: ({ row }) => {
        const checkedInAt = row.original.checkedInAt;
        return (
          <span className="text-xs text-muted-foreground">
            {checkedInAt ? new Date(checkedInAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}
          </span>
        );
      },
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const entry = row.original;
        return (
          <div className="flex justify-end gap-1">
            {NEXT_STATUS[entry.status] && (
              <Button variant="ghost" size="icon" className="size-8" title={`Move to ${NEXT_STATUS[entry.status]}`} onClick={() => statusMutation.mutate({ id: entry.id, status: NEXT_STATUS[entry.status]! })}>
                {NEXT_STATUS[entry.status] === "IN_PROGRESS" ? <ChevronRight className="size-4 text-blue-600" /> :
                 NEXT_STATUS[entry.status] === "COMPLETED" ? <UserCheck className="size-4 text-green-600" /> : <ChevronRight className="size-4" />}
              </Button>
            )}
            {entry.status === "WAITING" && (
              <>
                <Button variant="ghost" size="icon" className="size-8" title="Skip" onClick={() => statusMutation.mutate({ id: entry.id, status: "SKIPPED" })}><SkipForward className="size-4 text-muted-foreground" /></Button>
                <Button variant="ghost" size="icon" className="size-8" title="No show" onClick={() => statusMutation.mutate({ id: entry.id, status: "NO_SHOW" })}><UserX className="size-4 text-red-500" /></Button>
              </>
            )}
            {deleteConfirm === entry.id ? (
              <div className="flex items-center gap-1">
                <Button variant="destructive" size="sm" className="h-8 text-xs" onClick={() => deleteMutation.mutate(entry.id)}>Confirm</Button>
                <Button variant="ghost" size="icon" className="size-8" onClick={() => setDeleteConfirm(null)}><X className="size-3.5" /></Button>
              </div>
            ) : (
              <Button variant="ghost" size="icon" className="size-8 text-destructive hover:text-destructive" onClick={() => setDeleteConfirm(entry.id)}><Trash2 className="size-3.5" /></Button>
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
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild><Button onClick={() => { setForm({ patientId: "", doctorId: "" }); setSheetOpen(true); }}><Plus className="mr-2 size-4" />Add to Queue</Button></SheetTrigger>
          <SheetContent side="right" className="sm:max-w-md">
            <SheetHeader><SheetTitle>Add to Queue</SheetTitle><SheetDescription>Select a patient and doctor to create a queue entry.</SheetDescription></SheetHeader>
            <div className="flex-1 space-y-4 px-4 pb-4">
              <FieldGroup>
                <Field><FieldLabel htmlFor="q-patient">Patient</FieldLabel>
                  <select id="q-patient" className="flex h-9 w-full rounded-none border border-input bg-background px-3 py-1 text-sm" value={form.patientId} onChange={(e) => setForm({ ...form, patientId: e.target.value })}>
                    <option value="">Select a patient...</option>
                    {patients.map((p) => (<option key={p.id} value={p.id}>{p.name} — {p.phone}</option>))}
                  </select>
                </Field>
                <Field><FieldLabel htmlFor="q-doctor">Doctor</FieldLabel>
                  <select id="q-doctor" className="flex h-9 w-full rounded-none border border-input bg-background px-3 py-1 text-sm" value={form.doctorId} onChange={(e) => setForm({ ...form, doctorId: e.target.value })}>
                    <option value="">Select a doctor...</option>
                    {doctors.map((d) => (<option key={d.id} value={d.id}>{d.medicalRegistrationNo ?? 'Doctor'}</option>))}
                  </select>
                </Field>
              </FieldGroup>
            </div>
            <SheetFooter>
              <Button variant="outline" onClick={() => setSheetOpen(false)}>Cancel</Button>
              <Button onClick={() => createMutation.mutate(form)} disabled={!form.patientId || !form.doctorId || createMutation.isPending}>Add to Queue</Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button variant={!filterDoctor ? "default" : "outline"} size="sm" onClick={() => { setFilterDoctor(""); setPagination((p) => ({ ...p, pageIndex: 0 })); }}>All</Button>          {doctors.map((d) => (
          <Button key={d.id} variant={filterDoctor === d.id ? "default" : "outline"} size="sm" onClick={() => { setFilterDoctor(d.id); setPagination((p) => ({ ...p, pageIndex: 0 })); }}>{d.medicalRegistrationNo ?? 'Doctor'}</Button>
        ))}
      </div>

      {inProgress.length > 0 && (
        <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/30">
          <CardContent className="flex items-center gap-3 p-4">
            <UserCheck className="size-5 text-blue-600 dark:text-blue-400" />
            <div className="text-sm">
              <span className="font-medium text-blue-700 dark:text-blue-300">Now serving: </span>
              {inProgress.map((e) => (
                <span key={e.id} className="after:content-[',_'] last:after:content-none">#{e.tokenNumber} {e.patient.name}</span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Today's Queue</CardTitle></CardHeader>
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
    </div>
  );
}
