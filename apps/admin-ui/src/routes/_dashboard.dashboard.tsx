import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_dashboard/dashboard")({
  component: DashboardPage,
});

function DashboardPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome to the administration dashboard.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card title="Total Users" value="—" />
        <Card title="Organisations" value="—" />
        <Card title="Active Modules" value="—" />
        <Card title="System Status" value="Operational" />
      </div>
    </div>
  );
}

function Card({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-lg border bg-card p-4 text-card-foreground shadow-sm">
      <p className="text-sm font-medium text-muted-foreground">{title}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  );
}
