import { useMemo, useState } from "react";
import { Link, Navigate } from "@tanstack/react-router";
import { useDateRangeSync } from "@/lib/date-range-search";
import {
  CalendarClock,
  ClipboardList,
  Clock,
  ListOrdered,
  Users,
  Stethoscope,
  CheckCircle,
  XCircle,
  Hourglass,
  Send,
  TrendingUp,
  TrendingDown,
  Activity,
  Pill,
  DollarSign,
  AlertTriangle,
  UserPlus,
  CalendarPlus,
  UserCheck,
  FileText,
  Receipt,
  Building2,
  Shield,
  Zap,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useAppSelector } from "@/store/hooks";
import { getHomeRoute } from "@/lib/roles";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDashboardStats, useDashboardCharts } from "../data/hooks";

// ─── Status Styles ───────────────────────────────────────────
const STATUS_STYLES: Record<string, { icon: typeof Clock; badge: string }> = {
  SCHEDULED: { icon: Clock, badge: "bg-blue-50 text-blue-700 border-blue-200" },
  CONFIRMED: { icon: CheckCircle, badge: "bg-green-50 text-green-700 border-green-200" },
  CHECKED_IN: { icon: CheckCircle, badge: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  IN_PROGRESS: { icon: Hourglass, badge: "bg-amber-50 text-amber-700 border-amber-200" },
  COMPLETED: { icon: CheckCircle, badge: "bg-green-50 text-green-700 border-green-200" },
  CANCELLED: { icon: XCircle, badge: "bg-red-50 text-red-700 border-red-200" },
  WAITING: { icon: Clock, badge: "bg-blue-50 text-blue-700 border-blue-200" },
  NO_SHOW: { icon: XCircle, badge: "bg-red-50 text-red-700 border-red-200" },
  PENDING: { icon: Clock, badge: "bg-amber-50 text-amber-700 border-amber-200" },
  PAID: { icon: CheckCircle, badge: "bg-green-50 text-green-700 border-green-200" },
  ACTIVE: { icon: CheckCircle, badge: "bg-green-50 text-green-700 border-green-200" },
};

function StatusBadge({ status }: { status: string }) {
  const style = STATUS_STYLES[status] ?? { icon: Clock, badge: "bg-gray-50 text-gray-700 border-gray-200" };
  return (
    <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-medium ${style.badge}`}>
      {status.replace(/_/g, " ")}
    </span>
  );
}

function currency(value: number) {
  return `₹${value.toLocaleString("en-IN")}`;
}

function todayStr() {
  return new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
}

function timeAgo(timestamp: string) {
  const diff = Date.now() - new Date(timestamp).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function calculateAge(dob: string | null): string {
  if (!dob) return "—";
  const age = new Date().getFullYear() - new Date(dob).getFullYear();
  return `${age}y`;
}

// ─── Reusable Components ─────────────────────────────────────
function SummaryCard({ title, value, subtitle, icon: Icon, loading }: {
  title: string; value: number | string; subtitle?: string; icon: typeof CalendarClock; loading?: boolean;
}) {
  return (
    <Card className="py-2">
      <CardHeader className="flex flex-row items-center justify-between gap-1 pb-0.5 px-3">
        <CardTitle className="text-[11px] font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="size-3 text-muted-foreground" />
      </CardHeader>
      <CardContent className="px-3 pt-0">
        {loading ? <Skeleton className="h-5 w-12" /> : <p className="text-lg font-semibold tabular-nums">{value}</p>}
        {subtitle && <p className="mt-0.5 text-[10px] text-muted-foreground leading-tight">{subtitle}</p>}
      </CardContent>
    </Card>
  );
}

function SectionHeader({ title, icon: Icon, action }: { title: string; icon: typeof CalendarClock; action?: { label: string; to: string } }) {
  return (
    <div className="flex items-center justify-between">
      <CardTitle className="flex items-center gap-2 text-base"><Icon className="size-4" />{title}</CardTitle>
      {action && (
        <Link to={action.to} className="flex items-center gap-1 text-xs font-medium text-primary hover:underline">
          {action.label}→
        </Link>
      )}
    </div>
  );
}

function LoadingRows({ count = 5 }: { count?: number }) {
  return <div className="space-y-3 p-4">{Array.from({ length: count }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>;
}

function EmptyState({ message }: { message: string }) {
  return <p className="px-4 py-8 text-center text-sm text-muted-foreground">{message}</p>;
}

// ─── Main Dashboard ──────────────────────────────────────────
export function DashboardPage() {
  const user = useAppSelector((state) => state.auth.user);
  const { dateRange } = useDateRangeSync();
  const statsQuery = useDashboardStats(dateRange);
  const chartsQuery = useDashboardCharts(dateRange);
  const [revenuePeriod, setRevenuePeriod] = useState<"today" | "week" | "month">("today");

  const home = getHomeRoute(user?.roleName);
  if (home !== "/dashboard") return <Navigate to={home} replace />;

  const stats = statsQuery.data;
  const charts = chartsQuery.data;
  const loading = statsQuery.isLoading;
  const chartsLoading = chartsQuery.isLoading;

  const filteredRevenueTrend = useMemo(() => {
    if (!charts?.revenueTrend) return [];
    if (revenuePeriod === "today") return charts.revenueTrend.slice(-1);
    if (revenuePeriod === "week") return charts.revenueTrend.slice(-7);
    return charts.revenueTrend;
  }, [charts?.revenueTrend, revenuePeriod]);

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Welcome{user?.firstName ? `, ${user.firstName}` : ""}</h1>
          <p className="text-sm text-muted-foreground">Here&apos;s what&apos;s happening at the clinic today.</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <CalendarClock className="size-4" /><span>{todayStr()}</span>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard title="Today's Appointments" value={stats?.todayAppointments ?? 0} subtitle={`${stats?.completedAppointments ?? 0} completed · ${stats?.pendingAppointments ?? 0} pending`} icon={CalendarClock} loading={loading} />
        <SummaryCard title="Patients in Queue" value={stats?.patientsInQueue ?? 0} subtitle="Currently waiting" icon={ListOrdered} loading={loading} />
        <SummaryCard title="Total Patients" value={stats?.registeredPatients ?? 0} subtitle="Registered patients" icon={Users} loading={loading} />
        <SummaryCard title="Doctors" value={stats?.totalDoctors ?? 0} subtitle={`${stats?.activeDoctors ?? 0} available today`} icon={Stethoscope} loading={loading} />
        <SummaryCard title="Today's OPD Visits" value={stats?.opdTotal ?? 0} subtitle={`${stats?.opdCompleted ?? 0} completed · ${stats?.opdWaiting ?? 0} waiting`} icon={Activity} loading={loading} />
        <SummaryCard title="Pending Prescriptions" value={stats?.pendingPrescriptions ?? 0} subtitle="Require attention" icon={ClipboardList} loading={loading} />
        <SummaryCard title="Outstanding Bills" value={currency(stats?.outstandingAmount ?? 0)} subtitle="Unpaid invoices" icon={Receipt} loading={loading} />
        <SummaryCard title="Low Stock Medicines" value={stats?.lowStockMedicines ?? 0} subtitle="Below threshold" icon={Pill} loading={loading} />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList variant="line" className="w-full justify-start border border-border rounded-none p-1 bg-muted/30">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="operations">Operations</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
        </TabsList>

        {/* ── Overview Tab ── */}
        <TabsContent value="overview" className="mt-4">
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Today's Appointments */}
            <Card>
              <CardHeader className="pb-3">
                <SectionHeader title="Today's Appointments" icon={CalendarClock} action={{ label: "View All", to: "/appointments" }} />
              </CardHeader>
              <CardContent className="p-0">
                {loading ? <LoadingRows /> : !stats?.latestAppointments?.length ? <EmptyState message="No appointments today." /> : (
                  <div className="divide-y">
                    {stats.latestAppointments.map((appt) => (
                      <Link key={appt.id} to="/appointments" className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-muted/50 transition-colors">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">{appt.patient.firstName} {appt.patient.lastName}</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Stethoscope className="size-3" />{appt.doctor.specialization ?? "General"}{appt.type && <span className="ml-1">· {appt.type.replace(/_/g, " ")}</span>}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">{new Date(appt.date).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</span>
                          <StatusBadge status={appt.status} />
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Today's Queue */}
            <Card>
              <CardHeader className="pb-3">
                <SectionHeader title="Today's Queue" icon={ListOrdered} action={{ label: "View Queue", to: "/queue" }} />
              </CardHeader>
              <CardContent className="p-0">
                {loading ? <LoadingRows /> : !stats?.latestQueue?.length ? <EmptyState message="No patients in queue today." /> : (
                  <div className="divide-y">
                    {stats.latestQueue.map((entry, idx) => (
                      <Link key={entry.id} to="/queue" className={`flex items-center justify-between gap-3 px-4 py-3 hover:bg-muted/50 transition-colors ${idx === 0 ? "bg-primary/5" : ""}`}>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            {entry.tokenNumber != null && (
                              <span className={`flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${idx === 0 ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary"}`}>{entry.tokenNumber}</span>
                            )}
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate">{entry.patient.firstName} {entry.patient.lastName}</p>
                              <p className="text-xs text-muted-foreground flex items-center gap-1"><Stethoscope className="size-3" />{entry.doctor.specialization ?? "General"}</p>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">{timeAgo(entry.createdAt)}</span>
                          <StatusBadge status={entry.status} />
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── Analytics Tab ── */}
        <TabsContent value="analytics" className="mt-4">
          <div className="flex flex-col gap-4">
            {/* Appointment Overview Chart */}
            <Card>
              <CardHeader className="pb-3"><SectionHeader title="Appointment Overview" icon={Activity} /></CardHeader>
              <CardContent>
                {chartsLoading ? <Skeleton className="h-48 w-full" /> : !charts?.weeklyAppointmentStats?.length ? <EmptyState message="No appointment data." /> : (
                  <div className="h-48"><ResponsiveContainer width="100%" height="100%">
                    <BarChart data={charts.weeklyAppointmentStats}>
                      <XAxis dataKey="day" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis fontSize={12} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={{ borderRadius: 0, border: "1px solid hsl(var(--border))", background: "hsl(var(--background))" }} />
                      <Bar dataKey="total" fill="#3b82f6" radius={[2, 2, 0, 0]} name="Total" />
                      <Bar dataKey="completed" fill="#10b981" radius={[2, 2, 0, 0]} name="Completed" />
                      <Bar dataKey="cancelled" fill="#ef4444" radius={[2, 2, 0, 0]} name="Cancelled" />
                    </BarChart>
                  </ResponsiveContainer></div>
                )}
              </CardContent>
            </Card>

            <div className="grid gap-4 lg:grid-cols-2">
              {/* OPD Overview */}
              <Card>
                <CardHeader className="pb-3"><SectionHeader title="OPD Overview" icon={Activity} /></CardHeader>
                <CardContent>
                  {loading ? <LoadingRows count={3} /> : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-none border p-3"><p className="text-[11px] text-muted-foreground">Today's OPD</p><p className="text-lg font-semibold">{stats?.opdTotal ?? 0}</p></div>
                        <div className="rounded-none border p-3"><p className="text-[11px] text-muted-foreground">Completed</p><p className="text-lg font-semibold text-green-600">{stats?.opdCompleted ?? 0}</p></div>
                        <div className="rounded-none border p-3"><p className="text-[11px] text-muted-foreground">Waiting</p><p className="text-lg font-semibold text-amber-600">{stats?.opdWaiting ?? 0}</p></div>
                        <div className="rounded-none border p-3"><p className="text-[11px] text-muted-foreground">Avg Wait</p><p className="text-lg font-semibold">~15m</p></div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1">
                          <span>Completion Rate</span>
                          <span>{stats?.opdTotal ? Math.round(((stats.opdCompleted ?? 0) / stats.opdTotal) * 100) : 0}%</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                          <div className="h-full rounded-full bg-green-500" style={{ width: `${stats?.opdTotal ? ((stats.opdCompleted ?? 0) / stats.opdTotal) * 100 : 0}%` }} />
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Revenue Overview */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <SectionHeader title="Revenue Overview" icon={DollarSign} />
                    <div className="flex items-center gap-0.5 rounded-none border p-0.5">
                      {(["today", "week", "month"] as const).map((period) => (
                        <button key={period} type="button" className={`rounded-none px-2 py-0.5 text-[11px] font-medium transition-colors ${revenuePeriod === period ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`} onClick={() => setRevenuePeriod(period)}>
                          {period === "today" ? "Today" : period === "week" ? "Week" : "Month"}
                        </button>
                      ))}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {chartsLoading ? <Skeleton className="h-36 w-full" /> : (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div><p className="text-[11px] text-muted-foreground">Today's Revenue</p><p className="text-lg font-semibold">{currency(stats?.todayRevenue ?? 0)}</p></div>
                        <div><p className="text-[11px] text-muted-foreground">Outstanding</p><p className="text-lg font-semibold text-amber-600">{currency(stats?.outstandingAmount ?? 0)}</p></div>
                      </div>
                      {filteredRevenueTrend.length > 0 && (
                        <div className="h-36"><ResponsiveContainer width="100%" height="100%">
                          <BarChart data={filteredRevenueTrend}>
                            <XAxis dataKey="date" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => v.slice(5)} />
                            <YAxis fontSize={10} tickLine={false} axisLine={false} />
                            <Tooltip contentStyle={{ borderRadius: 0, border: "1px solid hsl(var(--border))", background: "hsl(var(--background))" }} formatter={(value: any) => [`₹${Number(value).toLocaleString("en-IN")}`, "Revenue"]} />
                            <Bar dataKey="revenue" fill="#3b82f6" radius={[2, 2, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer></div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* ── Operations Tab ── */}
        <TabsContent value="operations" className="mt-4">
          <div className="flex flex-col gap-4">
            <div className="grid gap-4 lg:grid-cols-2">
              {/* Doctor Availability */}
              <Card>
                <CardHeader className="pb-3"><SectionHeader title="Doctor Availability" icon={Stethoscope} action={{ label: "View All", to: "/doctors" }} /></CardHeader>
                <CardContent className="p-0">
                  {loading ? <LoadingRows count={4} /> : !stats?.doctorAvailability?.length ? <EmptyState message="No doctor data." /> : (
                    <div className="divide-y">
                      {stats.doctorAvailability.slice(0, 6).map((doc) => (
                        <div key={doc.doctorId} className="flex items-center justify-between gap-3 px-4 py-2.5">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium truncate">{doc.name}</p>
                            <p className="text-[11px] text-muted-foreground">{doc.appointmentCount} appointments today</p>
                          </div>
                          <Badge variant="outline" className={`text-[10px] ${doc.available ? "bg-green-50 text-green-700 border-green-200" : "bg-gray-50 text-gray-500 border-gray-200"}`}>{doc.available ? "Available" : "Busy"}</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Low Stock Medicines */}
              <Card>
                <CardHeader className="pb-3"><SectionHeader title="Low Stock Medicines" icon={Pill} action={{ label: "View Catalog", to: "/medicine-catalog" }} /></CardHeader>
                <CardContent>
                  {loading ? <LoadingRows count={3} /> : (stats?.lowStockMedicines ?? 0) === 0 ? (
                    <div className="flex items-center gap-2 rounded-none border border-green-200 bg-green-50 p-2.5 text-sm text-green-700"><CheckCircle className="size-4" />All medicines adequately stocked.</div>
                  ) : (
                    <div className="flex items-center gap-2 rounded-none border border-amber-200 bg-amber-50 p-2.5 text-sm text-amber-700"><AlertTriangle className="size-4" />{stats?.lowStockMedicines ?? 0} medicines need restocking.</div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Recent Patients */}
            <Card>
              <CardHeader className="pb-3"><SectionHeader title="Recent Patients" icon={Users} action={{ label: "View All", to: "/patients" }} /></CardHeader>
              <CardContent className="p-0">
                {loading ? <LoadingRows /> : !(stats?.recentPatients ?? charts?.recentPatients)?.length ? <EmptyState message="No recent patients." /> : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead><tr className="border-b bg-muted/50 text-left text-[11px] font-medium text-muted-foreground">
                        <th className="px-4 py-2">ID</th><th className="px-4 py-2">Name</th><th className="px-4 py-2">Age</th><th className="px-4 py-2">Gender</th><th className="px-4 py-2">Blood</th><th className="px-4 py-2">Registered</th>
                      </tr></thead>
                      <tbody className="divide-y">
                        {(stats?.recentPatients ?? charts?.recentPatients ?? []).slice(0, 5).map((p) => (
                          <tr key={p.id} className="hover:bg-muted/50">
                            <td className="px-4 py-2 text-[11px] font-mono text-muted-foreground">{p.patientCode}</td>
                            <td className="px-4 py-2 font-medium">{p.firstName} {p.lastName}</td>
                            <td className="px-4 py-2 text-muted-foreground">{calculateAge(p.dateOfBirth)}</td>
                            <td className="px-4 py-2 text-muted-foreground">{p.gender ?? "—"}</td>
                            <td className="px-4 py-2">{p.bloodGroup ? <Badge variant="outline" className="text-[10px]">{p.bloodGroup}</Badge> : "—"}</td>
                            <td className="px-4 py-2 text-[11px] text-muted-foreground">{timeAgo(p.createdAt)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader className="pb-3"><SectionHeader title="Quick Actions" icon={Zap} /></CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
                  {[
                    { label: "Register Patient", to: "/patients", icon: UserPlus, color: "bg-blue-50 text-blue-600" },
                    { label: "Book Appointment", to: "/appointments/new", icon: CalendarPlus, color: "bg-green-50 text-green-600" },
                    { label: "View Doctors", to: "/doctors", icon: UserCheck, color: "bg-purple-50 text-purple-600" },
                    { label: "Prescriptions", to: "/prescriptions", icon: FileText, color: "bg-amber-50 text-amber-600" },
                    { label: "Medicine Catalog", to: "/medicine-catalog", icon: Pill, color: "bg-rose-50 text-rose-600" },
                    { label: "Billing", to: "/billing", icon: Receipt, color: "bg-emerald-50 text-emerald-600" },
                  ].map((action) => (
                    <Link key={action.to} to={action.to} className="flex flex-col items-center gap-1.5 rounded-none border p-3 text-center transition-colors hover:bg-muted/50">
                      <div className={`flex size-8 items-center justify-center rounded-full ${action.color}`}><action.icon className="size-4" /></div>
                      <span className="text-[11px] font-medium">{action.label}</span>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── System Tab ── */}
        <TabsContent value="system" className="mt-4">
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Clinic Overview */}
            <Card>
              <CardHeader className="pb-3"><SectionHeader title="Clinic Overview" icon={Building2} /></CardHeader>
              <CardContent>
                {loading ? <LoadingRows count={3} /> : (
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: "Total Doctors", value: stats?.totalDoctors ?? 0, icon: Stethoscope },
                      { label: "Total Staff", value: stats?.totalStaff ?? 0, icon: Users },
                      { label: "Departments", value: stats?.totalDepartments ?? 0, icon: Building2 },
                      { label: "Active Users", value: stats?.totalActiveUsers ?? 0, icon: Shield },
                      { label: "Patients", value: stats?.registeredPatients ?? 0, icon: Users },
                      { label: "Medicines", value: stats?.totalMedicines ?? 0, icon: Pill },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center gap-2.5 rounded-none border p-2.5">
                        <div className="flex size-8 items-center justify-center rounded-full bg-muted"><item.icon className="size-3.5 text-muted-foreground" /></div>
                        <div><p className="text-[11px] text-muted-foreground">{item.label}</p><p className="text-base font-semibold tabular-nums">{item.value}</p></div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader className="pb-3"><SectionHeader title="Recent Activity" icon={Activity} /></CardHeader>
              <CardContent className="p-0">
                {chartsLoading ? <LoadingRows count={5} /> : !charts?.recentActivity?.length ? <EmptyState message="No recent activity." /> : (
                  <div className="divide-y">
                    {charts.recentActivity.map((item) => (
                      <div key={item.id} className="flex items-start gap-2.5 px-4 py-2.5">
                        <div className={`mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full ${item.type === "appointment" ? "bg-blue-50 text-blue-600" : item.type === "billing" ? "bg-green-50 text-green-600" : "bg-purple-50 text-purple-600"}`}>
                          {item.type === "appointment" ? <CalendarClock className="size-3" /> : item.type === "billing" ? <Receipt className="size-3" /> : <FileText className="size-3" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm">{item.description}</p>
                          <p className="text-[11px] text-muted-foreground">{timeAgo(item.timestamp)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
