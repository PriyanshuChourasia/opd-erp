import { createFileRoute } from "@tanstack/react-router";
import { DiagnosticsTurnaroundPage } from "@/modules/reports";

export const Route = createFileRoute("/_dashboard/reports/diagnostics-turnaround")({
  staticData: { title: "Diagnostics Turnaround" },
  component: DiagnosticsTurnaroundPage,
});
