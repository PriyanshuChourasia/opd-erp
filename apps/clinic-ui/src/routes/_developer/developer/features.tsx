import { createFileRoute } from "@tanstack/react-router";
import { DevelopmentFeaturesPage } from "@/modules/development-features";

export const Route = createFileRoute("/_developer/developer/features")({
  staticData: { title: "Features" },
  component: DevelopmentFeaturesPage,
});
