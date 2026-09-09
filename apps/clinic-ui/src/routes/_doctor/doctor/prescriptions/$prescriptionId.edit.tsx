import { createFileRoute } from "@tanstack/react-router";
import { EditPrescriptionPage } from "@/modules/prescriptions";

export const Route = createFileRoute("/_doctor/doctor/prescriptions/$prescriptionId/edit")({
  component: EditPrescriptionPage,
});