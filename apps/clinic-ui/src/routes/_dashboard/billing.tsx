import { createFileRoute } from "@tanstack/react-router";
import { BillingPage } from "@/modules/billing";
import { dateRangeSearchValidator } from "@/lib/date-range-search";

export const Route = createFileRoute("/_dashboard/billing")({
  staticData: { title: "Billing" },
  validateSearch: dateRangeSearchValidator,
  component: BillingPage,
});
