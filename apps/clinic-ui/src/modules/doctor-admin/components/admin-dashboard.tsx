import { Link } from "@tanstack/react-router";
import {
  Activity,
  CalendarClock,
  ClipboardList,
  Clock,
  ListOrdered,
  Users,
} from "lucide-react";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useDashboardStats } from "../data/hooks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/* ─── Quick actions config ───────────────────────────────── */

const quickActions = [
  { to: "/patients", label: "Patients", icon: Users, color: "text-blue-600 bg-blue-50" },
  { to: "/prescriptions", label: "Prescriptions", icon: ClipboardList, color: "text-purple-600 bg-purple-50" },
];

/* ─── Main Component ─────────────────────────────────────── */

/**
 * Doctor-admin dashboard page.
 *
 * SRP: Only responsible for rendering the dashboard layout.
 * Data fetching is delegated to hooks. Child components handle their own concerns.
 */
export function AdminDashboard() {
  const user = useCurrentUser();
  const statsQuery = useDashboardStats();

  const stats = statsQuery.data;
  const loading = statsQuery.isLoading;

  return (
    <div className="flex flex-col gap-6">
      {/* ─── Hero Header ──────────────────────────────────── */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Welcome{user?.firstName ? `, Dr. ${user.firstName}` : ""}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Clinical operations and clinic management at your fingertips.
          </p>
        </div>
      </div>

      {/* ─── Stat Cards ───────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Today's Appointments"
          value={stats?.todayAppointments ?? 0}
          icon={CalendarClock}
          iconColor="text-blue-600"
          loading={loading}
        />
        <StatCard
          title="Patients in Queue"
          value={stats?.patientsInQueue ?? 0}
          icon={ListOrdered}
          iconColor="text-amber-600"
          loading={loading}
        />
        <StatCard
          title="Pending Prescriptions"
          value={stats?.pendingPrescriptions ?? 0}
          icon={ClipboardList}
          iconColor="text-purple-600"
          loading={loading}
        />
      </div>

      {/* ─── Quick Actions ────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Activity className="size-4" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {quickActions.map(({ to, label, icon: Icon, color }) => (
              <Link
                key={to}
                to={to}
                className="flex flex-col items-center gap-2 rounded-lg border p-3 text-center transition-colors hover:bg-muted/50"
              >
                <span className={`flex size-9 items-center justify-center rounded-lg ${color}`}>
                  <Icon className="size-4" />
                </span>
                <span className="text-[11px] font-medium text-muted-foreground leading-tight">{label}</span>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ─── Latest Appointments ──────────────────────────── */}
      {stats?.latestAppointments && stats.latestAppointments.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="size-4" />
              Latest Appointments
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {stats.latestAppointments.slice(0, 5).map((appt) => (
                <div key={appt.id} className="flex items-start gap-3 px-4 py-3">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-muted">
                    <CalendarClock className="size-3.5 text-muted-foreground" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      {appt.patient.firstName} {appt.patient.lastName} — {appt.status.replace(/_/g, " ")}
                    </p>
                    <p className="mt-0.5 text-[10px] text-muted-foreground/70">
                      {appt.doctor.specialization ?? "General"} · {appt.type}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/* ─── Stat Card ──────────────────────────────────────────── */

/**
 * Individual stat card — SRP: renders one metric.
 */
function StatCard({
  title,
  value,
  icon: Icon,
  iconColor,
  loading,
}: {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  loading: boolean;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
        <CardTitle className="text-xs font-medium text-muted-foreground leading-tight">{title}</CardTitle>
        <Icon className={`size-4 ${iconColor}`} />
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-7 w-16" />
        ) : (
          <p className="text-2xl font-semibold tabular-nums">{value}</p>
        )}
      </CardContent>
    </Card>
  );
}
