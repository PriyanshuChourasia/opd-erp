import { useState } from "react";
import { useDateRangeSync } from "@/lib/date-range-search";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import * as XLSX from "xlsx";
import { useDailyOpdSummary } from "../data/hooks";
import { formatCurrency } from "../data/utils";
import { toast } from "sonner";

// ─── KPI Card Component ──────────────────────────────────────
interface KpiCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  variant?: "default" | "success" | "warning" | "danger";
  isCurrency?: boolean;
}

function KpiCard({ title, value, subtitle, variant = "default", isCurrency = false }: KpiCardProps) {
  const variantStyles = {
    default: "bg-background",
    success: "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800",
    warning: "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800",
    danger: "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800",
  };

  return (
    <Card className={variantStyles[variant]}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold tabular-nums">
          {isCurrency ? formatCurrency(value as number) : value}
        </div>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Status Badge Component ──────────────────────────────────
function StatusBadge({ status, count, percentage }: { status: string; count: number; percentage: number }) {
  const getVariant = (status: string) => {
    switch (status) {
      case "COMPLETED":
      case "PAID":
        return "default";
      case "SCHEDULED":
      case "CONFIRMED":
      case "PENDING":
        return "secondary";
      case "CANCELLED":
      case "NO_SHOW":
        return "destructive";
      case "CHECKED_IN":
      case "IN_PROGRESS":
        return "outline";
      default:
        return "secondary";
    }
  };

  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-2">
        <Badge variant={getVariant(status)}>{status.replace(/_/g, " ")}</Badge>
        <span className="text-sm text-muted-foreground">{count}</span>
      </div>
      <span className="text-sm font-medium tabular-nums">{percentage.toFixed(1)}%</span>
    </div>
  );
}

// ─── Main Page Component ─────────────────────────────────────
export function DailyOpdSummaryPage() {
  const { dateRange } = useDateRangeSync();
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().slice(0, 10);

  const from = dateRange.from ?? todayStr;
  const to = dateRange.to ?? tomorrowStr;
  const query = useDailyOpdSummary(from, to);

  const data = query.data?.data;
  const meta = query.data?.meta;

  // ── Export to Excel ──────────────────────────────────────────
  function exportToExcel() {
    if (!data) return;

    // Sheet 1: Summary KPIs
    const summaryRows = [
      { Metric: "Total Appointments", Value: data.summary.totalAppointments },
      { Metric: "Completed", Value: data.summary.completedAppointments },
      { Metric: "Pending", Value: data.summary.pendingAppointments },
      { Metric: "Cancelled", Value: data.summary.cancelledAppointments },
      { Metric: "No-shows", Value: data.summary.noShowAppointments },
      { Metric: "Walk-ins", Value: data.summary.walkInAppointments },
      { Metric: "New Patients", Value: data.summary.newPatients },
      { Metric: "Returning Patients", Value: data.summary.returningPatients },
      { Metric: "Consultation Amount", Value: data.summary.totalConsultationAmount },
      { Metric: "Registration Amount", Value: data.summary.totalRegistrationAmount },
      { Metric: "Amount Collected", Value: data.summary.totalAmountCollected },
      { Metric: "Pending Amount", Value: data.summary.pendingAmount },
      { Metric: "Outstanding Invoices", Value: data.summary.outstandingInvoices },
      { Metric: "Completion Rate", Value: `${(data.summary.completionRate * 100).toFixed(1)}%` },
      { Metric: "Cancellation Rate", Value: `${(data.summary.cancellationRate * 100).toFixed(1)}%` },
      { Metric: "No-show Rate", Value: `${(data.summary.noShowRate * 100).toFixed(1)}%` },
    ];

    // Sheet 2: By Status
    const statusRows = data.byStatus.map((item) => ({
      Status: item.status,
      Count: item.count,
      Percentage: `${item.percentage}%`,
    }));

    // Sheet 3: By Type
    const typeRows = data.byType.map((item) => ({
      Type: item.type,
      Count: item.count,
      Percentage: `${item.percentage}%`,
    }));

    // Sheet 4: Doctor Performance
    const doctorRows = data.byDoctor.map((doc) => ({
      "Doctor": doc.doctorName ?? doc.doctorId,
      Appointments: doc.totalAppointments,
      Completed: doc.completed,
      Revenue: doc.revenue,
    }));

    // Sheet 5: Hourly Distribution
    const hourRows = data.byHour.map((item) => ({
      Hour: `${item.hour}:00`,
      Appointments: item.count,
    }));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summaryRows), "Summary");
    if (statusRows.length) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(statusRows), "By Status");
    if (typeRows.length) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(typeRows), "By Type");
    if (doctorRows.length) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(doctorRows), "Doctor Performance");
    if (hourRows.length) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(hourRows), "Hourly Distribution");

    const rangeLabel = from === to ? from : `${from}_to_${to}`;
    XLSX.writeFile(wb, `daily-opd-summary_${rangeLabel}.xlsx`);
    toast.success("Excel exported successfully");
  }

  // ── Export to PDF ────────────────────────────────────────────
  async function exportToPdf() {
    if (!data) return;
    try {
      const rangeLabel = from === to ? from : `${from} to ${to}`;
      const htmlContent = `
        <html><head><style>
          body { font-family: Arial, sans-serif; font-size: 12px; margin: 20px; }
          h1 { text-align: center; margin-bottom: 4px; font-size: 18px; }
          h2 { text-align: center; margin-bottom: 16px; font-size: 13px; color: #666; }
          h3 { margin-top: 16px; margin-bottom: 8px; font-size: 14px; }
          table { width: 100%; border-collapse: collapse; margin-top: 8px; margin-bottom: 12px; }
          th, td { border: 1px solid #ddd; padding: 6px 8px; text-align: left; }
          th { background: #f3f4f6; font-weight: bold; }
          tr:nth-child(even) { background: #f9fafb; }
          .text-right { text-align: right; }
        </style></head><body>
        <h1>Daily OPD Summary</h1>
        <h2>${rangeLabel}</h2>

        <h3>Appointments Overview</h3>
        <table>
          <tr><th>Metric</th><th class="text-right">Value</th></tr>
          <tr><td>Total Appointments</td><td class="text-right">${data.summary.totalAppointments}</td></tr>
          <tr><td>Completed</td><td class="text-right">${data.summary.completedAppointments}</td></tr>
          <tr><td>Pending</td><td class="text-right">${data.summary.pendingAppointments}</td></tr>
          <tr><td>Cancelled</td><td class="text-right">${data.summary.cancelledAppointments}</td></tr>
          <tr><td>No-shows</td><td class="text-right">${data.summary.noShowAppointments}</td></tr>
          <tr><td>Walk-ins</td><td class="text-right">${data.summary.walkInAppointments}</td></tr>
          <tr><td>New Patients</td><td class="text-right">${data.summary.newPatients}</td></tr>
          <tr><td>Returning Patients</td><td class="text-right">${data.summary.returningPatients}</td></tr>
          <tr><td>Completion Rate</td><td class="text-right">${(data.summary.completionRate * 100).toFixed(1)}%</td></tr>
          <tr><td>Cancellation Rate</td><td class="text-right">${(data.summary.cancellationRate * 100).toFixed(1)}%</td></tr>
          <tr><td>No-show Rate</td><td class="text-right">${(data.summary.noShowRate * 100).toFixed(1)}%</td></tr>
        </table>

        <h3>Revenue</h3>
        <table>
          <tr><th>Metric</th><th class="text-right">Amount</th></tr>
          <tr><td>Consultation Amount</td><td class="text-right">${formatCurrency(data.summary.totalConsultationAmount)}</td></tr>
          <tr><td>Registration Amount</td><td class="text-right">${formatCurrency(data.summary.totalRegistrationAmount)}</td></tr>
          <tr><td>Amount Collected</td><td class="text-right">${formatCurrency(data.summary.totalAmountCollected)}</td></tr>
          <tr><td>Pending Amount</td><td class="text-right">${formatCurrency(data.summary.pendingAmount)}</td></tr>
          <tr><td>Outstanding Invoices</td><td class="text-right">${data.summary.outstandingInvoices}</td></tr>
        </table>

        ${data.byStatus.length ? `
        <h3>By Status</h3>
        <table>
          <tr><th>Status</th><th class="text-right">Count</th><th class="text-right">Percentage</th></tr>
          ${data.byStatus.map(item => `<tr><td>${item.status.replace(/_/g, ' ')}</td><td class="text-right">${item.count}</td><td class="text-right">${item.percentage.toFixed(1)}%</td></tr>`).join('')}
        </table>` : ''}

        ${data.byType.length ? `
        <h3>By Type</h3>
        <table>
          <tr><th>Type</th><th class="text-right">Count</th><th class="text-right">Percentage</th></tr>
          ${data.byType.map(item => `<tr><td>${item.type.replace(/_/g, ' ')}</td><td class="text-right">${item.count}</td><td class="text-right">${item.percentage.toFixed(1)}%</td></tr>`).join('')}
        </table>` : ''}

        ${data.byDoctor.length ? `
        <h3>Doctor Performance</h3>
        <table>
          <tr><th>Doctor ID</th><th class="text-right">Appointments</th><th class="text-right">Completed</th><th class="text-right">Revenue</th></tr>
          ${data.byDoctor.map(doc => `<tr><td>${doc.doctorName ?? doc.doctorId}</td><td class="text-right">${doc.totalAppointments}</td><td class="text-right">${doc.completed}</td><td class="text-right">${formatCurrency(doc.revenue)}</td></tr>`).join('')}
        </table>` : ''}

        ${data.byHour.length ? `
        <h3>Hourly Distribution</h3>
        <table>
          <tr><th>Hour</th><th class="text-right">Appointments</th></tr>
          ${data.byHour.map(item => `<tr><td>${item.hour}:00</td><td class="text-right">${item.count}</td></tr>`).join('')}
        </table>` : ''}

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
          <h1 className="text-2xl font-semibold tracking-tight">Daily OPD Summary</h1>
          <p className="text-sm text-muted-foreground">
            Overview of today's outpatient department activity
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={exportToExcel}
            disabled={!data || data.summary.totalAppointments === 0}
          >
            <Download className="h-4 w-4 mr-1" />
            Excel
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={exportToPdf}
            disabled={!data || data.summary.totalAppointments === 0}
          >
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
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 13 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
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
      {!query.isLoading && !query.isError && data && data.summary.totalAppointments === 0 && (
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
      {!query.isLoading && !query.isError && data && data.summary.totalAppointments > 0 && (
        <>
          {/* ─── KPI Cards: Appointments ────────────────────── */}
          <div>
            <h2 className="text-lg font-semibold mb-3">Appointments</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <KpiCard
                title="Total Appointments"
                value={data.summary.totalAppointments}
                subtitle={`Completion: ${(data.summary.completionRate * 100).toFixed(1)}%`}
              />
              <KpiCard
                title="Completed"
                value={data.summary.completedAppointments}
                variant="success"
                subtitle={`${(data.summary.completionRate * 100).toFixed(1)}% of total`}
              />
              <KpiCard
                title="Pending"
                value={data.summary.pendingAppointments}
                variant="warning"
              />
              <KpiCard
                title="Cancelled"
                value={data.summary.cancelledAppointments}
                variant="danger"
                subtitle={`${(data.summary.cancellationRate * 100).toFixed(1)}% rate`}
              />
            </div>
          </div>

          {/* ─── KPI Cards: Additional Metrics ─────────────── */}
          <div>
            <h2 className="text-lg font-semibold mb-3">More Metrics</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <KpiCard
                title="No-shows"
                value={data.summary.noShowAppointments}
                variant="danger"
                subtitle={`${(data.summary.noShowRate * 100).toFixed(1)}% rate`}
              />
              <KpiCard
                title="Walk-ins"
                value={data.summary.walkInAppointments}
              />
              <KpiCard
                title="New Patients"
                value={data.summary.newPatients}
                variant="success"
              />
              <KpiCard
                title="Returning Patients"
                value={data.summary.returningPatients}
              />
            </div>
          </div>

          {/* ─── KPI Cards: Revenue ────────────────────────── */}
          <div>
            <h2 className="text-lg font-semibold mb-3">Revenue</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <KpiCard
                title="Consultation Amount"
                value={data.summary.totalConsultationAmount}
                isCurrency
              />
              <KpiCard
                title="Registration Amount"
                value={data.summary.totalRegistrationAmount}
                isCurrency
              />
              <KpiCard
                title="Amount Collected"
                value={data.summary.totalAmountCollected}
                isCurrency
                variant="success"
              />
              <KpiCard
                title="Pending Amount"
                value={data.summary.pendingAmount}
                isCurrency
                variant="warning"
              />
            </div>
          </div>

          {/* ─── Outstanding Invoices ────────────────────────── */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <KpiCard
              title="Outstanding Invoices"
              value={data.summary.outstandingInvoices}
              variant="warning"
            />
          </div>

          {/* ─── Charts Row ──────────────────────────────────── */}
          <div className="grid gap-4 lg:grid-cols-2">
            {/* ─── By Status ─────────────────────────────────── */}
            <Card>
              <CardHeader>
                <CardTitle>By Status</CardTitle>
              </CardHeader>
              <CardContent>
                {data.byStatus.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No data</p>
                ) : (
                  <div className="space-y-1">
                    {data.byStatus.map((item) => (
                      <StatusBadge
                        key={item.status}
                        status={item.status}
                        count={item.count}
                        percentage={item.percentage}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* ─── By Type ────────────────────────────────────── */}
            <Card>
              <CardHeader>
                <CardTitle>By Type</CardTitle>
              </CardHeader>
              <CardContent>
                {data.byType.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No data</p>
                ) : (
                  <div className="space-y-1">
                    {data.byType.map((item) => (
                      <div key={item.type} className="flex items-center justify-between py-2">
                        <span className="text-sm">{item.type.replace(/_/g, " ")}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">{item.count}</span>
                          <span className="text-sm font-medium tabular-nums">{item.percentage}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* ─── Hourly Distribution Chart ────────────────────── */}
          {data.byHour.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Hourly Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.byHour} margin={{ left: 20, right: 20 }}>
                      <CartesianGrid stroke="var(--border)" strokeDasharray="0" horizontal={false} />
                      <XAxis
                        dataKey="hour"
                        tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                        tickFormatter={(h) => `${h}:00`}
                      />
                      <YAxis
                        tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                        allowDecimals={false}
                      />
                      <Tooltip
                        contentStyle={{
                          background: "var(--popover)",
                          border: "1px solid var(--border)",
                          borderRadius: 6,
                          fontSize: 12,
                        }}
                        formatter={(value) => [Number(value), "Appointments"]}
                        labelFormatter={(h) => `${h}:00`}
                      />
                      <Bar dataKey="count" fill="var(--viz-sequential)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {/* ─── Doctor Performance Table ─────────────────────── */}
          {data.byDoctor.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Doctor Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="py-3 px-4 text-left text-sm font-medium text-muted-foreground">Doctor ID</th>
                        <th className="py-3 px-4 text-right text-sm font-medium text-muted-foreground">Appointments</th>
                        <th className="py-3 px-4 text-right text-sm font-medium text-muted-foreground">Completed</th>
                        <th className="py-3 px-4 text-right text-sm font-medium text-muted-foreground">Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.byDoctor.map((doc) => (
                        <tr key={doc.doctorId} className="border-b last:border-0">
                          <td className="py-3 px-4 text-sm">{doc.doctorName ?? doc.doctorId}</td>
                          <td className="py-3 px-4 text-sm text-right tabular-nums">{doc.totalAppointments}</td>
                          <td className="py-3 px-4 text-sm text-right tabular-nums">{doc.completed}</td>
                          <td className="py-3 px-4 text-sm text-right tabular-nums font-medium">
                            {formatCurrency(doc.revenue)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
