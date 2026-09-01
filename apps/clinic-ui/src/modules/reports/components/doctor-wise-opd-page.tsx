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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useDoctorWiseOpdReport } from "../data/hooks";
import { formatCurrency } from "../data/utils";

export function DoctorWiseOpdPage() {
  const { dateRange } = useDateRangeSync();
  const today = new Date();
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [from, setFrom] = useState(dateRange.from ?? thirtyDaysAgo.toISOString().slice(0, 10));
  const [to, setTo] = useState(dateRange.to ?? tomorrow.toISOString().slice(0, 10));
  const query = useDoctorWiseOpdReport(from, to);

  const data = query.data?.data;
  const meta = query.data?.meta;

  return (
    <div className="flex flex-col gap-6">
      {/* ─── Header ──────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Doctor-wise OPD Report</h1>
          <p className="text-sm text-muted-foreground">
            Detailed appointment and revenue statistics by doctor
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-muted-foreground">From:</label>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="rounded-md border border-input bg-background px-3 py-1.5 text-sm"
          />
          <label className="text-sm text-muted-foreground">To:</label>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="rounded-md border border-input bg-background px-3 py-1.5 text-sm"
          />
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
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
          <Skeleton className="h-64 w-full" />
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
      {!query.isLoading && !query.isError && data && data.doctors.length === 0 && (
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
      {!query.isLoading && !query.isError && data && data.doctors.length > 0 && (
        <>
          {/* ─── Summary Cards ────────────────────────────────── */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Doctors</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold tabular-nums">{data.summary.totalDoctors}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {data.summary.activeDoctors} active
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Appointments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold tabular-nums">{data.summary.totalAppointments}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {data.summary.avgAppointmentsPerDoctor} avg/doctor
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold tabular-nums">{formatCurrency(data.summary.totalRevenue)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Patients</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold tabular-nums">{data.summary.totalPatients}</div>
              </CardContent>
            </Card>
          </div>

          {/* ─── Revenue Chart ─────────────────────────────────── */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue by Doctor</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={data.doctors.filter(d => d.consultationRevenue > 0)}
                    layout="vertical"
                    margin={{ left: 120, right: 20 }}
                  >
                    <CartesianGrid stroke="var(--border)" strokeDasharray="0" horizontal={false} />
                    <XAxis
                      type="number"
                      tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                      tickFormatter={formatCurrency}
                    />
                    <YAxis
                      type="category"
                      dataKey="specialization"
                      tick={{ fill: "var(--foreground)", fontSize: 11 }}
                      width={110}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "var(--popover)",
                        border: "1px solid var(--border)",
                        borderRadius: 6,
                        fontSize: 12,
                      }}
                      formatter={(value) => [formatCurrency(Number(value)), "Revenue"]}
                    />
                    <Bar dataKey="consultationRevenue" fill="var(--viz-sequential)" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* ─── Doctor Details Table ──────────────────────────── */}
          <Card>
            <CardHeader>
              <CardTitle>Doctor Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Doctor</TableHead>
                      <TableHead className="text-right">Total Appts</TableHead>
                      <TableHead className="text-right">Completed</TableHead>
                      <TableHead className="text-right">Cancelled</TableHead>
                      <TableHead className="text-right">No-show</TableHead>
                      <TableHead className="text-right">New Patients</TableHead>
                      <TableHead className="text-right">Follow-ups</TableHead>
                      <TableHead className="text-right">Revenue</TableHead>
                      <TableHead className="text-right">Avg Patients/Day</TableHead>
                      <TableHead className="text-right">Avg Consultation</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.doctors.map((doc) => (
                      <TableRow key={doc.doctorId}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{doc.specialization}</p>
                            <p className="text-xs text-muted-foreground">{doc.registrationNo}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-right tabular-nums">{doc.totalAppointments}</TableCell>
                        <TableCell className="text-right tabular-nums">{doc.completed}</TableCell>
                        <TableCell className="text-right tabular-nums">{doc.cancelled}</TableCell>
                        <TableCell className="text-right tabular-nums">{doc.noShow}</TableCell>
                        <TableCell className="text-right tabular-nums">{doc.newPatients}</TableCell>
                        <TableCell className="text-right tabular-nums">{doc.followUpPatients}</TableCell>
                        <TableCell className="text-right tabular-nums font-medium">
                          {formatCurrency(doc.consultationRevenue)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">{doc.avgPatientsPerDay}</TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatCurrency(doc.avgConsultationAmount)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
