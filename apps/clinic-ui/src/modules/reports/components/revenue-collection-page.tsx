import { useState } from "react";
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
import { Download } from "lucide-react";
import * as XLSX from "xlsx";
import { useRevenueCollectionReport } from "../data/hooks";
import { fetchRevenueCollectionReport } from "../data/api";
import type { RevenueCollectionRow } from "../data/interface";
import { formatCurrency, statusBadgeClass, formatStatus } from "../data/utils";
import { toast } from "sonner";

export function RevenueCollectionPage() {
  const { dateRange } = useDateRangeSync();
  const today = new Date();
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const from = dateRange.from ?? thirtyDaysAgo.toISOString().slice(0, 10);
  const to = dateRange.to ?? tomorrow.toISOString().slice(0, 10);
  const [page, setPage] = useState(1);
  const limit = 50;

  const query = useRevenueCollectionReport(from, to, undefined, undefined, undefined, page, limit);

  const data = query.data?.data;
  const pagination = query.data?.pagination;
  const meta = query.data?.meta;

  // Fetch ALL records for export (large limit)
  const exportQuery = useQuery({
    queryKey: ["reports", "revenue-collection-export", from, to],
    queryFn: () => fetchRevenueCollectionReport(from, to, undefined, undefined, undefined, 1, 10000),
    staleTime: 30_000,
    enabled: false, // Only fetch on export click
  });

  // ── Export to Excel ──────────────────────────────────────────
  async function exportToExcel() {
    const result = await exportQuery.refetch();
    const rows = result.data?.data?.rows ?? [];
    if (rows.length === 0) {
      toast.error("No data to export");
      return;
    }

    const excelRows = rows.map((row: RevenueCollectionRow) => ({
      "Date": row.date,
      "Patient": row.patientName,
      "Doctor": row.doctorName,
      "Reg. Fee": row.registrationFee,
      "Consult. Fee": row.consultationFee,
      "Other": row.otherAmount,
      "Total": row.totalAmount,
      "Paid": row.amountPaid,
      "Pending": row.amountPending,
      "Method": row.paymentMethod,
      "Reference": row.transactionReference ?? "",
      "Invoice": row.invoiceNumber ?? "",
      "Status": row.paymentStatus,
    }));

    const ws = XLSX.utils.json_to_sheet(excelRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Revenue Collection");
    XLSX.writeFile(wb, `revenue-collection_${from}_to_${to}.xlsx`);
    toast.success("Excel exported successfully");
  }

  // ── Export to PDF ────────────────────────────────────────────
  async function exportToPdf() {
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
        <h1>Revenue / Collection Report</h1>
        <h2>${from} to ${to} (${rows.length} records)</h2>
        <table>
          <thead><tr>
            <th>Date</th>
            <th>Patient</th>
            <th>Doctor</th>
            <th class="text-right">Reg. Fee</th>
            <th class="text-right">Consult. Fee</th>
            <th class="text-right">Other</th>
            <th class="text-right">Total</th>
            <th class="text-right">Paid</th>
            <th class="text-right">Pending</th>
            <th>Method</th>
            <th>Reference</th>
            <th>Invoice</th>
            <th>Status</th>
          </tr></thead>
          <tbody>
            ${rows.map((row: RevenueCollectionRow) => `<tr>
              <td>${row.date}</td>
              <td>${row.patientName}</td>
              <td>${row.doctorName}</td>
              <td class="text-right">${formatCurrency(row.registrationFee)}</td>
              <td class="text-right">${formatCurrency(row.consultationFee)}</td>
              <td class="text-right">${row.otherAmount > 0 ? formatCurrency(row.otherAmount) : '-'}</td>
              <td class="text-right">${formatCurrency(row.totalAmount)}</td>
              <td class="text-right">${formatCurrency(row.amountPaid)}</td>
              <td class="text-right">${row.amountPending > 0 ? formatCurrency(row.amountPending) : '-'}</td>
              <td>${row.paymentMethod}</td>
              <td>${row.transactionReference ?? '-'}</td>
              <td>${row.invoiceNumber ?? '-'}</td>
              <td>${row.paymentStatus}</td>
            </tr>`).join('')}
            <tr class="totals-row">
              <td colspan="3">Totals</td>
              <td class="text-right">${formatCurrency(rows.reduce((s: number, r: RevenueCollectionRow) => s + r.registrationFee, 0))}</td>
              <td class="text-right">${formatCurrency(rows.reduce((s: number, r: RevenueCollectionRow) => s + r.consultationFee, 0))}</td>
              <td class="text-right">${formatCurrency(rows.reduce((s: number, r: RevenueCollectionRow) => s + r.otherAmount, 0))}</td>
              <td class="text-right">${formatCurrency(rows.reduce((s: number, r: RevenueCollectionRow) => s + r.totalAmount, 0))}</td>
              <td class="text-right">${formatCurrency(rows.reduce((s: number, r: RevenueCollectionRow) => s + r.amountPaid, 0))}</td>
              <td class="text-right">${formatCurrency(rows.reduce((s: number, r: RevenueCollectionRow) => s + r.amountPending, 0))}</td>
              <td colspan="4"></td>
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
      console.error('PDF generation failed', err);
      toast.error('Failed to generate PDF');
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* ─── Header ──────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Revenue Collection Report</h1>
          <p className="text-sm text-muted-foreground">
            Detailed payment and collection data by transaction
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={exportToExcel}>
            <Download className="h-4 w-4 mr-1" />
            Excel
          </Button>
          <Button variant="outline" size="sm" onClick={exportToPdf}>
            <Download className="h-4 w-4 mr-1" />
            PDF
          </Button>
        </div>
      </div>

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
            {Array.from({ length: 6 }).map((_, i) => (
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
              <p className="text-lg font-medium text-muted-foreground">No data for this range</p>
              <p className="text-sm text-muted-foreground mt-1">
                Try selecting a different date range
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ─── Data Content ────────────────────────────────────── */}
      {!query.isLoading && !query.isError && data && data.rows.length > 0 && (
        <>
          {/* ─── Summary Cards ────────────────────────────────── */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Billed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold tabular-nums">{formatCurrency(data.summary.totalBilledAmount)}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {data.summary.totalRows} transactions
                </p>
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
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Pending</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold tabular-nums text-amber-600 dark:text-amber-400">
                  {formatCurrency(data.summary.totalPendingAmount)}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ─── Fee Breakdown ────────────────────────────────── */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Registration Fees</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold tabular-nums">{formatCurrency(data.summary.totalRegistrationFee)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Consultation Fees</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold tabular-nums">{formatCurrency(data.summary.totalConsultationFee)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Other Amounts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold tabular-nums">{formatCurrency(data.summary.totalOtherAmount)}</div>
              </CardContent>
            </Card>
          </div>

          {/* ─── Payment Breakdown ─────────────────────────────── */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>By Payment Method</CardTitle>
              </CardHeader>
              <CardContent>
                {data.summary.byPaymentMethod.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No data</p>
                ) : (
                  <div className="space-y-2">
                    {data.summary.byPaymentMethod.map((item) => (
                      <div key={item.method} className="flex items-center justify-between">
                        <span className="text-sm">{item.method}</span>
                        <div className="flex items-center gap-4">
                          <span className="text-sm text-muted-foreground">{item.count}</span>
                          <span className="text-sm font-medium tabular-nums">{formatCurrency(item.amount)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>By Payment Status</CardTitle>
              </CardHeader>
              <CardContent>
                {data.summary.byPaymentStatus.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No data</p>
                ) : (
                  <div className="space-y-2">
                    {data.summary.byPaymentStatus.map((item) => (
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
                )}
              </CardContent>
            </Card>
          </div>

          {/* ─── Detailed Table ────────────────────────────────── */}
          <Card>
            <CardHeader>
              <CardTitle>Transaction Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Patient</TableHead>
                      <TableHead>Doctor</TableHead>
                      <TableHead className="text-right">Reg. Fee</TableHead>
                      <TableHead className="text-right">Consult. Fee</TableHead>
                      <TableHead className="text-right">Other</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="text-right">Paid</TableHead>
                      <TableHead className="text-right">Pending</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Reference</TableHead>
                      <TableHead>Invoice</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.rows.map((row, idx) => (
                      <TableRow key={`${row.appointmentId ?? row.invoiceNumber}-${idx}`}>
                        <TableCell className="whitespace-nowrap">{row.date}</TableCell>
                        <TableCell>{row.patientName}</TableCell>
                        <TableCell>{row.doctorName}</TableCell>
                        <TableCell className="text-right tabular-nums">{formatCurrency(row.registrationFee)}</TableCell>
                        <TableCell className="text-right tabular-nums">{formatCurrency(row.consultationFee)}</TableCell>
                        <TableCell className="text-right tabular-nums">{row.otherAmount > 0 ? formatCurrency(row.otherAmount) : '-'}</TableCell>
                        <TableCell className="text-right tabular-nums font-medium">{formatCurrency(row.totalAmount)}</TableCell>
                        <TableCell className="text-right tabular-nums text-emerald-600 dark:text-emerald-400">
                          {formatCurrency(row.amountPaid)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {row.amountPending > 0 ? (
                            <span className="text-amber-600 dark:text-amber-400">{formatCurrency(row.amountPending)}</span>
                          ) : '-'}
                        </TableCell>
                        <TableCell>{row.paymentMethod}</TableCell>
                        <TableCell className="font-mono text-xs">{row.transactionReference ?? '-'}</TableCell>
                        <TableCell className="font-mono text-xs">{row.invoiceNumber ?? '-'}</TableCell>
                        <TableCell>
                          <Badge className={statusBadgeClass(row.paymentStatus)} variant="outline">
                            {formatStatus(row.paymentStatus)}
                          </Badge>
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
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!pagination.hasNext}
                      onClick={() => setPage(p => p + 1)}
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
