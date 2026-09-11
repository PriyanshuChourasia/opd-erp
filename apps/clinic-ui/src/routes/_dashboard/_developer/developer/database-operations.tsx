import { createFileRoute } from "@tanstack/react-router";
import { DevelopmentDatabasePage } from "@/modules/development-database";

export const Route = createFileRoute("/_dashboard/_developer/developer/database-operations")({
  staticData: { title: "Database Operations" },
  component: DevelopmentDatabasePage,
});
