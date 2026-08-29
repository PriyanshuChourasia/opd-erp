import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useTopMedicines } from "../data/hooks";

interface TopMedicinesPageProps {
  /** Optional initial limit for top medicines */
  limit?: number;
}

export function TopMedicinesPage({ limit = 10 }: TopMedicinesPageProps) {
  const today = new Date();
  const ninetyDaysAgo = new Date(today);
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [from, setFrom] = useState(ninetyDaysAgo.toISOString().slice(0, 10));
  const [to, setTo] = useState(tomorrow.toISOString().slice(0, 10));
  const query = useTopMedicines(from, to, limit);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Top Medicines</h1>
          <p className="text-sm text-muted-foreground">Most dispensed medicines by volume and revenue</p>
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
          <Skeleton className="h-80 w-full" />
          <Skeleton className="h-80 w-full" />
        </div>
      ) : !query.data ? (
        <p className="text-sm text-muted-foreground">No data for this range</p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>By Volume</CardTitle>
            </CardHeader>
            <CardContent>
              {query.data.byVolume.length === 0 ? (
                <p className="text-sm text-muted-foreground">No dispensing data in this range</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {(() => {
                    const max = Math.max(...query.data.byVolume.map((m) => m.quantity), 1);
                    return query.data.byVolume.map((med) => (
                      <div key={med.medicine} className="flex items-center gap-3">
                        <span className="w-40 shrink-0 truncate text-sm text-foreground/80" title={med.medicine}>
                          {med.medicine}
                        </span>
                        <div className="relative h-5 flex-1 rounded-sm bg-muted">
                          <div
                            className="h-5 rounded-sm"
                            style={{
                              width: `${Math.max((med.quantity / max) * 100, 3)}%`,
                              backgroundColor: "var(--viz-series)",
                            }}
                          />
                        </div>
                        <span className="w-12 shrink-0 text-right text-sm font-medium tabular-nums text-foreground">
                          {med.quantity}
                        </span>
                      </div>
                    ));
                  })()}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>By Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              {query.data.byRevenue.length === 0 ? (
                <p className="text-sm text-muted-foreground">No bill data in this range</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {(() => {
                    const max = Math.max(...query.data.byRevenue.map((m) => m.amount), 1);
                    return query.data.byRevenue.map((med) => (
                      <div key={med.medicine} className="flex items-center gap-3">
                        <span className="w-40 shrink-0 truncate text-sm text-foreground/80" title={med.medicine}>
                          {med.medicine}
                        </span>
                        <div className="relative h-5 flex-1 rounded-sm bg-muted">
                          <div
                            className="h-5 rounded-sm"
                            style={{
                              width: `${Math.max((med.amount / max) * 100, 3)}%`,
                              backgroundColor: "var(--viz-seq-2)",
                            }}
                          />
                        </div>
                        <span className="w-16 shrink-0 text-right text-sm font-medium tabular-nums text-foreground">
                          ₹{med.amount.toLocaleString()}
                        </span>
                      </div>
                    ));
                  })()}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
