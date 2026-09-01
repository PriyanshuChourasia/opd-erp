import { createFileRoute } from "@tanstack/react-router";
import { OutstandingPaymentsPage } from "@/modules/reports";
import { dateRangeSearchValidator } from "@/lib/date-range-search";

export const Route = createFileRoute("/_dashboard/reports/outstanding-payments")({
  staticData: { title: "Outstanding Payments Report" },
  validateSearch: dateRangeSearchValidator,
  component: OutstandingPaymentsPage,
});
