import { createFileRoute } from "@tanstack/react-router";
import { DoctorPerformancePage } from "@/modules/reports";

export const Route = createFileRoute("/_dashboard/reports/doctor-performance")({
  staticData: { title: "Doctor Performance" },
  component: DoctorPerformancePage,
});
