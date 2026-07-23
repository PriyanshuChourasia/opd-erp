import { createFileRoute } from "@tanstack/react-router";
import { PatientDemographicsPage } from "@/modules/reports";

export const Route = createFileRoute("/_dashboard/reports/patient-demographics")({
  staticData: { title: "Patient Demographics" },
  component: PatientDemographicsPage,
});
