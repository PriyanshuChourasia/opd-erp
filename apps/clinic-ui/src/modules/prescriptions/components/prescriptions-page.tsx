import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { ColumnDef, PaginationState } from "@tanstack/react-table";
import { ClipboardList } from "lucide-react";
import { fetchPrescriptions, type Prescription } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/data-table/data-table";

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  DISPENSED: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  CANCELLED: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

export function PrescriptionsPage() {
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 20 });

  const { data: response, isLoading } = useQuery({
    queryKey: ["prescriptions", pagination.pageIndex, pagination.pageSize],
    queryFn: () =>
      fetchPrescriptions({
        page: pagination.pageIndex + 1,
        limit: pagination.pageSize,
      }),
    placeholderData: (previous) => previous,
  });

  const prescriptions = response?.data ?? [];
  const pageCount = response?.meta.totalPages ?? 0;

  const columns = useMemo<ColumnDef<Prescription>[]>(() => [
    {
      id: "patient",
      header: "Patient",
      cell: ({ row }) => row.original.patient?.name ?? <span className="text-muted-foreground">—</span>,
    },
    {
      id: "doctor",
      header: "Doctor",
      cell: ({ row }) => row.original.doctor?.medicalRegistrationNo ?? <span className="text-muted-foreground">—</span>,
    },
    {
      accessorKey: "diagnosis",
      header: "Diagnosis",
      cell: ({ row }) => row.original.diagnosis || <span className="text-muted-foreground">—</span>,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.status;
        return (
          <Badge variant="outline" className={`text-[10px] uppercase ${STATUS_STYLES[status] ?? ""}`}>
            {status}
          </Badge>
        );
      },
    },
    {
      id: "items",
      header: "Items",
      cell: ({ row }) => row.original.items?.length ?? 0,
    },
    {
      accessorKey: "createdAt",
      header: "Created",
      cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString(),
    },
  ], []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Prescriptions</h1>
        <p className="mt-1 text-sm text-muted-foreground">Consultation diagnoses and prescribed medicines</p>
      </div>

      <Card>
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={prescriptions}
            pageCount={pageCount}
            pagination={pagination}
            onPaginationChange={setPagination}
            isLoading={isLoading}
            emptyState={
              <div className="flex flex-col items-center gap-2 py-6 text-center">
                <ClipboardList className="size-8 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">No prescriptions recorded yet</p>
              </div>
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}
