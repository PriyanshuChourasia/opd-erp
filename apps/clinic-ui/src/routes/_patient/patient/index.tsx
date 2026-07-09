import { createFileRoute } from "@tanstack/react-router";
import { PatientDashboardPage } from "@/modules/patient";

export const Route = createFileRoute("/_patient/patient/")({
  staticData: { title: "Patient Portal" },
  component: PatientDashboardPage,
});
