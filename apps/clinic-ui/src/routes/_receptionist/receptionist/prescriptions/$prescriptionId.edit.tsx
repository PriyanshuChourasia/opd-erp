import { createFileRoute } from "@tanstack/react-router";
import { EditPrescriptionPage } from "@/modules/prescriptions";

export const Route = createFileRoute("/_receptionist/receptionist/prescriptions/$prescriptionId/edit")({
  component: EditPrescriptionPage,
});