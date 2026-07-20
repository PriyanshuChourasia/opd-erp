import { createFileRoute } from "@tanstack/react-router";
import { AppointmentsPage } from "@/modules/appointments";

export const Route = createFileRoute("/_appointments/appointments/")({
  staticData: { title: "Appointments" },
  component: AppointmentsPage,
});
