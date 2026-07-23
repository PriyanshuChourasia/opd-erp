import { useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { PieLabelRenderProps } from "recharts";;
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useRevenueByCategory } from "../data/hooks";
import { formatCurrency } from "../data/utils";

const CATEGORY_COLORS = [
  "var(--viz-sequential)",
  "var(--viz-status-warning)",
  "var(--viz-status-serious)",
  "var(--viz-status-critical)",
  "var(--viz-status-good)",
  "var(--muted-foreground)",
];

export function RevenueByCategoryPage() {
  const today = new Date();
  const firstOfMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-01`;
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const endDate = tomorrow.toISOString().slice(0, 10);

  const [from, setFrom] = useState(firstOfMonth);
  const [to, setTo] = useState(endDate);
  const query = useRevenueByCategory(from, to);

  const data = query.data;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Revenue by Category</h1>
          <p className="text-sm text-muted-foreground">Breakdown of revenue by item type and payment method</p>
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
        <Skeleton className="h-64 w-full" />
      ) : !data ? (
        <p className="text-sm text-muted-foreground">No data for this range</p>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Total Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold tabular-nums">{formatCurrency(data.totalRevenue)}</p>
            </CardContent>
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>By Category</CardTitle>
              </CardHeader>
              <CardContent>
                {data.byCategory.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No data for this range</p>
                ) : (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data.byCategory} layout="vertical" margin={{ left: 80, right: 20 }}>
                        <CartesianGrid stroke="var(--border)" strokeDasharray="0" horizontal={false} />
                        <XAxis type="number" tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} tickFormatter={formatCurrency} />
                        <YAxis type="category" dataKey="itemType" tick={{ fill: "var(--foreground)", fontSize: 11 }} width={100} />
                        <Tooltip
                          contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 6, fontSize: 12 }}
                        />
                        <Bar dataKey="amount" fill="var(--viz-sequential)" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>By Payment Method</CardTitle>
              </CardHeader>
              <CardContent>
                {data.byPaymentMethod.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No data for this range</p>
                ) : (
                  <div className="flex h-64 items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={data.byPaymentMethod}
                          dataKey="amount"
                          nameKey="paymentMethod"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          label={(entry: PieLabelRenderProps) => `${(entry.payload as Record<string, unknown>).paymentMethod}: ${formatCurrency((entry.payload as Record<string, unknown>).amount as number)}`}
                        >
                          {data.byPaymentMethod.map((_, idx) => (
                            <Cell key={idx} fill={CATEGORY_COLORS[idx % CATEGORY_COLORS.length]} />
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
          </div>
        </>
      )}
    </div>
  );
}
