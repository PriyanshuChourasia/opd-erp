import { createFileRoute } from "@tanstack/react-router";
import { DevelopmentOverviewPage } from "@/modules/development-overview";

export const Route = createFileRoute("/_developer/developer/")({
  staticData: { title: "Overview" },
  component: DevelopmentOverviewPage,
});
