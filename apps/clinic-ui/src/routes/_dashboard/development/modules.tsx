import { createFileRoute } from "@tanstack/react-router";
import { DevelopmentModulesPage } from "@/modules/development-modules";

export const Route = createFileRoute("/_dashboard/development/modules")({
  staticData: { title: "Application Modules" },
  component: DevelopmentModulesPage,
});
