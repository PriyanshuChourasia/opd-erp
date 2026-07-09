import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  CalendarClock,
  ClipboardList,
  FlaskConical,
  Receipt,
} from "lucide-react";
import { useAppSelector } from "@/store/hooks";
import { fetchAppointments, fetchPrescriptions, fetchBills } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

const APPT_STATUS_STYLES: Record<string, string> = {
  SCHEDULED: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  CONFIRMED: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  CHECKED_IN: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  IN_PROGRESS: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  COMPLETED: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  CANCELLED: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  NO_SHOW: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

const BILL_STATUS_STYLES: Record<string, string> = {
  PAID: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  PENDING: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  PARTIAL: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  REFUNDED: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  CANCELLED: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

function currency(value: number) {
  return `₹${value.toFixed(2)}`;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function PatientDashboardPage() {
  const user = useAppSelector((state) => state.auth.user);

  const { data: appointmentsData, isLoading: loadingAppts } = useQuery({
    queryKey: ["patient-appointments", user?.userableId],
    queryFn: () =>
      fetchAppointments({
        patientId: user?.userableId ?? undefined,
        limit: 10,
      }),
    enabled: !!user?.userableId,
  });

  const { data: prescriptionsData, isLoading: loadingRx } = useQuery({
    queryKey: ["patient-prescriptions", user?.userableId],
    queryFn: () =>
      fetchPrescriptions({
        patientId: user?.userableId ?? undefined,
        limit: 5,
      }),
    enabled: !!user?.userableId,
  });

  const { data: billsData, isLoading: loadingBills } = useQuery({
    queryKey: ["patient-bills", user?.userableId],
    queryFn: () =>
      fetchBills({
        patientId: user?.userableId ?? undefined,
        limit: 5,
      }),
    enabled: !!user?.userableId,
  });

  const upcomingAppointments = useMemo(
    () =>
      (appointmentsData?.data ?? [])
        .filter((a) => ["SCHEDULED", "CONFIRMED"].includes(a.status))
        .slice(0, 5),
    [appointmentsData],
  );

  const pastAppointments = useMemo(
    () =>
      (appointmentsData?.data ?? [])
        .filter((a) => ["COMPLETED", "CANCELLED", "NO_SHOW"].includes(a.status))
        .slice(0, 5),
    [appointmentsData],
  );

  if (!user?.userableId) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
        <CalendarClock className="size-12 text-muted-foreground/40" />
        <div>
          <h2 className="text-lg font-semibold">No patient profile linked</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Your account is not yet linked to a patient record. Please contact the clinic staff.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Welcome, {user?.firstName ?? "Patient"}
        </h1>
        <p className="text-sm text-muted-foreground">
          Here&apos;s a summary of your healthcare records.
        </p>
      </div>

      {/* Quick stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Upcoming</CardTitle>
            <CalendarClock className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loadingAppts ? (
              <Skeleton className="h-8 w-12" />
            ) : (
              <p className="text-2xl font-semibold tabular-nums">{upcomingAppointments.length}</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Prescriptions</CardTitle>
            <ClipboardList className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loadingRx ? (
              <Skeleton className="h-8 w-12" />
            ) : (
              <p className="text-2xl font-semibold tabular-nums">{prescriptionsData?.meta.total ?? 0}</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Lab Tests</CardTitle>
            <FlaskConical className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold tabular-nums text-muted-foreground">—</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Bills</CardTitle>
            <Receipt className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loadingBills ? (
              <Skeleton className="h-8 w-12" />
            ) : (
              <p className="text-2xl font-semibold tabular-nums">{billsData?.meta.total ?? 0}</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Upcoming appointments */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Upcoming Appointments</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loadingAppts ? (
              <div className="space-y-2 p-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : upcomingAppointments.length === 0 ? (
              <p className="px-4 pb-4 text-sm text-muted-foreground">No upcoming appointments.</p>
            ) : (
              <ul className="divide-y">
                {upcomingAppointments.map((appt) => (
                  <li key={appt.id} className="flex items-center justify-between px-4 py-3">
                    <div>
                      <p className="text-sm font-medium">{formatDate(appt.date)}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatTime(appt.date)} &middot; {appt.type.replace("_", " ")}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className={`text-[10px] ${APPT_STATUS_STYLES[appt.status] ?? ""}`}
                    >
                      {appt.status.replace("_", " ")}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Past appointments */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Visits</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loadingAppts ? (
              <div className="space-y-2 p-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : pastAppointments.length === 0 ? (
              <p className="px-4 pb-4 text-sm text-muted-foreground">No past visits.</p>
            ) : (
              <ul className="divide-y">
                {pastAppointments.map((appt) => (
                  <li key={appt.id} className="flex items-center justify-between px-4 py-3">
                    <div>
                      <p className="text-sm font-medium">{formatDate(appt.date)}</p>
                      <p className="text-xs text-muted-foreground">
                        {appt.type.replace("_", " ")}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className={`text-[10px] ${APPT_STATUS_STYLES[appt.status] ?? ""}`}
                    >
                      {appt.status.replace("_", " ")}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Recent prescriptions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Prescriptions</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loadingRx ? (
              <div className="space-y-2 p-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : (prescriptionsData?.data ?? []).length === 0 ? (
              <p className="px-4 pb-4 text-sm text-muted-foreground">No prescriptions found.</p>
            ) : (
              <ul className="divide-y">
                {(prescriptionsData?.data ?? []).slice(0, 4).map((rx) => (
                  <li key={rx.id} className="flex items-center justify-between px-4 py-3">
                    <div>
                      <p className="text-sm font-medium">{rx.diagnosis ?? "Prescription"}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(rx.createdAt)}</p>
                    </div>
                    <Badge
                      variant="outline"
                      className={`text-[10px] ${
                        rx.status === "DISPENSED"
                          ? "bg-green-100 text-green-700"
                          : rx.status === "ACTIVE"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {rx.status}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Recent bills */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Bills</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loadingBills ? (
              <div className="space-y-2 p-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : (billsData?.data ?? []).length === 0 ? (
              <p className="px-4 pb-4 text-sm text-muted-foreground">No bills found.</p>
            ) : (
              <ul className="divide-y">
                {(billsData?.data ?? []).slice(0, 4).map((bill) => (
                  <li key={bill.id} className="flex items-center justify-between px-4 py-3">
                    <div>
                      <p className="text-sm font-medium">{bill.invoiceNo}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(bill.createdAt)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium tabular-nums">{currency(bill.total)}</span>
                      <Badge
                        variant="outline"
                        className={`text-[10px] ${BILL_STATUS_STYLES[bill.status] ?? ""}`}
                      >
                        {bill.status}
                      </Badge>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
