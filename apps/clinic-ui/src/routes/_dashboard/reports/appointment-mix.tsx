import { createFileRoute } from "@tanstack/react-router";
import { AppointmentMixPage } from "@/modules/reports";

export const Route = createFileRoute("/_dashboard/reports/appointment-mix")({
  staticData: { title: "Appointment Mix" },
  component: AppointmentMixPage,
});
