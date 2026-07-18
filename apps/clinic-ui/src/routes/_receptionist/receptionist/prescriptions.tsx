import { createFileRoute } from "@tanstack/react-router";
import { PrescriptionsPage } from "@/modules/prescriptions";

export const Route = createFileRoute("/_receptionist/receptionist/prescriptions")({
  component: PrescriptionsPage,
});
