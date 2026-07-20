import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef, PaginationState } from "@tanstack/react-table";
import { Ban, CreditCard, Eye, Pencil, Receipt, RotateCcw } from "lucide-react";
import { fetchBills, fetchOrganisation, updateBillStatus, type Bill, type BillStatus } from "@/lib/api";
import { toast } from "sonner";
import { extractApiError } from "@/lib/axios-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/data-table/data-table";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { PatientFormSheet } from "@/modules/patients/components/patient-form-sheet";

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
  const [viewBill, setViewBill] = useState<Bill | null>(null);
  const [editPatientId, setEditPatientId] = useState<string | null>(null);

  const { data: response, isLoading } = useQuery({
    queryKey: ["bills", pagination.pageIndex, pagination.pageSize],
    queryFn: () => fetchBills({ page: pagination.pageIndex + 1, limit: pagination.pageSize }),
    placeholderData: (previous) => previous,
    refetchInterval: 15_000,
  });

  const bills = response?.data ?? [];
  const pageCount = response?.meta?.totalPages ?? 0;

  const { data: organisation } = useQuery({ queryKey: ["organisation"], queryFn: fetchOrganisation });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: BillStatus }) => updateBillStatus(id, status),
    onSuccess: (_, variables) => { queryClient.invalidateQueries({ queryKey: ["bills"] }); toast.success(`Bill ${variables.status === "PAID" ? "marked as paid" : variables.status === "REFUNDED" ? "refunded" : "cancelled"}`); },
    onError: (err) => { toast.error(extractApiError(err)); },
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
        <div className="group flex items-center gap-2">
          <span className="text-sm">{row.original.patient ? row.original.patient.name : "Walk-in customer"}</span>
          {row.original.patient && (
            <button
              type="button"
              className="shrink-0 rounded p-0.5 text-muted-foreground opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100"
              title="Edit patient"
              onClick={() => setEditPatientId(row.original.patient!.id)}
            >
              <Pencil className="size-3" />
            </button>
          )}
        </div>
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
      header: "Action",
      cell: ({ row }) => {
        const bill = row.original;
        return (
          <div className="flex justify-end gap-1">
            <Button variant="ghost" size="icon" className="size-8" title="View invoice" onClick={() => setViewBill(bill)}>
              <Eye className="size-4 text-muted-foreground" />
            </Button>
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

      <Sheet open={!!viewBill} onOpenChange={(open) => !open && setViewBill(null)}>
        <SheetContent side="right" className="sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Invoice {viewBill?.invoiceNo}</SheetTitle>
            <SheetDescription>Full itemized invoice details.</SheetDescription>
          </SheetHeader>
          {viewBill && (
            <div className="space-y-4 px-4 pb-4 text-sm">
              {organisation && (
                <div className="border-b pb-3">
                  <p className="font-semibold">{organisation.name}</p>
                  {organisation.address && <p className="text-xs text-muted-foreground">{organisation.address}</p>}
                  <p className="text-xs text-muted-foreground">
                    {[organisation.phone, organisation.email].filter(Boolean).join(" · ")}
                  </p>
                  {organisation.registrationNumber && (
                    <p className="text-xs text-muted-foreground">Reg. No: {organisation.registrationNumber}</p>
                  )}
                </div>
              )}

              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Bill to</p>
                  <p className="font-medium">{viewBill.patient ? viewBill.patient.name : "Walk-in customer"}</p>
                  {viewBill.patient?.phone && <p className="text-xs text-muted-foreground">{viewBill.patient.phone}</p>}
                  {viewBill.patient?.address && <p className="text-xs text-muted-foreground">{viewBill.patient.address}</p>}
                </div>
                <div className="text-right">
                  <Badge variant="outline" className={`text-[10px] ${STATUS_STYLES[viewBill.status] ?? ""}`}>{viewBill.status}</Badge>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {new Date(viewBill.createdAt).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}
                  </p>
                </div>
              </div>

              {viewBill.appointment && (
                <div className="rounded-none border px-3 py-2 text-xs text-muted-foreground">
                  {viewBill.appointment.doctorName && <p>Doctor: <span className="text-foreground">{viewBill.appointment.doctorName}</span></p>}
                  <p>Visit type: <span className="text-foreground">{viewBill.appointment.type.replace("_", " ")}</span></p>
                  <p>Visit date: <span className="text-foreground">{new Date(viewBill.appointment.date).toLocaleDateString()}</span></p>
                </div>
              )}

              <table className="w-full text-xs [&_td]:py-1.5 [&_th]:pb-1.5">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="font-normal">Item</th>
                    <th className="w-10 text-center font-normal">Qty</th>
                    <th className="w-20 text-right font-normal">Unit</th>
                    <th className="w-20 text-right font-normal">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {viewBill.items.map((item) => (
                    <tr key={item.id} className="border-b last:border-0">
                      <td>{item.itemName}</td>
                      <td className="text-center">{item.quantity}</td>
                      <td className="text-right">{currency(item.unitPrice)}</td>
                      <td className="text-right">{currency(item.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="flex flex-col gap-0.5 border-t pt-2 text-xs text-muted-foreground">
                <div className="flex justify-between"><span>Subtotal</span><span>{currency(viewBill.subtotal)}</span></div>
                {viewBill.discount > 0 && <div className="flex justify-between"><span>Discount</span><span>-{currency(viewBill.discount)}</span></div>}
                {viewBill.tax > 0 && <div className="flex justify-between"><span>Tax</span><span>{currency(viewBill.tax)}</span></div>}
                <div className="flex justify-between text-sm font-semibold text-foreground"><span>Total</span><span>{currency(viewBill.total)}</span></div>
              </div>

              <div className="flex justify-between border-t pt-2 text-xs text-muted-foreground">
                <span>Payment method</span>
                <span className="text-foreground">{viewBill.paymentMethod}</span>
              </div>

              {viewBill.notes && (
                <div className="border-t pt-2">
                  <p className="text-xs text-muted-foreground">Notes</p>
                  <p className="text-xs">{viewBill.notes}</p>
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>

      <PatientFormSheet
        open={!!editPatientId}
        onOpenChange={(open) => { if (!open) setEditPatientId(null); }}
        editingPatient={editPatientId ? (bills.find((b) => b.patient?.id === editPatientId)?.patient ?? null) : null}
        onSaved={() => { queryClient.invalidateQueries({ queryKey: ["bills"] }); setEditPatientId(null); }}
      />
    </div>
  );
}
