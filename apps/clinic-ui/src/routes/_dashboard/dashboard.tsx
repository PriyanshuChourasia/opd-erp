import { createFileRoute } from "@tanstack/react-router";
import { DashboardPage } from "@/modules/dashboard";
import { dateRangeSearchValidator } from "@/lib/date-range-search";

export const Route = createFileRoute("/_dashboard/dashboard")({
  staticData: { title: "Dashboard" },
  validateSearch: dateRangeSearchValidator,
  component: DashboardPage,
});
