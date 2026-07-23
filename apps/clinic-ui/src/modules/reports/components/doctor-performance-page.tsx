import { useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
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
import { useDoctorPerformance } from "../data/hooks";
import { formatCurrency } from "../data/utils";

export function DoctorPerformancePage() {
  const today = new Date();
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [from, setFrom] = useState(thirtyDaysAgo.toISOString().slice(0, 10));
  const [to, setTo] = useState(tomorrow.toISOString().slice(0, 10));
  const query = useDoctorPerformance(from, to);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Doctor Performance</h1>
          <p className="text-sm text-muted-foreground">Appointment stats and revenue by doctor</p>
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

      {query.isLoading ? (
        <>
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-64 w-full" />
        </>
      ) : !query.data || query.data.length === 0 ? (
        <p className="text-sm text-muted-foreground">No data for this range</p>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Revenue by Doctor</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={query.data} layout="vertical" margin={{ left: 120, right: 20 }}>
                    <CartesianGrid stroke="var(--border)" strokeDasharray="0" horizontal={false} />
                    <XAxis type="number" tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} tickFormatter={formatCurrency} />
                    <YAxis type="category" dataKey="specialization" tick={{ fill: "var(--foreground)", fontSize: 11 }} width={110} />                        <Tooltip
                          contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 6, fontSize: 12 }}
                        />
                    <Bar dataKey="revenue" fill="var(--viz-sequential)" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Doctor details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Doctor</TableHead>
                      <TableHead className="text-right">Total Appts</TableHead>
                      <TableHead className="text-right">Completed</TableHead>
                      <TableHead className="text-right">No-show</TableHead>
                      <TableHead className="text-right">No-show rate</TableHead>
                      <TableHead className="text-right">Revenue</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {query.data.map((doc) => (
                      <TableRow key={doc.doctorId}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{doc.specialization}</p>
                            <p className="text-xs text-muted-foreground">{doc.registrationNo}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-right tabular-nums">{doc.totalAppointments}</TableCell>
                        <TableCell className="text-right tabular-nums">{doc.completedCount}</TableCell>
                        <TableCell className="text-right tabular-nums">{doc.noShowCount}</TableCell>
                        <TableCell className="text-right tabular-nums">
                          <Badge
                            variant="outline"
                            className={doc.noShowRate > 0.15 ? "border-transparent bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" : "border-transparent bg-muted"}
                          >
                            {(doc.noShowRate * 100).toFixed(1)}%
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right tabular-nums font-medium">{formatCurrency(doc.revenue)}</TableCell>
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
