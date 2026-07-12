import { createFileRoute } from "@tanstack/react-router";
import { PatientBillsPage } from "@/modules/patient";

export const Route = createFileRoute("/_patient/patient/bills")({
  staticData: { title: "Bills" },
  component: PatientBillsPage,
});
