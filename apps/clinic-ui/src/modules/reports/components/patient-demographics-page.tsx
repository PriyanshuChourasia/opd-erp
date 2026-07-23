import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { PieLabelRenderProps } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { usePatientDemographics } from "../data/hooks";

const COLORS = ["var(--viz-sequential)", "var(--viz-seq-2)", "var(--viz-seq-3)", "var(--muted-foreground)"];

export function PatientDemographicsPage() {
  const query = usePatientDemographics();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Patient Demographics</h1>
        <p className="text-sm text-muted-foreground">Patient population breakdown and new vs. returning trends</p>
      </div>

      {query.isLoading ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      ) : !query.data ? (
        <p className="text-sm text-muted-foreground">No data</p>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>New vs. Returning Patients (12 months)</CardTitle>
            </CardHeader>
            <CardContent>
              {query.data.newVsReturningTrend.length === 0 ? (
                <p className="text-sm text-muted-foreground">No data for this period</p>
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={query.data.newVsReturningTrend} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                      <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="0" />
                      <XAxis dataKey="month" tickLine={false} axisLine={{ stroke: "var(--border)" }} tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} />
                      <YAxis tickLine={false} axisLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} />
                      <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 6, fontSize: 12 }} />
                      <Area type="monotone" dataKey="newCount" stroke="var(--viz-sequential)" fill="var(--viz-sequential)" fillOpacity={0.1} strokeWidth={2} name="New patients" />
                      <Area type="monotone" dataKey="followUpCount" stroke="var(--viz-status-warning)" fill="var(--viz-status-warning)" fillOpacity={0.1} strokeWidth={2} name="Returning" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-4 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>By Gender</CardTitle>
              </CardHeader>
              <CardContent>
                {query.data.byGender.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No data</p>
                ) : (
                  <div className="flex h-40 items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={query.data.byGender} dataKey="count" nameKey="gender" cx="50%" cy="50%" outerRadius={60}                          label={(entry: PieLabelRenderProps) => `${(entry.payload as Record<string, unknown>).gender}: ${(entry.payload as Record<string, unknown>).count}`}>
                          {query.data.byGender.map((_, idx) => (
                            <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>By Blood Group</CardTitle>
              </CardHeader>
              <CardContent>
                {query.data.byBloodGroup.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No data</p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {query.data.byBloodGroup.map((bg) => (
                      <div key={bg.bloodGroup} className="flex items-center justify-between">
                        <span className="text-sm">{bg.bloodGroup}</span>
                        <span className="text-sm font-semibold tabular-nums">{bg.count}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>By Age Group</CardTitle>
              </CardHeader>
              <CardContent>
                {query.data.byAgeGroup.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No data</p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {query.data.byAgeGroup.map((ag) => (
                      <div key={ag.ageGroup} className="flex items-center justify-between">
                        <span className="text-sm">{ag.ageGroup} years</span>
                        <span className="text-sm font-semibold tabular-nums">{ag.count}</span>
                      </div>
                    ))}
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
