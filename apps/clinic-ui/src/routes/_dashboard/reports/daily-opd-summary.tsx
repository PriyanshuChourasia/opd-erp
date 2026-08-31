import { createFileRoute } from "@tanstack/react-router";
import { DailyOpdSummaryPage } from "@/modules/reports";

export const Route = createFileRoute("/_dashboard/reports/daily-opd-summary")({
  staticData: { title: "Daily OPD Summary" },
  component: DailyOpdSummaryPage,
});
