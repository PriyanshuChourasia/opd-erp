import { createFileRoute } from "@tanstack/react-router";
import { PatientLabOrdersPage } from "@/modules/patient";

export const Route = createFileRoute("/_patient/patient/lab-orders")({
  staticData: { title: "Lab Reports" },
  component: PatientLabOrdersPage,
});
