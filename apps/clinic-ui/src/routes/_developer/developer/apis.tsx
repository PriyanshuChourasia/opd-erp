import { createFileRoute } from "@tanstack/react-router";
import { DevelopmentApisPage } from "@/modules/development-apis";

export const Route = createFileRoute("/_developer/developer/apis")({
  staticData: { title: "APIs" },
  component: DevelopmentApisPage,
});
