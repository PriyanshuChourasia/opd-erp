import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef, PaginationState } from "@tanstack/react-table";
import { AlertTriangle, Pencil, Plus, Search, ShieldAlert, X } from "lucide-react";
import {
  fetchAllergies,
  fetchAllergy,
  createAllergy,
  updateAllergy,
  deleteAllergy,
  ALLERGY_SEVERITIES,
  ALLERGY_CATEGORIES,
  type Allergy,
  type AllergySeverity,
  type AllergyCategory,
  type CreateAllergyInput,
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

function emptyForm(): CreateAllergyInput {
  return { name: "", severity: "MODERATE", category: "OTHER" };
}

const SEVERITY_COLORS: Record<AllergySeverity, string> = {
  MILD: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  MODERATE: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  SEVERE: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  LIFE_THREATENING: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

const CATEGORY_COLORS: Record<AllergyCategory, string> = {
  DRUG: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  FOOD: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  ENVIRONMENTAL: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  OTHER: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
};

export function AllergiesPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 20,
  });
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [form, setForm] = useState<CreateAllergyInput>(emptyForm());

  const { data: response, isLoading } = useQuery({
    queryKey: ["allergies", search, pagination.pageIndex, pagination.pageSize],
    queryFn: () =>
      fetchAllergies({
        search: search || undefined,
        page: pagination.pageIndex + 1,
        limit: pagination.pageSize,
      }),
    placeholderData: (previous) => previous,
  });

  const allergies = response?.data ?? [];
  const pageCount = response?.meta?.totalPages ?? 0;

  const createMutation = useMutation({
    mutationFn: createAllergy,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allergies"] });
      closeSheet();
      toast.success("Allergy created successfully");
    },
    onError: (err) => toast.error(extractApiError(err)),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateAllergyInput> }) =>
      updateAllergy(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allergies"] });
      closeSheet();
      toast.success("Allergy updated successfully");
    },
    onError: (err) => toast.error(extractApiError(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAllergy,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allergies"] });
      setDeleteConfirm(null);
      toast.success("Allergy deleted successfully");
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
    const allergy = await queryClient.fetchQuery({
      queryKey: ["allergy", id],
      queryFn: () => fetchAllergy(id),
    });
    setForm({
      name: allergy.name,
      description: allergy.description ?? undefined,
      severity: allergy.severity,
      category: allergy.category,
      isActive: allergy.isActive,
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

  const columns = useMemo<ColumnDef<Allergy>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Allergy",
        cell: ({ row }) => {
          const allergy = row.original;
          return (
            <div className="flex items-center gap-3">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-red-50 dark:bg-red-950">
                <AlertTriangle className="size-4 text-red-500" />
              </span>
              <div className="min-w-0">
                <p className="truncate font-medium">{allergy.name}</p>
                {allergy.description && (
                  <p className="truncate text-xs text-muted-foreground">
                    {allergy.description}
                  </p>
                )}
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "category",
        header: "Category",
        cell: ({ row }) => (
          <Badge
            variant="outline"
            className={`text-[10px] ${CATEGORY_COLORS[row.original.category]}`}
          >
            {row.original.category}
          </Badge>
        ),
      },
      {
        accessorKey: "severity",
        header: "Severity",
        cell: ({ row }) => (
          <Badge
            variant="outline"
            className={`text-[10px] ${SEVERITY_COLORS[row.original.severity]}`}
          >
            <ShieldAlert className="mr-1 size-2.5" />
            {row.original.severity.replace("_", " ")}
          </Badge>
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
          const allergy = row.original;
          return (
            <div className="flex justify-end gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="size-8"
                onClick={() => openEdit(allergy.id)}
              >
                <Pencil className="size-3.5" />
              </Button>
              {deleteConfirm === allergy.id ? (
                <div className="flex items-center gap-1">
                  <Button
                    variant="destructive"
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() => deleteMutation.mutate(allergy.id)}
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
                  onClick={() => setDeleteConfirm(allergy.id)}
                >
                  <Pencil className="size-3.5" />
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
          <h1 className="text-2xl font-semibold tracking-tight">Allergies</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage the allergy master catalog used in patient records
          </p>
        </div>
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <Button onClick={openAdd}>
              <Plus className="mr-2 size-4" />Add Allergy
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="sm:max-w-md overflow-y-auto">
            <SheetHeader>
              <SheetTitle>
                {editingId ? "Edit Allergy" : "Add Allergy"}
              </SheetTitle>
              <SheetDescription>
                {editingId
                  ? "Update the allergy definition below."
                  : "Add a new allergy to the catalog."}
              </SheetDescription>
            </SheetHeader>
            <div className="flex-1 space-y-4 px-4 pb-4">
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="a-name">Name *</FieldLabel>
                  <Input
                    id="a-name"
                    placeholder="e.g. Penicillin, Peanuts, Latex"
                    value={form.name}
                    onChange={(e) =>
                      setForm({ ...form, name: e.target.value })
                    }
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="a-desc">Description</FieldLabel>
                  <Input
                    id="a-desc"
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
                <div className="grid grid-cols-2 gap-3">
                  <Field>
                    <FieldLabel>Category</FieldLabel>
                    <Select
                      value={form.category ?? "OTHER"}
                      onValueChange={(v) =>
                        setForm({ ...form, category: v as AllergyCategory })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ALLERGY_CATEGORIES.map((c) => (
                          <SelectItem key={c} value={c}>
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field>
                    <FieldLabel>Severity</FieldLabel>
                    <Select
                      value={form.severity ?? "MODERATE"}
                      onValueChange={(v) =>
                        setForm({ ...form, severity: v as AllergySeverity })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ALLERGY_SEVERITIES.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s.replace("_", " ")}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                </div>
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
                {editingId ? "Save Changes" : "Create Allergy"}
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
              placeholder="Search allergies..."
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
            data={allergies}
            pageCount={pageCount}
            pagination={pagination}
            onPaginationChange={setPagination}
            isLoading={isLoading}
            emptyState={
              <div className="flex flex-col items-center gap-2 py-6 text-center">
                <AlertTriangle className="size-8 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">
                  {search ? "No allergies found" : "No allergies defined yet"}
                </p>
              </div>
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}
