import { createFileRoute } from "@tanstack/react-router";
import { NewPrescriptionTemplatePage } from "@/modules/prescription-templates";

export const Route = createFileRoute("/_dashboard/organisation/prescription-templates/new")({
  staticData: { title: "New Prescription Template" },
  component: NewPrescriptionTemplatePage,
});
