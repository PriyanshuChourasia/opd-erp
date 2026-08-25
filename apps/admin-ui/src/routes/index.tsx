import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="space-y-4 text-center">
        <h1 className="text-4xl font-semibold tracking-tight">Admin Panel</h1>
        <p className="text-muted-foreground">
          Welcome to the administration dashboard.
        </p>
      </div>
    </div>
  );
}
