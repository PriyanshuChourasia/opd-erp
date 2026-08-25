import { createFileRoute } from "@tanstack/react-router";
import { RolesPage } from "@/modules/roles-permissions/components/roles-page";

export const Route = createFileRoute("/_dashboard/roles")({
  component: RolesPage,
});
