import { createFileRoute } from "@tanstack/react-router";
import { PatientsPage } from "@/modules/patients";

export const Route = createFileRoute("/_dashboard/patients")({
  staticData: { title: "Patients" },
  component: PatientsPage,
});
