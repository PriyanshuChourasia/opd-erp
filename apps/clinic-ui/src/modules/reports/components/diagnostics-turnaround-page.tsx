import { useState } from "react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useDiagnosticsTurnaround } from "../data/hooks";

export function DiagnosticsTurnaroundPage() {
  const today = new Date();
  const ninetyDaysAgo = new Date(today);
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [from, setFrom] = useState(ninetyDaysAgo.toISOString().slice(0, 10));
  const [to, setTo] = useState(tomorrow.toISOString().slice(0, 10));
  const query = useDiagnosticsTurnaround(from, to);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Diagnostics Turnaround</h1>
          <p className="text-sm text-muted-foreground">Average completion time and backlog by order type</p>
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
        <div className="grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : !query.data ? (
        <p className="text-sm text-muted-foreground">No data for this range</p>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Average turnaround (hours) by type</CardTitle>
            </CardHeader>
            <CardContent>
              {query.data.avgTurnaroundByType.length === 0 ? (
                <p className="text-sm text-muted-foreground">No completed orders in this range</p>
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={query.data.avgTurnaroundByType} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                      <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="0" />
                      <XAxis dataKey="category" tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} />
                      <YAxis
                        tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                        tickFormatter={(v) => `${v}h`}
                      />                        <Tooltip
                          contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 6, fontSize: 12 }}
                        />
                      <Legend />
                      <Bar dataKey="avgHours" fill="var(--viz-sequential)" radius={[4, 4, 0, 0]} name="Average hours" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Status breakdown by type</CardTitle>
            </CardHeader>
            <CardContent>
              {query.data.statusBreakdown.length === 0 ? (
                <p className="text-sm text-muted-foreground">No orders in this range</p>
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={query.data.statusBreakdown} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                      <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="0" />
                      <XAxis
                        dataKey="status"
                        tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                      />
                      <YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} />
                      <Tooltip
                        contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 6, fontSize: 12 }}
                      />
                      <Legend />
                      <Bar dataKey="count" fill="var(--viz-sequential)" radius={[4, 4, 0, 0]} name="Count" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
