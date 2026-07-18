import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import type { ColumnDef, PaginationState } from "@tanstack/react-table";
import { FileText, ListOrdered, Plus, Receipt, Search, Trash2, X } from "lucide-react";
import { fetchQueue, createQueueEntry, updateQueueStatus, deleteQueueEntry, checkoutAppointment, type QueueEntry } from "@/lib/api";
import { fetchDoctors, fetchPatients } from "@/lib/api";
import { toast } from "sonner";
import { extractApiError } from "@/lib/axios-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger,
} from "@/components/ui/sheet";
import { DataTable } from "@/components/data-table/data-table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { STATUS_STYLES } from "../data/interface";

const QUEUE_STATUSES = ["WAITING", "IN_PROGRESS", "COMPLETED", "SKIPPED", "NO_SHOW"];

export function QueuePage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [filterDoctor, setFilterDoctor] = useState("");
  const [doctorFilterQuery, setDoctorFilterQuery] = useState("");
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

  const selectedFilterDoctor = doctors.find((d) => d.id === filterDoctor);
  const filteredDoctorOptions = doctorFilterQuery.trim()
    ? doctors.filter((d) => (d.name ?? d.medicalRegistrationNo ?? "").toLowerCase().includes(doctorFilterQuery.trim().toLowerCase()))
    : doctors;

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

  const checkoutMutation = useMutation({
    mutationFn: (appointmentId: string) => checkoutAppointment(appointmentId),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["queue"] }); toast.success("Invoice generated successfully"); },
    onError: (err) => { toast.error(extractApiError(err)); },
  });

  const waitingCount = queue.filter((e) => e.status === "WAITING").length;

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
      header: "",
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
                    {doctors.map((d) => (<option key={d.id} value={d.id}>{d.name ?? d.medicalRegistrationNo ?? 'Doctor'}</option>))}
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
