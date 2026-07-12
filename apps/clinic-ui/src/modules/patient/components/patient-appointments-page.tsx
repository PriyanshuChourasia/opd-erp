import { useQuery } from "@tanstack/react-query";
import { CalendarClock } from "lucide-react";
import { useAppSelector } from "@/store/hooks";
import { fetchAppointments } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
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

export function PatientAppointmentsPage() {
  const user = useAppSelector((state) => state.auth.user);

  const { data, isLoading } = useQuery({
    queryKey: ["patient-appointments-all", user?.userableId],
    queryFn: () =>
      fetchAppointments({
        patientId: user?.userableId ?? undefined,
        limit: 50,
      }),
    enabled: !!user?.userableId,
  });

  const appointments = data?.data ?? [];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Appointments</h1>
        <p className="text-sm text-muted-foreground">Your scheduled and past appointments.</p>
      </div>

      <Card>
        <CardContent className="p-0">
          {!user?.userableId ? (
            <p className="px-4 py-6 text-sm text-muted-foreground">
              Your account is not yet linked to a patient record.
            </p>
          ) : isLoading ? (
            <div className="space-y-2 p-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : appointments.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
              <CalendarClock className="size-10 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">No appointments found.</p>
            </div>
          ) : (
            <ul className="divide-y">
              {appointments.map((appt) => (
                <li key={appt.id} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <p className="text-sm font-medium">
                      {formatDate(appt.date)} &middot; {formatTime(appt.date)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {appt.doctor.name ?? appt.doctor.medicalRegistrationNo} &middot;{" "}
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
  );
}
