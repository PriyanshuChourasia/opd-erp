import { createFileRoute } from "@tanstack/react-router";
import { DevelopmentModulesPage } from "@/modules/development-modules";

export const Route = createFileRoute("/_developer/developer/modules")({
  staticData: { title: "Modules" },
  component: DevelopmentModulesPage,
});
