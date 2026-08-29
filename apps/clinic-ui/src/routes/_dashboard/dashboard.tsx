import { createFileRoute } from "@tanstack/react-router";
import { DashboardPage } from "@/modules/dashboard";

export const Route = createFileRoute("/_dashboard/dashboard")({
  staticData: { title: "Dashboard" },
  component: DashboardPage,
});
