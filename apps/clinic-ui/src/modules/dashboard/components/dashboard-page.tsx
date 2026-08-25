import { Link, Navigate } from "@tanstack/react-router";
import { CalendarClock, ClipboardList, Clock, ListOrdered, Users, Stethoscope, CheckCircle, XCircle, Hourglass, Send } from "lucide-react";
import { useAppSelector } from "@/store/hooks";
import { getHomeRoute } from "@/lib/roles";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboardStats } from "../data/hooks";

const STATUS_STYLES: Record<string, { icon: typeof Clock; color: string; badge: string }> = {
  SCHEDULED: { icon: Clock, color: "text-blue-500", badge: "bg-blue-50 text-blue-700 border-blue-200" },
  CONFIRMED: { icon: CheckCircle, color: "text-green-500", badge: "bg-green-50 text-green-700 border-green-200" },
  CHECKED_IN: { icon: CheckCircle, color: "text-emerald-500", badge: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  IN_PROGRESS: { icon: Hourglass, color: "text-amber-500", badge: "bg-amber-50 text-amber-700 border-amber-200" },
  COMPLETED: { icon: CheckCircle, color: "text-green-600", badge: "bg-green-50 text-green-700 border-green-200" },
  CANCELLED: { icon: XCircle, color: "text-red-500", badge: "bg-red-50 text-red-700 border-red-200" },
  WAITING: { icon: Clock, color: "text-blue-500", badge: "bg-blue-50 text-blue-700 border-blue-200" },
  SEND_IN: { icon: Send, color: "text-violet-500", badge: "bg-violet-50 text-violet-700 border-violet-200" },
};

function StatusBadge({ status }: { status: string }) {
  const style = STATUS_STYLES[status] ?? { icon: Clock, color: "text-gray-500", badge: "bg-gray-50 text-gray-700 border-gray-200" };
  const Icon = style.icon;
  return (
    <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-medium ${style.badge}`}>
      <Icon className="size-3" />
      {status.replace(/_/g, " ")}
    </span>
  );
}

export function DashboardPage() {
  const user = useAppSelector((state) => state.auth.user);
  const statsQuery = useDashboardStats();

  const home = getHomeRoute(user?.roleName);
  if (home !== "/dashboard") {
    return <Navigate to={home} replace />;
  }

  const stats = statsQuery.data;
  const loading = statsQuery.isLoading;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Welcome{user?.firstName ? `, ${user.firstName}` : ""}
        </h1>
        <p className="text-sm text-muted-foreground">
          Here&apos;s what&apos;s happening at the clinic today.
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Today&apos;s Appointments</CardTitle>
            <CalendarClock className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-16" /> : <p className="text-2xl font-semibold tabular-nums">{stats?.todayAppointments ?? 0}</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Patients in Queue</CardTitle>
            <ListOrdered className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-16" /> : <p className="text-2xl font-semibold tabular-nums">{stats?.patientsInQueue ?? 0}</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Patients</CardTitle>
            <Users className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-16" /> : <p className="text-2xl font-semibold tabular-nums">{stats?.registeredPatients ?? 0}</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Prescriptions</CardTitle>
            <ClipboardList className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-16" /> : <p className="text-2xl font-semibold tabular-nums">{stats?.pendingPrescriptions ?? 0}</p>}
          </CardContent>
        </Card>
      </div>

      {/* Two-column: Latest Appointments + Latest Queue */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Latest Appointments */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarClock className="size-4" />
              Latest Appointments
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="space-y-3 p-4">
                {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
              </div>
            ) : !stats?.latestAppointments?.length ? (
              <p className="px-4 py-8 text-center text-sm text-muted-foreground">No appointments yet.</p>
            ) : (
              <div className="divide-y">
                {stats.latestAppointments.map((appt) => (
                  <Link key={appt.id} to="/appointments" className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-muted/50 transition-colors cursor-pointer">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">
                        {appt.patient.firstName} {appt.patient.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Stethoscope className="size-3" />
                        {appt.doctor.specialization ?? "General"}
                        {appt.type && <span className="ml-1">• {appt.type}</span>}
                      </p>
                    </div>
                    <StatusBadge status={appt.status} />
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Latest Queue */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <ListOrdered className="size-4" />
              Today&apos;s Queue
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="space-y-3 p-4">
                {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
              </div>
            ) : !stats?.latestQueue?.length ? (
              <p className="px-4 py-8 text-center text-sm text-muted-foreground">No patients in queue today.</p>
            ) : (
              <div className="divide-y">
                {stats.latestQueue.map((entry) => (
                  <Link key={entry.id} to="/appointments" className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-muted/50 transition-colors cursor-pointer">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        {entry.tokenNumber != null && (
                          <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                            {entry.tokenNumber}
                          </span>
                        )}
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">
                            {entry.patient.firstName} {entry.patient.lastName}
                          </p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Stethoscope className="size-3" />
                            {entry.doctor.specialization ?? "General"}
                          </p>
                        </div>
                      </div>
                    </div>
                    <StatusBadge status={entry.status} />
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
