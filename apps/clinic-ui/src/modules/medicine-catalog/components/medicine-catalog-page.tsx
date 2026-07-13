import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { ColumnDef, PaginationState } from "@tanstack/react-table";
import { Pill, Search } from "lucide-react";
import { fetchMedicines, type Medicine } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/data-table/data-table";

function currency(value: number) {
  return `₹${(value / 100).toFixed(2)}`;
}

export function MedicineCatalogPage() {
  const [search, setSearch] = useState("");
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 20 });

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

  const medicines = response?.data ?? [];
  const pageCount = response?.meta?.totalPages ?? 0;

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
              {medicine.brandName && <p className="text-xs text-muted-foreground">{medicine.brandName}</p>}
            </div>
          </div>
        );
      },
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
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Medicine Catalog</h1>
        <p className="mt-1 text-sm text-muted-foreground">Browse the drug master database</p>
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
