import { createFileRoute } from "@tanstack/react-router";
import { OrganisationPage } from "@/modules/organisation";

export const Route = createFileRoute("/_dashboard/organisation/")({
  staticData: { title: "Organisation" },
  component: OrganisationPage,
});
