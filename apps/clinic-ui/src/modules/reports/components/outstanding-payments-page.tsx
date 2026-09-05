import { useState, useMemo } from "react";
import { useDateRangeSync } from "@/lib/date-range-search";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, Printer } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import * as XLSX from "xlsx";
import { useOutstandingPayments } from "../data/hooks";
import { fetchOutstandingPayments } from "../data/api";
import type { OutstandingPaymentRow } from "../data/interface";
import { useDoctors } from "@/modules/doctor-admin/data/hooks";
import { formatCurrency, statusBadgeClass, formatStatus } from "../data/utils";
import { toast } from "sonner";

// ─── Date helpers ────────────────────────────────────────────
function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function daysAgoStr(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

function tomorrowStr() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

function startOfWeekStr() {
  const d = new Date();
  const day = d.getDay();
  d.setDate(d.getDate() - day + (day === 0 ? -6 : 1)); // Monday
  return d.toISOString().slice(0, 10);
}

function startOfMonthStr() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
}

// ─── Main Component ──────────────────────────────────────────
export function OutstandingPaymentsPage() {
  const { dateRange } = useDateRangeSync();
  const from = dateRange.from ?? daysAgoStr(90);
  const to = dateRange.to ?? tomorrowStr();
  const [doctorId, setDoctorId] = useState<string>("all");
  const [paymentStatus, setPaymentStatus] = useState<string>("all");
  const [page, setPage] = useState(1);
  const limit = 50;

  const query = useOutstandingPayments(
    from,
    to,
    doctorId === "all" ? undefined : doctorId,
    undefined,
    paymentStatus === "all" ? undefined : paymentStatus,
    page,
    limit,
  );

  const doctorsQuery = useDoctors();

  const data = query.data?.data;
  const pagination = query.data?.pagination;
  const meta = query.data?.meta;

  // ─── Doctor list for filter ─────────────────────────────────
  const doctors = useMemo(() => {
    const list = doctorsQuery.data?.data;
    if (!list) return [];
    // The API returns { data: Doctor[] } or just Doctor[]
    const arr = Array.isArray(list) ? list : (list as Record<string, unknown>).data;
    if (Array.isArray(arr)) return arr as { id: string; firstName?: string; lastName?: string; specialization?: string }[];
    return [];
  }, [doctorsQuery.data]);

  // Fetch ALL records for export (large limit)
  const exportQuery = useQuery({
    queryKey: ["reports", "outstanding-payments-export", from, to, doctorId, paymentStatus],
    queryFn: () => fetchOutstandingPayments(
      from, to,
      doctorId === "all" ? undefined : doctorId,
      undefined,
      paymentStatus === "all" ? undefined : paymentStatus,
      1, 10000,
    ),
    staleTime: 30_000,
    enabled: false,
  });

  // ── Export to Excel ──────────────────────────────────────────
  async function exportToExcel() {
    const result = await exportQuery.refetch();
    const rows = result.data?.data?.rows ?? [];
    if (rows.length === 0) {
      toast.error("No data to export");
      return;
    }

    const excelRows = rows.map((row: OutstandingPaymentRow) => ({
      "Patient": row.patientName,
      "Appointment": row.appointmentId ?? "",
      "Doctor": row.doctorName,
      "Invoice": row.invoiceNo,
      "Total Amount": row.totalAmount,
      "Paid Amount": row.paidAmount,
      "Pending Amount": row.pendingAmount,
      "Payment Status": row.status,
      "Appointment Date": row.appointmentDate ?? "",
      "Invoice Date": new Date(row.createdAt).toLocaleDateString(),
    }));

    const ws = XLSX.utils.json_to_sheet(excelRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Outstanding Payments");
    XLSX.writeFile(wb, `outstanding-payments_${from}_to_${to}.xlsx`);
    toast.success("Excel exported successfully");
  }

  // ── Print report ────────────────────────────────────────────
  async function printReport() {
    const result = await exportQuery.refetch();
    const rows = result.data?.data?.rows ?? [];
    if (rows.length === 0) {
      toast.error("No data to export");
      return;
    }

    try {
      const htmlContent = `
        <html><head><style>
          body { font-family: Arial, sans-serif; font-size: 10px; margin: 15px; }
          h1 { text-align: center; margin-bottom: 4px; font-size: 16px; }
          h2 { text-align: center; margin-bottom: 12px; font-size: 12px; color: #666; }
          table { width: 100%; border-collapse: collapse; margin-top: 8px; }
          th, td { border: 1px solid #ddd; padding: 4px 6px; text-align: left; }
          th { background: #f3f4f6; font-weight: bold; font-size: 9px; }
          td { font-size: 9px; }
          tr:nth-child(even) { background: #f9fafb; }
          .text-right { text-align: right; }
          .totals-row { font-weight: bold; background: #e5e7eb; }
        </style></head><body>
        <h1>Outstanding / Pending Payment Report</h1>
        <h2>${from} to ${to} (${rows.length} records)</h2>
        <table>
          <thead><tr>
            <th>Patient</th>
            <th>Appointment</th>
            <th>Doctor</th>
            <th>Invoice</th>
            <th class="text-right">Total Amount</th>
            <th class="text-right">Paid Amount</th>
            <th class="text-right">Pending Amount</th>
            <th>Status</th>
            <th>Appointment Date</th>
            <th>Invoice Date</th>
          </tr></thead>
          <tbody>
            ${rows.map((row: OutstandingPaymentRow) => `<tr>
              <td>${row.patientName}</td>
              <td>${row.appointmentId ?? '-'}</td>
              <td>${row.doctorName}</td>
              <td>${row.invoiceNo}</td>
              <td class="text-right">${formatCurrency(row.totalAmount)}</td>
              <td class="text-right">${formatCurrency(row.paidAmount)}</td>
              <td class="text-right">${row.pendingAmount > 0 ? formatCurrency(row.pendingAmount) : '-'}</td>
              <td>${row.status}</td>
              <td>${row.appointmentDate ?? '-'}</td>
              <td>${new Date(row.createdAt).toLocaleDateString()}</td>
            </tr>`).join('')}
            <tr class="totals-row">
              <td colspan="4">Totals</td>
              <td class="text-right">${formatCurrency(rows.reduce((s: number, r: OutstandingPaymentRow) => s + r.totalAmount, 0))}</td>
              <td class="text-right">${formatCurrency(rows.reduce((s: number, r: OutstandingPaymentRow) => s + r.paidAmount, 0))}</td>
              <td class="text-right">${formatCurrency(rows.reduce((s: number, r: OutstandingPaymentRow) => s + r.pendingAmount, 0))}</td>
              <td colspan="3"></td>
            </tr>
          </tbody>
        </table>
        </body></html>`;
      const printWindow = window.open('', '_blank');
      if (!printWindow) return;
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
    } catch (err) {
      console.error('Failed to open the print window', err);
      toast.error('Failed to print the report');
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* ─── Header ──────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Outstanding Payments</h1>
        <p className="text-sm text-muted-foreground">
          View pending and partially paid invoices with aging analysis
        </p>
      </div>

      {/* ─── Filters ─────────────────────────────────────────── */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-end gap-4">
            {/* Doctor filter */}
            <div className="flex items-center gap-2">
              <label className="text-sm text-muted-foreground">Doctor:</label>
              <Select
                value={doctorId}
                onValueChange={(v) => { setDoctorId(v); setPage(1); }}
              >
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All Doctors" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Doctors</SelectItem>
                  {doctors.map((doc) => (
                    <SelectItem key={doc.id} value={doc.id}>
                      {`${doc.firstName || ''} ${doc.lastName || ''}`.trim() || doc.specialization}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Payment Status filter */}
            <div className="flex items-center gap-2">
              <label className="text-sm text-muted-foreground">Status:</label>
              <Select
                value={paymentStatus}
                onValueChange={(v) => { setPaymentStatus(v); setPage(1); }}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="PARTIAL">Partial</SelectItem>
                  <SelectItem value="PAID">Paid</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                  <SelectItem value="REFUNDED">Refunded</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Export buttons */}
            <div className="flex items-center gap-2 ml-auto">
              <Button variant="outline" size="sm" onClick={exportToExcel}>
                <Download className="h-4 w-4 mr-1" />
                Excel
              </Button>
              <Button variant="outline" size="sm" onClick={printReport}>
                <Printer className="h-4 w-4 mr-1" />
                Print
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ─── Meta Info ───────────────────────────────────────── */}
      {meta && (
        <p className="text-xs text-muted-foreground">
          Generated at {new Date(meta.generatedAt).toLocaleString()} •{" "}
          Data from {meta.from} to {meta.to}
        </p>
      )}

      {/* ─── Loading State ───────────────────────────────────── */}
      {query.isLoading && (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
          <Skeleton className="h-96 w-full" />
        </>
      )}

      {/* ─── Error State ─────────────────────────────────────── */}
      {query.isError && (
        <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20">
          <CardContent className="py-6">
            <p className="text-sm text-red-600 dark:text-red-400">
              Error loading report: {(query.error as Error)?.message || "Unknown error"}
            </p>
          </CardContent>
        </Card>
      )}

      {/* ─── Empty State ─────────────────────────────────────── */}
      {!query.isLoading && !query.isError && data && data.rows.length === 0 && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <p className="text-lg font-medium text-muted-foreground">No outstanding payments</p>
              <p className="text-sm text-muted-foreground mt-1">
                All invoices are fully paid for the selected period
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ─── Data Content ────────────────────────────────────── */}
      {!query.isLoading && !query.isError && data && data.rows.length > 0 && (
        <>
          {/* ─── Summary Cards ────────────────────────────────── */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Outstanding</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold tabular-nums text-amber-600 dark:text-amber-400">
                  {formatCurrency(data.summary.totalPendingAmount)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {data.summary.totalRecords} invoices
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Billed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold tabular-nums">{formatCurrency(data.summary.totalBilledAmount)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Paid</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(data.summary.totalPaidAmount)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Collection Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold tabular-nums">
                  {data.summary.totalBilledAmount > 0
                    ? `${((data.summary.totalPaidAmount / data.summary.totalBilledAmount) * 100).toFixed(1)}%`
                    : "0%"}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ─── Aging Buckets ────────────────────────────────── */}
          <Card>
            <CardHeader>
              <CardTitle>Aging Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                {data.summary.agingBuckets.map((bucket) => (
                  <div key={bucket.bucket} className="text-center p-4 rounded-lg border">
                    <p className="text-sm text-muted-foreground">{bucket.bucket}</p>
                    <p className="text-xl font-bold tabular-nums mt-1">{bucket.count}</p>
                    <p className="text-sm font-medium tabular-nums text-amber-600 dark:text-amber-400">
                      {formatCurrency(bucket.amount)}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* ─── Status Breakdown ─────────────────────────────── */}
          {data.summary.byStatus.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>By Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {data.summary.byStatus.map((item) => (
                    <div key={item.status} className="flex items-center justify-between">
                      <Badge className={statusBadgeClass(item.status)} variant="outline">
                        {formatStatus(item.status)}
                      </Badge>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-muted-foreground">{item.count}</span>
                        <span className="text-sm font-medium tabular-nums">{formatCurrency(item.amount)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* ─── Detailed Table ────────────────────────────────── */}
          <Card>
            <CardHeader>
              <CardTitle>Outstanding Invoices</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Patient</TableHead>
                      <TableHead>Appointment</TableHead>
                      <TableHead>Doctor</TableHead>
                      <TableHead>Invoice</TableHead>
                      <TableHead className="text-right">Total Amount</TableHead>
                      <TableHead className="text-right">Paid</TableHead>
                      <TableHead className="text-right">Pending</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Appt. Date</TableHead>
                      <TableHead>Invoice Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.rows.map((row, idx) => (
                      <TableRow key={`${row.id}-${idx}`}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{row.patientName}</p>
                            {row.patientPhone && (
                              <p className="text-xs text-muted-foreground">{row.patientPhone}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {row.appointmentId ? row.appointmentId.slice(0, 8) + "..." : "-"}
                        </TableCell>
                        <TableCell>{row.doctorName}</TableCell>
                        <TableCell className="font-mono text-xs">{row.invoiceNo}</TableCell>
                        <TableCell className="text-right tabular-nums font-medium">
                          {formatCurrency(row.totalAmount)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-emerald-600 dark:text-emerald-400">
                          {formatCurrency(row.paidAmount)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {row.pendingAmount > 0 ? (
                            <span className="text-amber-600 dark:text-amber-400 font-medium">
                              {formatCurrency(row.pendingAmount)}
                            </span>
                          ) : "-"}
                        </TableCell>
                        <TableCell>
                          <Badge className={statusBadgeClass(row.status)} variant="outline">
                            {formatStatus(row.status)}
                          </Badge>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">{row.appointmentDate ?? "-"}</TableCell>
                        <TableCell className="whitespace-nowrap">
                          {new Date(row.createdAt).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* ─── Pagination ─────────────────────────────────── */}
              {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    Page {pagination.page} of {pagination.totalPages} ({pagination.totalRecords} records)
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!pagination.hasPrevious}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!pagination.hasNext}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
