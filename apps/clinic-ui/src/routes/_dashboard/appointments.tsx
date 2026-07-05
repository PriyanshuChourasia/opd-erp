import { createFileRoute } from "@tanstack/react-router";
import { AppointmentsPage } from "@/modules/appointments";

export const Route = createFileRoute("/_dashboard/appointments")({
  staticData: { title: "Appointments" },
  component: AppointmentsPage,
});
