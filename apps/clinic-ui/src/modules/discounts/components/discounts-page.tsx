import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef, PaginationState } from "@tanstack/react-table";
import { BadgePercent, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { fetchDiscountRules, createDiscountRule, updateDiscountRule, deleteDiscountRule, type DiscountRule, type CreateDiscountRuleInput } from "@/lib/api";
import { toast } from "sonner";
import { extractApiError } from "@/lib/axios-client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { DataTable } from "@/components/data-table/data-table";

function emptyForm(): CreateDiscountRuleInput {
  return { name: "", type: "PERCENTAGE", value: 0, validFrom: "", validTo: "", description: "" };
}

function formatValue(rule: DiscountRule) {
  return rule.type === "PERCENTAGE" ? `${rule.value}%` : `₹${rule.value}`;
}

function formatDate(value?: string | null) {
  if (!value) return null;
  return new Date(value).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export function DiscountsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 20 });
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [form, setForm] = useState<CreateDiscountRuleInput>(emptyForm());

  const { data: response, isLoading } = useQuery({
    queryKey: ["discount-rules", search, pagination.pageIndex, pagination.pageSize],
    queryFn: () => fetchDiscountRules({ search: search || undefined, page: pagination.pageIndex + 1, limit: pagination.pageSize }),
    placeholderData: (previous) => previous,
  });

  const rules = response?.data ?? [];
  const pageCount = response?.meta?.totalPages ?? 0;

  const createMutation = useMutation({
    mutationFn: createDiscountRule,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["discount-rules"] }); closeSheet(); toast.success("Discount rule created successfully"); },
    onError: (err) => { toast.error(extractApiError(err)); },
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateDiscountRuleInput> }) => updateDiscountRule(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["discount-rules"] }); closeSheet(); toast.success("Discount rule updated successfully"); },
    onError: (err) => { toast.error(extractApiError(err)); },
  });
  const deleteMutation = useMutation({
    mutationFn: deleteDiscountRule,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["discount-rules"] }); setDeleteConfirm(null); toast.success("Discount rule deleted successfully"); },
    onError: (err) => { toast.error(extractApiError(err)); setDeleteConfirm(null); },
  });

  function openAdd() { setEditingId(null); setForm(emptyForm()); setSheetOpen(true); }

  function openEdit(rule: DiscountRule) {
    setEditingId(rule.id);
    setForm({
      name: rule.name,
      type: rule.type,
      value: rule.value,
      validFrom: rule.validFrom ? rule.validFrom.slice(0, 10) : "",
      validTo: rule.validTo ? rule.validTo.slice(0, 10) : "",
      isActive: rule.isActive,
      description: rule.description ?? "",
    });
    setSheetOpen(true);
  }

  function closeSheet() { setSheetOpen(false); setEditingId(null); }

  function handleSave() {
    if (!form.name.trim() || form.value <= 0) return;
    const payload: CreateDiscountRuleInput = {
      ...form,
      validFrom: form.validFrom || undefined,
      validTo: form.validTo || undefined,
      description: form.description || undefined,
    };
    if (editingId) updateMutation.mutate({ id: editingId, data: payload });
    else createMutation.mutate(payload);
  }

  const columns = useMemo<ColumnDef<DiscountRule>[]>(() => [
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <BadgePercent className="size-3.5" />
          </span>
          <div className="min-w-0">
            <p className="truncate font-medium">{row.original.name}</p>
            {row.original.description && <p className="text-xs text-muted-foreground truncate max-w-[240px]">{row.original.description}</p>}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "value",
      header: "Value",
      cell: ({ row }) => <span className="font-medium">{formatValue(row.original)}</span>,
    },
    {
      id: "validity",
      header: "Valid",
      cell: ({ row }) => {
        const from = formatDate(row.original.validFrom);
        const to = formatDate(row.original.validTo);
        if (!from && !to) return <span className="text-xs text-muted-foreground">Always</span>;
        return <span className="text-xs text-muted-foreground">{from ?? "—"} – {to ?? "—"}</span>;
      },
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
        const rule = row.original;
        return (
          <div className="flex justify-end gap-1">
            <Button variant="ghost" size="icon" className="size-8" title="Edit" onClick={() => openEdit(rule)}>
              <Pencil className="size-3.5" />
            </Button>
            {deleteConfirm === rule.id ? (
              <div className="flex items-center gap-1">
                <Button variant="destructive" size="sm" className="h-8 text-xs" onClick={() => deleteMutation.mutate(rule.id)}>Confirm</Button>
                <Button variant="ghost" size="icon" className="size-8" title="Cancel" onClick={() => setDeleteConfirm(null)}><X className="size-3.5" /></Button>
              </div>
            ) : (
              <Button variant="ghost" size="icon" className="size-8 text-destructive hover:text-destructive" title="Delete" onClick={() => setDeleteConfirm(rule.id)}>
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
          <h1 className="text-2xl font-semibold tracking-tight">Discounts</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage named discount rules staff can apply at payment time</p>
        </div>
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild><Button onClick={openAdd}><Plus className="mr-2 size-4" />Add Discount</Button></SheetTrigger>
          <SheetContent side="right" className="sm:max-w-md overflow-y-auto">
            <SheetHeader><SheetTitle>{editingId ? "Edit Discount" : "Add Discount"}</SheetTitle><SheetDescription>{editingId ? "Update this discount rule." : "Create a named discount staff can select at payment time."}</SheetDescription></SheetHeader>
            <div className="flex-1 space-y-4 px-4 pb-4">
              <FieldGroup>
                <Field><FieldLabel htmlFor="dr-name">Name *</FieldLabel><Input id="dr-name" placeholder="e.g. New Year Special" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>

                <Field>
                  <FieldLabel>Type</FieldLabel>
                  <div className="flex rounded-none border p-0.5 w-fit">
                    {(["PERCENTAGE", "FLAT"] as const).map((t) => (
                      <button
                        key={t}
                        type="button"
                        className={cn("rounded px-3 py-1 text-xs font-medium", form.type === t ? "bg-primary text-primary-foreground" : "text-muted-foreground")}
                        onClick={() => setForm({ ...form, type: t })}
                      >
                        {t === "PERCENTAGE" ? "Percentage" : "Flat"}
                      </button>
                    ))}
                  </div>
                </Field>

                <Field>
                  <FieldLabel htmlFor="dr-value">{form.type === "PERCENTAGE" ? "Value (%)" : "Value (₹)"}</FieldLabel>
                  <Input id="dr-value" type="number" min={1} value={form.value} onChange={(e) => setForm({ ...form, value: Math.max(0, Number(e.target.value) || 0) })} />
                </Field>

                <div className="grid grid-cols-2 gap-3">
                  <Field><FieldLabel htmlFor="dr-from">Valid From (optional)</FieldLabel><Input id="dr-from" type="date" value={form.validFrom ?? ""} onChange={(e) => setForm({ ...form, validFrom: e.target.value })} /></Field>
                  <Field><FieldLabel htmlFor="dr-to">Valid To (optional)</FieldLabel><Input id="dr-to" type="date" value={form.validTo ?? ""} onChange={(e) => setForm({ ...form, validTo: e.target.value })} /></Field>
                </div>
                <p className="text-[11px] text-muted-foreground">Leave both blank for an ongoing discount (e.g. a loyalty discount). Set both for a time-boxed offer (e.g. a New Year sale).</p>

                <Field><FieldLabel htmlFor="dr-desc">Description (optional)</FieldLabel><Input id="dr-desc" placeholder="Internal note" value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>

                {editingId && (
                  <Field><FieldLabel htmlFor="dr-active">Status</FieldLabel>
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
              <Button onClick={handleSave} disabled={!form.name.trim() || form.value <= 0 || createMutation.isPending || updateMutation.isPending}>
                {editingId ? "Save Changes" : "Create Discount"}
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search discounts..." className="pl-9" value={search} onChange={(e) => { setSearch(e.target.value); setPagination((p) => ({ ...p, pageIndex: 0 })); }} />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable columns={columns} data={rules} pageCount={pageCount} pagination={pagination} onPaginationChange={setPagination} isLoading={isLoading}
            emptyState={<div className="flex flex-col items-center gap-2 py-6 text-center"><BadgePercent className="size-8 text-muted-foreground/50" /><p className="text-sm text-muted-foreground">{search ? "No discounts found" : "No discount rules yet"}</p></div>}
          />
        </CardContent>
      </Card>
    </div>
  );
}
