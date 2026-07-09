import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import type { RevenuePoint } from "../data/interface";

function formatDayLabel(dateStr: string) {
  const d = new Date(`${dateStr}T00:00:00`);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function formatCurrency(value: number) {
  return `₹${value.toLocaleString()}`;
}

function RevenueTooltip({ active, payload }: { active?: boolean; payload?: { payload: RevenuePoint }[] }) {
  if (!active || !payload?.length) return null;
  const point = payload[0]?.payload;
  if (!point) return null;
  return (
    <div className="rounded-md border border-border bg-popover px-3 py-2 text-xs shadow-md">
      <p className="font-semibold text-popover-foreground">{formatCurrency(point.revenue)}</p>
      <p className="text-muted-foreground">{formatDayLabel(point.date)}</p>
    </div>
  );
}

export function RevenueTrendChart({ data }: { data: RevenuePoint[] }) {
  const total = data.reduce((sum, d) => sum + d.revenue, 0);

  return (
    <div>
      <p className="mb-1 text-2xl font-semibold tabular-nums">{formatCurrency(total)}</p>
      <p className="mb-4 text-xs text-muted-foreground">Total collected, last 14 days</p>
      <div className="h-48 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="0" />
            <XAxis
              dataKey="date"
              tickFormatter={formatDayLabel}
              tickLine={false}
              axisLine={{ stroke: "var(--border)" }}
              interval={2}
              tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
            />
            <Tooltip content={<RevenueTooltip />} cursor={{ stroke: "var(--border)", strokeWidth: 1 }} />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="var(--viz-sequential)"
              strokeWidth={2}
              fill="var(--viz-sequential)"
              fillOpacity={0.1}
              activeDot={{ r: 4, stroke: "var(--card)", strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
