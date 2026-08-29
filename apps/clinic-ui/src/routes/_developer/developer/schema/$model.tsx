import { createFileRoute } from "@tanstack/react-router";
import { SchemaModelDetailPage } from "@/modules/development-schema";

export const Route = createFileRoute("/_developer/developer/schema/$model")({
  staticData: { title: "Schema Viewer" },
  component: SchemaModelDetailPage,
});
