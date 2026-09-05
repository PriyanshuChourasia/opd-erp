import { createFileRoute } from "@tanstack/react-router";
import { AppointmentsPage } from "@/modules/appointments";
import { dateRangeSearchValidator } from "@/lib/date-range-search";

export const Route = createFileRoute("/_dashboard/appointments/")({
  staticData: { title: "Appointments" },
  validateSearch: dateRangeSearchValidator,
  component: AppointmentsPage,
});
