import { createFileRoute } from "@tanstack/react-router";
import { DevelopmentOverviewPage } from "@/modules/development-overview";

export const Route = createFileRoute("/_dashboard/development/")({
  staticData: { title: "Development" },
  component: DevelopmentOverviewPage,
});
