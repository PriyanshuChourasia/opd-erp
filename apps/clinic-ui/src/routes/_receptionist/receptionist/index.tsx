import { createFileRoute } from "@tanstack/react-router";
import { ReceptionistTabsPage } from "@/modules/receptionist";

export const Route = createFileRoute("/_receptionist/receptionist/")({
  component: ReceptionistTabsPage,
});
