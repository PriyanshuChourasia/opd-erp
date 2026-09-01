import { createFileRoute } from "@tanstack/react-router";
import { DailyOpdSummaryPage } from "@/modules/reports";
import { dateRangeSearchValidator } from "@/lib/date-range-search";

export const Route = createFileRoute("/_dashboard/reports/daily-opd-summary")({
  staticData: { title: "Daily OPD Summary" },
  validateSearch: dateRangeSearchValidator,
  component: DailyOpdSummaryPage,
});
