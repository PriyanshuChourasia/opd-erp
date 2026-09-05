import { createFileRoute } from "@tanstack/react-router";
import { EditPrescriptionTemplatePage } from "@/modules/prescription-templates";

export const Route = createFileRoute("/_dashboard/organisation/prescription-templates/$templateId/edit")({
  staticData: { title: "Edit Prescription Template" },
  component: EditPrescriptionTemplatePage,
});
