import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef, PaginationState } from "@tanstack/react-table";
import { CalendarClock, Pencil, Plus, Search, Trash2, X, Check } from "lucide-react";
import { fetchFinancialYears, fetchFinancialYear, createFinancialYear, updateFinancialYear, deleteFinancialYear, type FinancialYear, type CreateFinancialYearInput } from "@/lib/api";
import { toast } from "sonner";
import { extractApiError } from "@/lib/axios-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { DataTable } from "@/components/data-table/data-table";

function emptyForm(): CreateFinancialYearInput {
  return { name: "", startDate: "", endDate: "", isCurrent: false };
}

export function FinancialYearsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 20 });
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [form, setForm] = useState<CreateFinancialYearInput>(emptyForm());

  const { data: response, isLoading } = useQuery({
    queryKey: ["financial-years", search, pagination.pageIndex, pagination.pageSize],
    queryFn: () => fetchFinancialYears({ search: search || undefined, page: pagination.pageIndex + 1, limit: pagination.pageSize }),
    placeholderData: (previous) => previous,
  });

  const financialYears = response?.data ?? [];
  const pageCount = response?.meta?.totalPages ?? 0;

  const createMutation = useMutation({
    mutationFn: createFinancialYear,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["financial-years"] }); closeSheet(); toast.success("Financial year created successfully"); },
    onError: (err) => { toast.error(extractApiError(err)); },
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateFinancialYearInput> }) => updateFinancialYear(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["financial-years"] }); closeSheet(); toast.success("Financial year updated successfully"); },
    onError: (err) => { toast.error(extractApiError(err)); },
  });
  const deleteMutation = useMutation({
    mutationFn: deleteFinancialYear,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["financial-years"] }); setDeleteConfirm(null); toast.success("Financial year deleted successfully"); },
    onError: (err) => { toast.error(extractApiError(err)); },
  });

  function openAdd() { setEditingId(null); setForm(emptyForm()); setSheetOpen(true); }

  async function openEdit(id: string) {
    setEditingId(id);
    const fy = await queryClient.fetchQuery({ queryKey: ["financial-year", id], queryFn: () => fetchFinancialYear(id) });
    setForm({ name: fy.name, startDate: fy.startDate.slice(0, 10), endDate: fy.endDate.slice(0, 10), isCurrent: fy.isCurrent, isActive: fy.isActive });
    setSheetOpen(true);
  }

  function closeSheet() { setSheetOpen(false); setEditingId(null); }

  function handleSave() {
    if (!form.name.trim() || !form.startDate || !form.endDate) return;
    const payload = { ...form, startDate: form.startDate + "T00:00:00.000Z", endDate: form.endDate + "T23:59:59.999Z" };
    if (editingId) updateMutation.mutate({ id: editingId, data: payload });
    else createMutation.mutate(payload);
  }

  const columns = useMemo<ColumnDef<FinancialYear>[]>(() => [
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <CalendarClock className="size-3.5" />
          </span>
          <div className="min-w-0">
            <p className="truncate font-medium">{row.original.name}</p>
            <p className="text-xs text-muted-foreground">
              {new Date(row.original.startDate).toLocaleDateString()} — {new Date(row.original.endDate).toLocaleDateString()}
            </p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "isCurrent",
      header: "Current",
      cell: ({ row }) =>
        row.original.isCurrent ? (
          <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 text-[10px]" variant="outline">
            <Check className="mr-1 size-2.5" />Current
          </Badge>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
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
      header: "Action",
      cell: ({ row }) => {
        const fy = row.original;
        return (
          <div className="flex justify-end gap-1">
            <Button variant="ghost" size="icon" className="size-8" title="Edit" onClick={() => openEdit(fy.id)}>
              <Pencil className="size-3.5" />
            </Button>
            {deleteConfirm === fy.id ? (
              <div className="flex items-center gap-1">
                <Button variant="destructive" size="sm" className="h-8 text-xs" onClick={() => deleteMutation.mutate(fy.id)}>Confirm</Button>
                <Button variant="ghost" size="icon" className="size-8" title="Cancel" onClick={() => setDeleteConfirm(null)}><X className="size-3.5" /></Button>
              </div>
            ) : (
              <Button variant="ghost" size="icon" className="size-8 text-destructive hover:text-destructive" title="Delete" onClick={() => setDeleteConfirm(fy.id)}>
                <Trash2 className="size-3.5" />
              </Button>
            )}
          </div>
        );
      },
    },
  ], [deleteConfirm]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Financial Years</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage financial year periods</p>
        </div>
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild><Button onClick={openAdd}><Plus className="mr-2 size-4" />Add Financial Year</Button></SheetTrigger>
          <SheetContent side="right" className="sm:max-w-md overflow-y-auto">
            <SheetHeader><SheetTitle>{editingId ? "Edit Financial Year" : "Add Financial Year"}</SheetTitle><SheetDescription>{editingId ? "Update financial year details." : "Create a new financial year."}</SheetDescription></SheetHeader>
            <div className="flex-1 space-y-4 px-4 pb-4">
              <FieldGroup>
                <Field><FieldLabel htmlFor="fy-name">Name *</FieldLabel><Input id="fy-name" placeholder="e.g. 2025-26" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field><FieldLabel htmlFor="fy-start">Start Date *</FieldLabel><Input id="fy-start" type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} /></Field>
                  <Field><FieldLabel htmlFor="fy-end">End Date *</FieldLabel><Input id="fy-end" type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} /></Field>
                </div>
                <Field><FieldLabel htmlFor="fy-current">Current Year</FieldLabel>
                  <Select value={form.isCurrent ? "true" : "false"} onValueChange={(v) => setForm({ ...form, isCurrent: v === "true" })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="true">Yes — Current</SelectItem><SelectItem value="false">No</SelectItem></SelectContent>
                  </Select>
                </Field>
                {editingId && (
                  <Field><FieldLabel htmlFor="fy-active">Status</FieldLabel>
                    <Select value={form.isActive !== false ? "true" : "false"} onValueChange={(v) => setForm({ ...form, isActive: v === "true" })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="true">Active</SelectItem><SelectItem value="false">Inactive</SelectItem></SelectContent>
                    </Select>
                  </Field>
                )}
              </FieldGroup>
            </div>
            <SheetFooter>
              <Button variant="outline" onClick={closeSheet}>Cancel</Button>
              <Button onClick={handleSave} disabled={!form.name.trim() || !form.startDate || !form.endDate || createMutation.isPending || updateMutation.isPending}>
                {editingId ? "Save Changes" : "Create Financial Year"}
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search financial years..." className="pl-9" value={search} onChange={(e) => { setSearch(e.target.value); setPagination((p) => ({ ...p, pageIndex: 0 })); }} />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable columns={columns} data={financialYears} pageCount={pageCount} pagination={pagination} onPaginationChange={setPagination} isLoading={isLoading}
            emptyState={<div className="flex flex-col items-center gap-2 py-6 text-center"><CalendarClock className="size-8 text-muted-foreground/50" /><p className="text-sm text-muted-foreground">{search ? "No financial years found" : "No financial years yet"}</p></div>}
          />
        </CardContent>
      </Card>
    </div>
  );
}
