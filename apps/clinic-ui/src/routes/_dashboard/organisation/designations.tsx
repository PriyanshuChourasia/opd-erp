import { createFileRoute } from "@tanstack/react-router";
import { DesignationsPage } from "@/modules/designations";

export const Route = createFileRoute("/_dashboard/organisation/designations")({
  staticData: { title: "Designations" },
  component: DesignationsPage,
});
