import { useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { PieLabelRenderProps } from "recharts";
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
import { usePrescriptionFulfillment } from "../data/hooks";
import { formatStatus } from "../data/utils";

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "var(--viz-status-warning)",
  DISPENSED: "var(--viz-status-good)",
  CANCELLED: "var(--viz-status-critical)",
};

export function PrescriptionFulfillmentPage() {
  const today = new Date();
  const ninetyDaysAgo = new Date(today);
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [from, setFrom] = useState(ninetyDaysAgo.toISOString().slice(0, 10));
  const [to, setTo] = useState(tomorrow.toISOString().slice(0, 10));
  const query = usePrescriptionFulfillment(from, to);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Prescription Fulfillment</h1>
          <p className="text-sm text-muted-foreground">Track prescription statuses and find unfulfilled orders</p>
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
      ) : !query.data ? (
        <p className="text-sm text-muted-foreground">No data for this range</p>
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Status breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                {query.data.statusBreakdown.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No prescriptions in this range</p>
                ) : (
                  <div className="flex h-56 items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={query.data.statusBreakdown}
                          dataKey="count"
                          nameKey="status"
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          label={(entry: PieLabelRenderProps) => `${formatStatus((entry.payload as Record<string, unknown>).status as string)}: ${(entry.payload as Record<string, unknown>).count}`}
                        >
                          {query.data.statusBreakdown.map((entry) => (
                            <Cell key={entry.status} fill={STATUS_COLORS[entry.status] ?? "var(--muted-foreground)"} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 6, fontSize: 12 }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Summary</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                {query.data.statusBreakdown.map((s) => (
                  <div key={s.status} className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-sm">
                      <span
                        className="size-3 rounded-full"
                        style={{ backgroundColor: STATUS_COLORS[s.status] ?? "var(--muted-foreground)" }}
                      />
                      {formatStatus(s.status)}
                    </span>
                    <span className="text-sm font-semibold tabular-nums">{s.count}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Unfulfilled prescriptions (older than 3 days)</CardTitle>
            </CardHeader>
            <CardContent>
              {query.data.unfulfilled.length === 0 ? (
                <p className="text-sm text-muted-foreground">No unfulfilled prescriptions — all caught up!</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Prescription ID</TableHead>
                        <TableHead>Patient</TableHead>
                        <TableHead>Doctor ID</TableHead>
                        <TableHead className="text-right">Days pending</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {query.data.unfulfilled.map((rx) => (
                        <TableRow key={rx.prescriptionId}>
                          <TableCell className="font-mono text-xs">{rx.prescriptionId.slice(0, 8)}...</TableCell>
                          <TableCell>{rx.patientName}</TableCell>
                          <TableCell className="font-mono text-xs">{rx.doctorId.slice(0, 8)}...</TableCell>
                          <TableCell className="text-right tabular-nums">
                            <Badge variant="outline" className={rx.daysPending > 7 ? "border-transparent bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" : ""}>
                              {rx.daysPending}d
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
