import { createFileRoute } from "@tanstack/react-router";
import { RevenueCollectionPage } from "@/modules/reports";
import { dateRangeSearchValidator } from "@/lib/date-range-search";

export const Route = createFileRoute("/_dashboard/reports/revenue-collection")({
  staticData: { title: "Revenue Collection Report" },
  validateSearch: dateRangeSearchValidator,
  component: RevenueCollectionPage,
});
