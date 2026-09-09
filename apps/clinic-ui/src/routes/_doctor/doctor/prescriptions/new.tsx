import { createFileRoute } from "@tanstack/react-router";
import { NewPrescriptionPage } from "@/modules/prescriptions";

export const Route = createFileRoute("/_doctor/doctor/prescriptions/new")({
  component: NewPrescriptionPage,
});
