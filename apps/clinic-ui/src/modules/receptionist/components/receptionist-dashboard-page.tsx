import { CalendarClock, ClipboardList, ListOrdered, Receipt, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboardStats } from "@/modules/dashboard/data/hooks";

const statTiles = [
  { key: "todayAppointments", label: "Today's appointments", icon: CalendarClock },
  { key: "patientsInQueue", label: "Patients in queue", icon: ListOrdered },
  { key: "registeredPatients", label: "Registered patients", icon: Users },
  { key: "pendingPrescriptions", label: "Pending prescriptions", icon: ClipboardList },
  { key: "todayRevenue", label: "Today's revenue", icon: Receipt },
] as const;

export function ReceptionistDashboardPage() {
  const statsQuery = useDashboardStats();
  const stats = statsQuery.data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Receptionist Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">Quick overview of clinic activity</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {statTiles.map(({ key, label, icon: Icon }) => (
          <Card key={key}>
            <CardContent className="flex items-center gap-4 p-4">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-none bg-primary/10">
                <Icon className="size-5 text-primary" />
              </span>
              <div className="min-w-0">
                <p className="text-sm text-muted-foreground">{label}</p>
                {statsQuery.isLoading ? (
                  <Skeleton className="mt-1 h-6 w-12" />
                ) : (
                  <p className="text-xl font-semibold">{stats?.[key as keyof typeof stats] ?? "—"}</p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
