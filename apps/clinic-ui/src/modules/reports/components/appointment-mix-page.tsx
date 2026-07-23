import { useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAppointmentMix } from "../data/hooks";

const COLORS = ["var(--viz-sequential)", "var(--viz-seq-2)", "var(--viz-seq-3)", "var(--viz-status-warning)", "var(--viz-status-serious)", "var(--muted-foreground)"];

export function AppointmentMixPage() {
  const today = new Date();
  const ninetyDaysAgo = new Date(today);
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [from, setFrom] = useState(ninetyDaysAgo.toISOString().slice(0, 10));
  const [to, setTo] = useState(tomorrow.toISOString().slice(0, 10));
  const query = useAppointmentMix(from, to);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Appointment Mix</h1>
          <p className="text-sm text-muted-foreground">Appointment type, status distribution, and cancellation analysis</p>
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
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      ) : !query.data ? (
        <p className="text-sm text-muted-foreground">No data for this range</p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>By Type</CardTitle>
            </CardHeader>
            <CardContent>
              {query.data.byType.length === 0 ? (
                <p className="text-sm text-muted-foreground">No appointments in this range</p>
              ) : (
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={query.data.byType} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                      <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="0" />
                      <XAxis dataKey="type" tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} />
                      <YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} />
                      <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 6, fontSize: 12 }} />
                      <Bar dataKey="count" fill="var(--viz-sequential)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>By Status</CardTitle>
            </CardHeader>
            <CardContent>
              {query.data.byStatus.length === 0 ? (
                <p className="text-sm text-muted-foreground">No appointments in this range</p>
              ) : (
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={query.data.byStatus} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                      <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="0" />
                      <XAxis dataKey="status" tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} />
                      <YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} />
                      <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 6, fontSize: 12 }} />
                      <Bar dataKey="count" fill="var(--viz-seq-2)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Cancellation Reasons</CardTitle>
            </CardHeader>
            <CardContent>
              {query.data.cancellationReasons.length === 0 ? (
                <p className="text-sm text-muted-foreground">No cancellations in this range</p>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {query.data.cancellationReasons.map((r) => (
                    <div key={r.reason} className="flex items-center justify-between rounded-lg border p-3">
                      <span className="text-sm text-foreground/80">{r.reason}</span>
                      <span className="text-sm font-semibold tabular-nums">{r.count}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
