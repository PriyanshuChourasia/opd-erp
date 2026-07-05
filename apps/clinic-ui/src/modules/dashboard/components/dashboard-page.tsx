import { Navigate } from "@tanstack/react-router";
import { CalendarClock, ClipboardList, ListOrdered, Users } from "lucide-react";
import { useAppSelector } from "@/store/hooks";
import { getHomeRoute } from "@/lib/roles";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const stats = [
  { label: "Today's appointments", icon: CalendarClock },
  { label: "Patients in queue", icon: ListOrdered },
  { label: "Registered patients", icon: Users },
  { label: "Pending prescriptions", icon: ClipboardList },
] as const;

export function DashboardPage() {
  const user = useAppSelector((state) => state.auth.user);

  if (getHomeRoute(user?.roleName) === "/pos") {
    return <Navigate to="/pos" replace />;
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Welcome{user?.name ? `, ${user.name}` : ""}
        </h1>
        <p className="text-sm text-muted-foreground">
          Here&apos;s what&apos;s happening at the clinic today.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(({ label, icon: Icon }) => (
          <Card key={label}>
            <CardHeader className="flex flex-row items-center justify-between gap-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
              <Icon className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">—</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
