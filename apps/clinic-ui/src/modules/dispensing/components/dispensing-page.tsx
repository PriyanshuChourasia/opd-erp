import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { ColumnDef, PaginationState } from "@tanstack/react-table";
import { Package } from "lucide-react";
import { fetchDispensings, type Dispensing } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/data-table/data-table";

export function DispensingPage() {
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 20 });

  const { data: response, isLoading } = useQuery({
    queryKey: ["dispensing", pagination.pageIndex, pagination.pageSize],
    queryFn: () =>
      fetchDispensings({
        page: pagination.pageIndex + 1,
        limit: pagination.pageSize,
      }),
    placeholderData: (previous) => previous,
  });

  const dispensings = response?.data ?? [];
  const pageCount = response?.meta?.totalPages ?? 0;

  const columns = useMemo<ColumnDef<Dispensing>[]>(() => [
    {
      accessorKey: "medicineName",
      header: "Medicine",
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <Package className="size-3.5 text-primary" />
          </span>
          <span className="font-medium">{row.original.medicineName}</span>
        </div>
      ),
    },
    {
      accessorKey: "quantity",
      header: "Quantity",
    },
    {
      accessorKey: "batchNo",
      header: "Batch #",
      cell: ({ row }) => row.original.batchNo || <span className="text-muted-foreground">—</span>,
    },
    {
      accessorKey: "expiryDate",
      header: "Expiry",
      cell: ({ row }) => {
        const expiry = row.original.expiryDate;
        return expiry ? new Date(expiry).toLocaleDateString() : <span className="text-muted-foreground">—</span>;
      },
    },
    {
      accessorKey: "dispensedAt",
      header: "Dispensed at",
      cell: ({ row }) => new Date(row.original.dispensedAt).toLocaleString(),
    },
    {
      accessorKey: "dispensedBy",
      header: "Dispensed by",
      cell: ({ row }) => row.original.dispensedBy || <span className="text-muted-foreground">—</span>,
    },
  ], []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dispensing</h1>
        <p className="mt-1 text-sm text-muted-foreground">Pharmacy dispensing records and batch tracking</p>
      </div>

      <Card>
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={dispensings}
            pageCount={pageCount}
            pagination={pagination}
            onPaginationChange={setPagination}
            isLoading={isLoading}
            emptyState={
              <div className="flex flex-col items-center gap-2 py-6 text-center">
                <Package className="size-8 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">No dispensing records yet</p>
              </div>
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}
