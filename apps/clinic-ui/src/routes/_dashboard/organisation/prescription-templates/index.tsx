import { createFileRoute } from "@tanstack/react-router";
import { PrescriptionTemplateList } from "@/modules/prescription-templates";

export const Route = createFileRoute("/_dashboard/organisation/prescription-templates/")({
  staticData: { title: "Prescription Templates" },
  component: PrescriptionTemplateList,
});
