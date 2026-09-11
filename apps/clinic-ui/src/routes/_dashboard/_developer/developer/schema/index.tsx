import { createFileRoute } from "@tanstack/react-router";
import { DevelopmentSchemaPage } from "@/modules/development-schema";

export const Route = createFileRoute("/_dashboard/_developer/developer/schema/")({
  staticData: { title: "Schema" },
  component: DevelopmentSchemaPage,
});
