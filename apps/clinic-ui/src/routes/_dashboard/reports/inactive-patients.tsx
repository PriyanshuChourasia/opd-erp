import { createFileRoute } from "@tanstack/react-router";
import { InactivePatientsPage } from "@/modules/reports";

export const Route = createFileRoute("/_dashboard/reports/inactive-patients")({
  staticData: { title: "Inactive Patients" },
  component: InactivePatientsPage,
});
