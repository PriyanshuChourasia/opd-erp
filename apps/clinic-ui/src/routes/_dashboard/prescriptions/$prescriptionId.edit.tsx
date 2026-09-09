import { createFileRoute } from "@tanstack/react-router";
import { EditPrescriptionPage } from "@/modules/prescriptions";

export const Route = createFileRoute("/_dashboard/prescriptions/$prescriptionId/edit")({
  staticData: { title: "Edit Prescription" },
  component: EditPrescriptionPage,
});