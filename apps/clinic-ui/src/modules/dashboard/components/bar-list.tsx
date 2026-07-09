interface BarListRow {
  label: string;
  value: number;
}

interface BarListProps {
  rows: BarListRow[];
  valueFormatter?: (value: number) => string;
  emptyLabel?: string;
}

/**
 * Ranked single-series bar list. Nominal categories (doctor, medicine, status)
 * share one hue — the axis labels already carry identity, so no legend/second
 * color is needed. Values are always shown as direct labels (never hover-only).
 */
export function BarList({ rows, valueFormatter = (v) => v.toLocaleString(), emptyLabel = "No data yet" }: BarListProps) {
  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyLabel}</p>;
  }

  const max = Math.max(...rows.map((r) => r.value), 1);

  return (
    <div className="flex flex-col gap-3">
      {rows.map((row) => (
        <div key={row.label} className="flex items-center gap-3">
          <span className="w-32 shrink-0 truncate text-sm text-foreground/80" title={row.label}>
            {row.label}
          </span>
          <div className="relative h-5 flex-1 rounded-sm bg-muted">
            <div
              className="h-5 rounded-sm"
              style={{
                width: `${Math.max((row.value / max) * 100, 3)}%`,
                backgroundColor: "var(--viz-series)",
              }}
            />
          </div>
          <span className="w-12 shrink-0 text-right text-sm font-medium tabular-nums text-foreground">
            {valueFormatter(row.value)}
          </span>
        </div>
      ))}
    </div>
  );
}
