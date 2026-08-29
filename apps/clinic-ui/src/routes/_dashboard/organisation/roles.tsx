import { createFileRoute } from "@tanstack/react-router";
import { RolesPage } from "@/modules/roles-permissions";

export const Route = createFileRoute("/_dashboard/organisation/roles")({
  staticData: { title: "Roles & Permissions" },
  component: RolesPage,
});
