import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef, PaginationState } from "@tanstack/react-table";
import { Building2, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { fetchDepartments, fetchDepartment, createDepartment, updateDepartment, deleteDepartment, type Department, type CreateDepartmentInput } from "@/lib/api";
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

function emptyForm(): CreateDepartmentInput {
  return { name: "", description: "" };
}

export function DepartmentsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [form, setForm] = useState<CreateDepartmentInput>(emptyForm());

  const { data: response, isLoading } = useQuery({
    queryKey: ["departments", search, pagination.pageIndex, pagination.pageSize],
    queryFn: () => fetchDepartments({ search: search || undefined, page: pagination.pageIndex + 1, limit: pagination.pageSize }),
    placeholderData: (previous) => previous,
  });

  const departments = response?.data ?? [];
  const pageCount = response?.meta?.totalPages ?? 0;

  const createMutation = useMutation({
    mutationFn: createDepartment,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["departments"] }); closeSheet(); toast.success("Department created successfully"); },
    onError: (err) => { toast.error(extractApiError(err)); },
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateDepartmentInput> }) => updateDepartment(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["departments"] }); closeSheet(); toast.success("Department updated successfully"); },
    onError: (err) => { toast.error(extractApiError(err)); },
  });
  const deleteMutation = useMutation({
    mutationFn: deleteDepartment,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["departments"] }); setDeleteConfirm(null); toast.success("Department deleted successfully"); },
    onError: (err) => { toast.error(extractApiError(err)); },
  });

  function openAdd() { setEditingId(null); setForm(emptyForm()); setSheetOpen(true); }

  async function openEdit(id: string) {
    setEditingId(id);
    const dept = await queryClient.fetchQuery({ queryKey: ["department", id], queryFn: () => fetchDepartment(id) });
    setForm({ name: dept.name, description: dept.description ?? undefined, isActive: dept.isActive });
    setSheetOpen(true);
  }

  function closeSheet() { setSheetOpen(false); setEditingId(null); }

  function handleSave() {
    if (!form.name.trim()) return;
    if (editingId) updateMutation.mutate({ id: editingId, data: form });
    else createMutation.mutate(form);
  }

  const columns = useMemo<ColumnDef<Department>[]>(() => [
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Building2 className="size-3.5" />
          </span>
          <div className="min-w-0">
            <p className="truncate font-medium">{row.original.name}</p>
            {row.original.description && <p className="text-xs text-muted-foreground truncate max-w-[200px]">{row.original.description}</p>}
          </div>
        </div>
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
        const dept = row.original;
        return (
          <div className="flex justify-end gap-1">
            <Button variant="ghost" size="icon" className="size-8" title="Edit" onClick={() => openEdit(dept.id)}>
              <Pencil className="size-3.5" />
            </Button>
            {deleteConfirm === dept.id ? (
              <div className="flex items-center gap-1">
                <Button variant="destructive" size="sm" className="h-8 text-xs" onClick={() => deleteMutation.mutate(dept.id)}>Confirm</Button>
                <Button variant="ghost" size="icon" className="size-8" title="Cancel" onClick={() => setDeleteConfirm(null)}><X className="size-3.5" /></Button>
              </div>
            ) : (
              <Button variant="ghost" size="icon" className="size-8 text-destructive hover:text-destructive" title="Delete" onClick={() => setDeleteConfirm(dept.id)}>
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
          <h1 className="text-2xl font-semibold tracking-tight">Departments</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage department master data</p>
        </div>
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild><Button onClick={openAdd}><Plus className="mr-2 size-4" />Add Department</Button></SheetTrigger>
          <SheetContent side="right" className="sm:max-w-md overflow-y-auto">
            <SheetHeader><SheetTitle>{editingId ? "Edit Department" : "Add Department"}</SheetTitle><SheetDescription>{editingId ? "Update department details." : "Create a new department."}</SheetDescription></SheetHeader>
            <div className="flex-1 space-y-4 px-4 pb-4">
              <FieldGroup>
                <Field><FieldLabel htmlFor="d-name">Name *</FieldLabel><Input id="d-name" placeholder="e.g. Cardiology" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
                <Field><FieldLabel htmlFor="d-desc">Description</FieldLabel><Input id="d-desc" placeholder="Optional description" value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
                {editingId && (
                  <Field><FieldLabel htmlFor="d-active">Status</FieldLabel>
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
              <Button onClick={handleSave} disabled={!form.name.trim() || createMutation.isPending || updateMutation.isPending}>
                {editingId ? "Save Changes" : "Create Department"}
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search departments..." className="pl-9" value={search} onChange={(e) => { setSearch(e.target.value); setPagination((p) => ({ ...p, pageIndex: 0 })); }} />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable columns={columns} data={departments} pageCount={pageCount} pagination={pagination} onPaginationChange={setPagination} isLoading={isLoading}
            emptyState={<div className="flex flex-col items-center gap-2 py-6 text-center"><Building2 className="size-8 text-muted-foreground/50" /><p className="text-sm text-muted-foreground">{search ? "No departments found" : "No departments yet"}</p></div>}
          />
        </CardContent>
      </Card>
    </div>
  );
}
