import { createFileRoute } from "@tanstack/react-router";
import { PatientPrescriptionsPage } from "@/modules/patient";

export const Route = createFileRoute("/_patient/patient/prescriptions")({
  staticData: { title: "Prescriptions" },
  component: PatientPrescriptionsPage,
});
