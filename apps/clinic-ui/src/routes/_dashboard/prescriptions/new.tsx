import { createFileRoute } from "@tanstack/react-router";
import { NewPrescriptionPage } from "@/modules/prescriptions";

export const Route = createFileRoute("/_dashboard/prescriptions/new")({
  staticData: { title: "Create Prescription" },
  component: NewPrescriptionPage,
});
