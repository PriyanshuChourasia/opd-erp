import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef, PaginationState } from "@tanstack/react-table";
import { Pill, Plus, Search } from "lucide-react";
import { fetchMedicines, fetchMedicineGroups, fetchUnits, createMedicine, type Medicine, type CreateMedicineInput } from "@/lib/api";
import { toast } from "sonner";
import { extractApiError } from "@/lib/axios-client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { DataTable } from "@/components/data-table/data-table";

function currency(value: number) {
  return `₹${value.toFixed(2)}`;
}

function emptyForm(): CreateMedicineInput {
  return { name: "", price: 0, category: "", alias: "", openingStock: 0 };
}

export function MedicineCatalogPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 20 });
  const [sheetOpen, setSheetOpen] = useState(false);
  const [form, setForm] = useState<CreateMedicineInput>(emptyForm());

  const { data: response, isLoading } = useQuery({
    queryKey: ["medicines", search, pagination.pageIndex, pagination.pageSize],
    queryFn: () =>
      fetchMedicines({
        search: search || undefined,
        page: pagination.pageIndex + 1,
        limit: pagination.pageSize,
      }),
    placeholderData: (previous) => previous,
  });

  const { data: groupsResponse } = useQuery({
    queryKey: ["medicine-groups"],
    queryFn: () => fetchMedicineGroups({ limit: 500 }),
  });

  const { data: unitsResponse } = useQuery({
    queryKey: ["units"],
    queryFn: () => fetchUnits({ limit: 500 }),
  });

  const groups = groupsResponse?.data ?? [];
  const units = unitsResponse?.data ?? [];

  const medicines = response?.data ?? [];
  const pageCount = response?.meta?.totalPages ?? 0;

  const createMutation = useMutation({
    mutationFn: createMedicine,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["medicines"] });
      closeSheet();
      toast.success("Medicine created successfully");
    },
    onError: (err) => { toast.error(extractApiError(err)); },
  });

  function openAdd() { setForm(emptyForm()); setSheetOpen(true); }
  function closeSheet() { setSheetOpen(false); }

  function handleSave() {
    if (!form.name.trim()) return;
    createMutation.mutate(form);
  }

  const columns = useMemo<ColumnDef<Medicine>[]>(() => [
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => {
        const medicine = row.original;
        return (
          <div className="flex items-center gap-3">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <Pill className="size-3.5 text-primary" />
            </span>
            <div className="min-w-0">
              <p className="truncate font-medium">{medicine.name}</p>
              {medicine.alias && <p className="text-xs text-muted-foreground">{medicine.alias}</p>}
              {medicine.brandName && <p className="text-xs text-muted-foreground">{medicine.brandName}</p>}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "group",
      header: "Group",
      cell: ({ row }) => row.original.group?.name ?? <span className="text-muted-foreground">—</span>,
    },
    {
      accessorKey: "unitMaster",
      header: "Unit",
      cell: ({ row }) => row.original.unitMaster?.name ?? <span className="text-muted-foreground">—</span>,
    },
    {
      accessorKey: "genericName",
      header: "Generic name",
      cell: ({ row }) => row.original.genericName || <span className="text-muted-foreground">—</span>,
    },
    {
      accessorKey: "category",
      header: "Category",
      cell: ({ row }) => {
        const category = row.original.category;
        if (!category) return <span className="text-muted-foreground">—</span>;
        return <Badge variant="outline" className="text-[10px] uppercase">{category}</Badge>;
      },
    },
    {
      accessorKey: "strength",
      header: "Strength",
      cell: ({ row }) => {
        const { strength, unit } = row.original;
        if (!strength) return <span className="text-muted-foreground">—</span>;
        return <span>{strength} <span className="text-xs text-muted-foreground">/ {unit}</span></span>;
      },
    },
    {
      accessorKey: "price",
      header: "Price",
      cell: ({ row }) => <span className="font-medium">{currency(row.original.price)}</span>,
    },
    {
      accessorKey: "currentStock",
      header: "Stock",
      cell: ({ row }) => {
        const stock = row.original.currentStock;
        if (stock == null) return <span className="text-muted-foreground">—</span>;
        return <span className="text-sm">{Number(stock)}</span>;
      },
    },
    {
      accessorKey: "isActive",
      header: "Status",
      cell: ({ row }) =>
        row.original.isActive ? (
          <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" variant="outline">Active</Badge>
        ) : (
          <Badge className="bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400" variant="outline">Inactive</Badge>
        ),
    },
  ], []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Medicine Catalog</h1>
          <p className="mt-1 text-sm text-muted-foreground">Browse the drug master database</p>
        </div>
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <Button onClick={openAdd}><Plus className="mr-2 size-4" />Add Medicine</Button>
          </SheetTrigger>
          <SheetContent side="right" className="sm:max-w-md overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Add Medicine</SheetTitle>
              <SheetDescription>Add a new medicine to the catalog.</SheetDescription>
            </SheetHeader>
            <div className="flex-1 space-y-4 px-4 pb-4">
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="m-name">Name *</FieldLabel>
                  <Input id="m-name" placeholder="e.g. AZOLID 500" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </Field>
                <Field>
                  <FieldLabel htmlFor="m-alias">Alias</FieldLabel>
                  <Input id="m-alias" placeholder="e.g. Azithromycin 500" value={form.alias ?? ""} onChange={(e) => setForm({ ...form, alias: e.target.value })} />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field>
                    <FieldLabel htmlFor="m-price">Price (₹)</FieldLabel>
                    <Input id="m-price" type="number" min={0} value={form.price ?? 0} onChange={(e) => setForm({ ...form, price: Number(e.target.value) || 0 })} />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="m-category">Category</FieldLabel>
                    <Input id="m-category" placeholder="e.g. TABLET" value={form.category ?? ""} onChange={(e) => setForm({ ...form, category: e.target.value })} />
                  </Field>
                </div>
                <Field>
                  <FieldLabel>Group</FieldLabel>
                  <Select value={form.groupId ?? ""} onValueChange={(v) => setForm({ ...form, groupId: v || undefined })}>
                    <SelectTrigger><SelectValue placeholder="Select group..." /></SelectTrigger>
                    <SelectContent>
                      {groups.map((g) => (
                        <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field>
                  <FieldLabel>Unit</FieldLabel>
                  <Select value={form.unitId ?? ""} onValueChange={(v) => setForm({ ...form, unitId: v || undefined })}>
                    <SelectTrigger><SelectValue placeholder="Select unit..." /></SelectTrigger>
                    <SelectContent>
                      {units.map((u) => (
                        <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field>
                  <FieldLabel htmlFor="m-stock">Opening Stock</FieldLabel>
                  <Input id="m-stock" type="number" min={0} value={form.openingStock ?? 0} onChange={(e) => setForm({ ...form, openingStock: Number(e.target.value) || 0 })} />
                </Field>
              </FieldGroup>
            </div>
            <SheetFooter>
              <Button variant="outline" onClick={closeSheet}>Cancel</Button>
              <Button onClick={handleSave} disabled={!form.name.trim() || createMutation.isPending}>
                {createMutation.isPending ? "Creating..." : "Create Medicine"}
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
              placeholder="Search by name, generic, or brand..."
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
            data={medicines}
            pageCount={pageCount}
            pagination={pagination}
            onPaginationChange={setPagination}
            isLoading={isLoading}
            emptyState={
              <div className="flex flex-col items-center gap-2 py-6 text-center">
                <Pill className="size-8 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">{search ? "No medicines found" : "No medicines in the catalog yet"}</p>
              </div>
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}
