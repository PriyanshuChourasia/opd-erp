import { createFileRoute } from "@tanstack/react-router";
import { ReceptionistDashboardPage } from "@/modules/receptionist";

export const Route = createFileRoute("/_receptionist/receptionist/")({
  component: ReceptionistDashboardPage,
});
