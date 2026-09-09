import { createFileRoute } from "@tanstack/react-router";
import { NewPrescriptionPage } from "@/modules/prescriptions";

export const Route = createFileRoute("/_receptionist/receptionist/prescriptions/new")({
  component: NewPrescriptionPage,
});
