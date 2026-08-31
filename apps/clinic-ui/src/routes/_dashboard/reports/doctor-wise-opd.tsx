import { createFileRoute } from "@tanstack/react-router";
import { DoctorWiseOpdPage } from "@/modules/reports";

export const Route = createFileRoute("/_dashboard/reports/doctor-wise-opd")({
  staticData: { title: "Doctor-wise OPD Report" },
  component: DoctorWiseOpdPage,
});
