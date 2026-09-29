import { useQuery } from "@tanstack/react-query";
import { CalendarClock } from "lucide-react";
import { useAppSelector } from "@/store/hooks";
import { fetchAppointments } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/status-badge";

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
                  <StatusBadge status={appt.status} />
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
