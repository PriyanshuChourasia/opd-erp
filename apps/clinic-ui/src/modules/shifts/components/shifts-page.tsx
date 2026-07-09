import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef, PaginationState } from "@tanstack/react-table";
import { Clock, Pencil, Plus, Search, Trash2, X, Moon, Sun, Sunrise } from "lucide-react";
import { fetchShifts, fetchShift, createShift, updateShift, deleteShift, type Shift, type CreateShiftInput } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger,
} from "@/components/ui/sheet";
import { DataTable } from "@/components/data-table/data-table";

function emptyForm(): CreateShiftInput {
  return { name: "", code: "", startTime: "09:00", endTime: "17:00" };
}

const SHIFT_ICONS: Record<string, typeof Clock> = {
  M: Sunrise,
  E: Sun,
  N: Moon,
};

function ShiftIcon({ code }: { code: string }) {
  const Icon = SHIFT_ICONS[code] ?? Clock;
  return <Icon className="size-3.5" />;
}

export function ShiftsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 20 });
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const [form, setForm] = useState<CreateShiftInput>(emptyForm());

  const { data: response, isLoading } = useQuery({
    queryKey: ["shifts", search, pagination.pageIndex, pagination.pageSize],
    queryFn: () => fetchShifts({
      search: search || undefined,
      page: pagination.pageIndex + 1,
      limit: pagination.pageSize,
    }),
    placeholderData: (previous) => previous,
  });

  const shifts = response?.data ?? [];
  const pageCount = response?.meta.totalPages ?? 0;

  const createMutation = useMutation({
    mutationFn: createShift,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["shifts"] }); closeSheet(); },
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateShiftInput> }) => updateShift(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["shifts"] }); closeSheet(); },
  });
  const deleteMutation = useMutation({
    mutationFn: deleteShift,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["shifts"] }); setDeleteConfirm(null); },
  });

  function openAdd() { setEditingId(null); setForm(emptyForm()); setSheetOpen(true); }

  async function openEdit(id: string) {
    setEditingId(id);
    const shift = await queryClient.fetchQuery({ queryKey: ["shift", id], queryFn: () => fetchShift(id) });
    setForm({
      name: shift.name,
      code: shift.code,
      startTime: shift.startTime,
      endTime: shift.endTime,
      breakStartTime: shift.breakStartTime ?? undefined,
      breakEndTime: shift.breakEndTime ?? undefined,
      isOvernight: shift.isOvernight,
      description: shift.description ?? undefined,
      isActive: shift.isActive,
    });
    setSheetOpen(true);
  }

  function closeSheet() { setSheetOpen(false); setEditingId(null); }

  function handleSave() {
    if (!form.name.trim() || !form.code.trim()) return;
    if (editingId) updateMutation.mutate({ id: editingId, data: form });
    else createMutation.mutate(form);
  }

  const columns = useMemo<ColumnDef<Shift>[]>(() => [
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => {
        const shift = row.original;
        return (
          <div className="flex items-center gap-3">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <ShiftIcon code={shift.code} />
            </span>
            <div className="min-w-0">
              <p className="truncate font-medium">{shift.name}</p>
              <p className="text-xs text-muted-foreground font-mono">[{shift.code}]</p>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "startTime",
      header: "Start",
      cell: ({ row }) => (
        <span className="flex items-center gap-1 text-sm">
          <Clock className="size-3.5 text-muted-foreground" />
          {row.original.startTime}
        </span>
      ),
    },
    {
      accessorKey: "endTime",
      header: "End",
      cell: ({ row }) => (
        <span className="flex items-center gap-1 text-sm">
          <Clock className="size-3.5 text-muted-foreground" />
          {row.original.endTime}
        </span>
      ),
    },
    {
      accessorKey: "breakStartTime",
      header: "Break",
      cell: ({ row }) => {
        const { breakStartTime, breakEndTime } = row.original;
        if (!breakStartTime || !breakEndTime) return <span className="text-muted-foreground text-xs">—</span>;
        return <span className="text-xs text-muted-foreground">{breakStartTime}–{breakEndTime}</span>;
      },
    },
    {
      accessorKey: "isOvernight",
      header: "Type",
      cell: ({ row }) =>
        row.original.isOvernight ? (
          <Badge variant="outline" className="text-[10px] border-indigo-300 text-indigo-600 dark:border-indigo-700 dark:text-indigo-400">
            <Moon className="mr-1 size-2.5" />Overnight
          </Badge>
        ) : (
          <Badge variant="outline" className="text-[10px]">Day</Badge>
        ),
    },
    {
      accessorKey: "isActive",
      header: "Status",
      cell: ({ row }) =>
        row.original.isActive ? (
          <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-[10px]" variant="outline">Active</Badge>
        ) : (
          <Badge className="bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 text-[10px]" variant="outline">Inactive</Badge>
        ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const shift = row.original;
        return (
          <div className="flex justify-end gap-1">
            <Button variant="ghost" size="icon" className="size-8" onClick={() => openEdit(shift.id)}>
              <Pencil className="size-3.5" />
            </Button>
            {deleteConfirm === shift.id ? (
              <div className="flex items-center gap-1">
                <Button variant="destructive" size="sm" className="h-8 text-xs" onClick={() => deleteMutation.mutate(shift.id)}>Confirm</Button>
                <Button variant="ghost" size="icon" className="size-8" onClick={() => setDeleteConfirm(null)}><X className="size-3.5" /></Button>
              </div>
            ) : (
              <Button variant="ghost" size="icon" className="size-8 text-destructive hover:text-destructive" onClick={() => setDeleteConfirm(shift.id)}>
                <Trash2 className="size-3.5" />
              </Button>
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
          <h1 className="text-2xl font-semibold tracking-tight">Shifts</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage work shift definitions used in employee scheduling</p>
        </div>
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild><Button onClick={openAdd}><Plus className="mr-2 size-4" />Add Shift</Button></SheetTrigger>
          <SheetContent side="right" className="sm:max-w-md overflow-y-auto">
            <SheetHeader><SheetTitle>{editingId ? "Edit Shift" : "Add Shift"}</SheetTitle><SheetDescription>{editingId ? "Update the shift definition below." : "Create a new work shift definition."}</SheetDescription></SheetHeader>
            <div className="flex-1 space-y-4 px-4 pb-4">
              <FieldGroup>
                <div className="grid grid-cols-2 gap-3">
                  <Field><FieldLabel htmlFor="s-name">Name *</FieldLabel><Input id="s-name" placeholder="Morning" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
                  <Field><FieldLabel htmlFor="s-code">Code *</FieldLabel><Input id="s-code" placeholder="M" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} /></Field>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Field><FieldLabel htmlFor="s-start">Start Time</FieldLabel><Input id="s-start" type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} /></Field>
                  <Field><FieldLabel htmlFor="s-end">End Time</FieldLabel><Input id="s-end" type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} /></Field>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Field><FieldLabel htmlFor="s-break-start">Break Start</FieldLabel><Input id="s-break-start" type="time" value={form.breakStartTime ?? ""} onChange={(e) => setForm({ ...form, breakStartTime: e.target.value || undefined })} /></Field>
                  <Field><FieldLabel htmlFor="s-break-end">Break End</FieldLabel><Input id="s-break-end" type="time" value={form.breakEndTime ?? ""} onChange={(e) => setForm({ ...form, breakEndTime: e.target.value || undefined })} /></Field>
                </div>
                <Field><FieldLabel htmlFor="s-desc">Description</FieldLabel><Input id="s-desc" placeholder="e.g. Morning outpatient department" value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field><FieldLabel htmlFor="s-overnight">Type</FieldLabel>
                    <Select value={form.isOvernight ? "true" : "false"} onValueChange={(v) => setForm({ ...form, isOvernight: v === "true" })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="false">Day Shift</SelectItem>
                        <SelectItem value="true">Overnight</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field><FieldLabel htmlFor="s-active">Status</FieldLabel>
                    <Select value={form.isActive !== false ? "true" : "false"} onValueChange={(v) => setForm({ ...form, isActive: v === "true" })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">Active</SelectItem>
                        <SelectItem value="false">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                </div>
              </FieldGroup>
            </div>
            <SheetFooter>
              <Button variant="outline" onClick={closeSheet}>Cancel</Button>
              <Button onClick={handleSave} disabled={!form.name.trim() || !form.code.trim() || createMutation.isPending || updateMutation.isPending}>
                {editingId ? "Save Changes" : "Create Shift"}
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name, code, or description..."
              className="pl-9"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPagination((p) => ({ ...p, pageIndex: 0 })); }}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={shifts}
            pageCount={pageCount}
            pagination={pagination}
            onPaginationChange={setPagination}
            isLoading={isLoading}
            emptyState={
              <div className="flex flex-col items-center gap-2 py-6 text-center">
                <Clock className="size-8 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">{search ? "No shifts found" : "No shifts defined yet"}</p>
              </div>
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}
