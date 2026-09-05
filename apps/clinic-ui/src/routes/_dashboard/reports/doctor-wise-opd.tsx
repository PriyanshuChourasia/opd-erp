import { createFileRoute } from "@tanstack/react-router";
import { DoctorWiseOpdPage } from "@/modules/reports";
import { dateRangeSearchValidator } from "@/lib/date-range-search";

export const Route = createFileRoute("/_dashboard/reports/doctor-wise-opd")({
  staticData: { title: "Doctor-wise OPD Report" },
  validateSearch: dateRangeSearchValidator,
  component: DoctorWiseOpdPage,
});
