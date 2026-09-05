import { createFileRoute } from "@tanstack/react-router";
import { CreatePrescriptionPage } from "@/modules/appointments";

export const Route = createFileRoute("/_dashboard/appointments/$appointmentId/prescription")({
  staticData: { title: "Edit Prescription" },
  component: CreatePrescriptionPage,
});
