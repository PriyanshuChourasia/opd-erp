import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef, PaginationState } from "@tanstack/react-table";
import { Ban, CreditCard, Receipt, RotateCcw } from "lucide-react";
import { fetchBills, updateBillStatus, type Bill, type BillStatus } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/data-table/data-table";

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  PAID: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  PARTIAL: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  REFUNDED: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  CANCELLED: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

function currency(value: number) { return `₹${value.toFixed(2)}`; }

export function BillingPage() {
  const queryClient = useQueryClient();
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 20 });

  const { data: response, isLoading } = useQuery({
    queryKey: ["bills", pagination.pageIndex, pagination.pageSize],
    queryFn: () => fetchBills({ page: pagination.pageIndex + 1, limit: pagination.pageSize }),
    placeholderData: (previous) => previous,
    refetchInterval: 15_000,
  });

  const bills = response?.data ?? [];
  const pageCount = response?.meta.totalPages ?? 0;

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: BillStatus }) => updateBillStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["bills"] }),
  });

  const columns = useMemo<ColumnDef<Bill>[]>(() => [
    {
      accessorKey: "invoiceNo",
      header: "Invoice #",
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted">
            <Receipt className="size-3.5 text-muted-foreground" />
          </span>
          <span className="text-sm font-medium">{row.original.invoiceNo}</span>
        </div>
      ),
    },
    {
      id: "patient",
      header: "Patient",
      cell: ({ row }) => (
        <span className="text-sm">{row.original.patient ? row.original.patient.name : "Walk-in customer"}</span>
      ),
    },
    {
      accessorKey: "paymentMethod",
      header: "Payment method",
      cell: ({ row }) => <span className="text-sm text-muted-foreground">{row.original.paymentMethod}</span>,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant="outline" className={`text-[10px] ${STATUS_STYLES[row.original.status] ?? ""}`}>
          {row.original.status}
        </Badge>
      ),
    },
    {
      id: "date",
      header: "Date",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {new Date(row.original.createdAt).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}
        </span>
      ),
    },
    {
      accessorKey: "total",
      header: "Total",
      cell: ({ row }) => <span className="text-sm font-semibold">{currency(row.original.total)}</span>,
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const bill = row.original;
        return (
          <div className="flex justify-end gap-1">
            {(bill.status === "PENDING" || bill.status === "PARTIAL") && (
              <Button variant="ghost" size="icon" className="size-8" title="Mark paid" onClick={() => statusMutation.mutate({ id: bill.id, status: "PAID" })}>
                <CreditCard className="size-4 text-green-600" />
              </Button>
            )}
            {bill.status === "PAID" && (
              <Button variant="ghost" size="icon" className="size-8" title="Refund" onClick={() => statusMutation.mutate({ id: bill.id, status: "REFUNDED" })}>
                <RotateCcw className="size-4 text-muted-foreground" />
              </Button>
            )}
            {bill.status === "PENDING" && (
              <Button variant="ghost" size="icon" className="size-8 text-destructive hover:text-destructive" title="Cancel" onClick={() => statusMutation.mutate({ id: bill.id, status: "CANCELLED" })}>
                <Ban className="size-4" />
              </Button>
            )}
          </div>
        );
      },
    },
  ], [statusMutation]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Billing</h1>
        <p className="mt-1 text-sm text-muted-foreground">Sales invoices and payment status</p>
      </div>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Invoices</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={bills}
            pageCount={pageCount}
            pagination={pagination}
            onPaginationChange={setPagination}
            isLoading={isLoading}
            emptyState={
              <div className="flex flex-col items-center gap-2 py-6 text-center">
                <Receipt className="size-8 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">No bills yet</p>
              </div>
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}
