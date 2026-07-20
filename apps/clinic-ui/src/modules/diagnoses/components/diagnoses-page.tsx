import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef, PaginationState } from "@tanstack/react-table";
import { Pencil, Plus, Search, Stethoscope, X } from "lucide-react";
import {
  fetchDiagnoses,
  fetchDiagnosis,
  createDiagnosis,
  updateDiagnosis,
  deleteDiagnosis,
  type Diagnosis,
  type CreateDiagnosisInput,
} from "@/lib/api";
import { toast } from "sonner";
import { extractApiError } from "@/lib/axios-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { DataTable } from "@/components/data-table/data-table";

function emptyForm(): CreateDiagnosisInput {
  return { name: "", icdCode: "", description: "" };
}

export function DiagnosesPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 20,
  });
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [form, setForm] = useState<CreateDiagnosisInput>(emptyForm());

  const { data: response, isLoading } = useQuery({
    queryKey: ["diagnoses", search, pagination.pageIndex, pagination.pageSize],
    queryFn: () =>
      fetchDiagnoses({
        search: search || undefined,
        page: pagination.pageIndex + 1,
        limit: pagination.pageSize,
      }),
    placeholderData: (previous) => previous,
  });

  const diagnoses = response?.data ?? [];
  const pageCount = response?.meta?.totalPages ?? 0;

  const createMutation = useMutation({
    mutationFn: createDiagnosis,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["diagnoses"] });
      closeSheet();
      toast.success("Diagnosis created successfully");
    },
    onError: (err) => toast.error(extractApiError(err)),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateDiagnosisInput> }) =>
      updateDiagnosis(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["diagnoses"] });
      closeSheet();
      toast.success("Diagnosis updated successfully");
    },
    onError: (err) => toast.error(extractApiError(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteDiagnosis,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["diagnoses"] });
      setDeleteConfirm(null);
      toast.success("Diagnosis deleted successfully");
    },
    onError: (err) => toast.error(extractApiError(err)),
  });

  function openAdd() {
    setEditingId(null);
    setForm(emptyForm());
    setSheetOpen(true);
  }

  async function openEdit(id: string) {
    setEditingId(id);
    const diagnosis = await queryClient.fetchQuery({
      queryKey: ["diagnosis", id],
      queryFn: () => fetchDiagnosis(id),
    });
    setForm({
      name: diagnosis.name,
      icdCode: diagnosis.icdCode ?? undefined,
      description: diagnosis.description ?? undefined,
      isActive: diagnosis.isActive,
    });
    setSheetOpen(true);
  }

  function closeSheet() {
    setSheetOpen(false);
    setEditingId(null);
  }

  function handleSave() {
    if (!form.name.trim()) return;
    if (editingId) updateMutation.mutate({ id: editingId, data: form });
    else createMutation.mutate(form);
  }

  const columns = useMemo<ColumnDef<Diagnosis>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Diagnosis",
        cell: ({ row }) => {
          const diagnosis = row.original;
          return (
            <div className="flex items-center gap-3">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-950">
                <Stethoscope className="size-4 text-blue-500" />
              </span>
              <div className="min-w-0">
                <p className="truncate font-medium">{diagnosis.name}</p>
                {diagnosis.description && (
                  <p className="truncate text-xs text-muted-foreground">
                    {diagnosis.description}
                  </p>
                )}
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "icdCode",
        header: "ICD Code",
        cell: ({ row }) =>
          row.original.icdCode ? (
            <Badge variant="outline" className="text-[10px]">
              {row.original.icdCode}
            </Badge>
          ) : (
            <span className="text-muted-foreground">—</span>
          ),
      },
      {
        accessorKey: "isActive",
        header: "Status",
        cell: ({ row }) =>
          row.original.isActive ? (
            <Badge
              className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-[10px]"
              variant="outline"
            >
              Active
            </Badge>
          ) : (
            <Badge
              className="bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 text-[10px]"
              variant="outline"
            >
              Inactive
            </Badge>
          ),
      },
      {
        id: "actions",
        header: "Action",
        cell: ({ row }) => {
          const diagnosis = row.original;
          return (
            <div className="flex justify-end gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="size-8"
                onClick={() => openEdit(diagnosis.id)}
              >
                <Pencil className="size-3.5" />
              </Button>
              {deleteConfirm === diagnosis.id ? (
                <div className="flex items-center gap-1">
                  <Button
                    variant="destructive"
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() => deleteMutation.mutate(diagnosis.id)}
                  >
                    Confirm
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    onClick={() => setDeleteConfirm(null)}
                  >
                    <X className="size-3.5" />
                  </Button>
                </div>
              ) : (
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 text-destructive hover:text-destructive"
                  onClick={() => setDeleteConfirm(diagnosis.id)}
                >
                  <X className="size-3.5" />
                </Button>
              )}
            </div>
          );
        },
      },
      // eslint-disable-next-line react-hooks/exhaustive-deps
    ],
    [deleteConfirm],
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Diagnoses</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage the diagnosis master catalog used when recording prescriptions
          </p>
        </div>
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <Button onClick={openAdd}>
              <Plus className="mr-2 size-4" />Add Diagnosis
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="sm:max-w-md overflow-y-auto">
            <SheetHeader>
              <SheetTitle>
                {editingId ? "Edit Diagnosis" : "Add Diagnosis"}
              </SheetTitle>
              <SheetDescription>
                {editingId
                  ? "Update the diagnosis definition below."
                  : "Add a new diagnosis to the catalog."}
              </SheetDescription>
            </SheetHeader>
            <div className="flex-1 space-y-4 px-4 pb-4">
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="d-name">Name *</FieldLabel>
                  <Input
                    id="d-name"
                    placeholder="e.g. Hypertension, Type 2 Diabetes"
                    value={form.name}
                    onChange={(e) =>
                      setForm({ ...form, name: e.target.value })
                    }
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="d-icd">ICD Code</FieldLabel>
                  <Input
                    id="d-icd"
                    placeholder="e.g. I10"
                    value={form.icdCode ?? ""}
                    onChange={(e) =>
                      setForm({ ...form, icdCode: e.target.value || undefined })
                    }
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="d-desc">Description</FieldLabel>
                  <Input
                    id="d-desc"
                    placeholder="Optional description"
                    value={form.description ?? ""}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        description: e.target.value || undefined,
                      })
                    }
                  />
                </Field>
                <Field>
                  <FieldLabel>Status</FieldLabel>
                  <Select
                    value={form.isActive !== false ? "true" : "false"}
                    onValueChange={(v) =>
                      setForm({ ...form, isActive: v === "true" })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Active</SelectItem>
                      <SelectItem value="false">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              </FieldGroup>
            </div>
            <SheetFooter>
              <Button variant="outline" onClick={closeSheet}>
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={
                  !form.name.trim() ||
                  createMutation.isPending ||
                  updateMutation.isPending
                }
              >
                {editingId ? "Save Changes" : "Create Diagnosis"}
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
              placeholder="Search diagnoses..."
              className="pl-9"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPagination((p) => ({ ...p, pageIndex: 0 }));
              }}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={diagnoses}
            pageCount={pageCount}
            pagination={pagination}
            onPaginationChange={setPagination}
            isLoading={isLoading}
            emptyState={
              <div className="flex flex-col items-center gap-2 py-6 text-center">
                <Stethoscope className="size-8 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">
                  {search ? "No diagnoses found" : "No diagnoses defined yet"}
                </p>
              </div>
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}
