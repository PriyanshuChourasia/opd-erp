import { createFileRoute } from "@tanstack/react-router";
import { RevenueCollectionPage } from "@/modules/reports";

export const Route = createFileRoute("/_dashboard/reports/revenue-collection")({
  staticData: { title: "Revenue Collection Report" },
  component: RevenueCollectionPage,
});
