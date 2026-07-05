import { createFileRoute } from "@tanstack/react-router";
import { PrescriptionsPage } from "@/modules/prescriptions";

export const Route = createFileRoute("/_dashboard/prescriptions")({
  staticData: { title: "Prescriptions" },
  component: PrescriptionsPage,
});
