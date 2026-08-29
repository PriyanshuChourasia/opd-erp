import { createFileRoute } from "@tanstack/react-router";
import { RevenueByCategoryPage } from "@/modules/reports";

export const Route = createFileRoute("/_dashboard/reports/revenue-by-category")({
  staticData: { title: "Revenue by Category" },
  component: RevenueByCategoryPage,
});
