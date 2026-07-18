import { Navigate } from "@tanstack/react-router";
import { CalendarClock, ClipboardList, ListOrdered, Users } from "lucide-react";
import { useAppSelector } from "@/store/hooks";
import { getHomeRoute } from "@/lib/roles";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboardCharts, useDashboardStats } from "../data/hooks";
import { BarList } from "./bar-list";
import { BillStatusPanel } from "./bill-status-panel";
import { RecentActivityList } from "./recent-activity-list";
import { RevenueTrendChart } from "./revenue-trend-chart";

const statTiles = [
  { key: "todayAppointments", label: "Today's appointments", icon: CalendarClock },
  { key: "patientsInQueue", label: "Patients in queue", icon: ListOrdered },
  { key: "registeredPatients", label: "Registered patients", icon: Users },
  { key: "pendingPrescriptions", label: "Pending prescriptions", icon: ClipboardList },
] as const;

export function DashboardPage() {
  const user = useAppSelector((state) => state.auth.user);
  const statsQuery = useDashboardStats();
  const chartsQuery = useDashboardCharts();

  const home = getHomeRoute(user?.roleName);
  if (home !== "/dashboard") {
    return <Navigate to={home} replace />;
  }

  const stats = statsQuery.data;
  const charts = chartsQuery.data;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Welcome{user?.firstName ? `, ${user.firstName}` : ""}
        </h1>
        <p className="text-sm text-muted-foreground">
          Here&apos;s what&apos;s happening at the clinic today.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statTiles.map(({ key, label, icon: Icon }) => (
          <Card key={key}>
            <CardHeader className="flex flex-row items-center justify-between gap-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
              <Icon className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {statsQuery.isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <p className="text-2xl font-semibold tabular-nums">{stats?.[key] ?? "—"}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Revenue trend</CardTitle>
          </CardHeader>
          <CardContent>
            {chartsQuery.isLoading ? (
              <Skeleton className="h-48 w-full" />
            ) : (
              <RevenueTrendChart data={charts?.revenueTrend ?? []} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Billing status</CardTitle>
          </CardHeader>
          <CardContent>
            {chartsQuery.isLoading ? (
              <Skeleton className="h-40 w-full" />
            ) : (
              <BillStatusPanel rows={charts?.billStatusBreakdown ?? []} />
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Appointments by status</CardTitle>
          </CardHeader>
          <CardContent>
            {chartsQuery.isLoading ? (
              <Skeleton className="h-40 w-full" />
            ) : (
              <BarList
                rows={(charts?.appointmentStatusBreakdown ?? []).map((s) => ({
                  label: s.status.replace(/_/g, " "),
                  value: s.count,
                }))}
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Doctor load</CardTitle>
          </CardHeader>
          <CardContent>
            {chartsQuery.isLoading ? (
              <Skeleton className="h-40 w-full" />
            ) : (
              <BarList rows={(charts?.doctorLoad ?? []).map((d) => ({ label: d.doctor, value: d.count }))} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top medicines dispensed</CardTitle>
          </CardHeader>
          <CardContent>
            {chartsQuery.isLoading ? (
              <Skeleton className="h-40 w-full" />
            ) : (
              <BarList
                rows={(charts?.topMedicines ?? []).map((m) => ({ label: m.medicine, value: m.quantity }))}
              />
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent activity</CardTitle>
        </CardHeader>
        <CardContent>
          {chartsQuery.isLoading ? (
            <Skeleton className="h-32 w-full" />
          ) : (
            <RecentActivityList activity={charts?.recentActivity ?? []} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
