import { createFileRoute } from "@tanstack/react-router";
import { DiagnosesPage } from "@/modules/diagnoses";

export const Route = createFileRoute("/_dashboard/diagnoses")({
  staticData: { title: "Diagnoses" },
  component: DiagnosesPage,
});
