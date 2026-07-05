import { createFileRoute } from "@tanstack/react-router";
import { DevelopmentFeaturesPage } from "@/modules/development-features";

export const Route = createFileRoute("/_dashboard/development/features")({
  staticData: { title: "Application Features" },
  component: DevelopmentFeaturesPage,
});
