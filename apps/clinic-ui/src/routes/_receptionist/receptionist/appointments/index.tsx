import { createFileRoute } from "@tanstack/react-router";
import { AppointmentsPage } from "@/modules/appointments";

export const Route = createFileRoute("/_receptionist/receptionist/appointments/")({
  component: AppointmentsPage,
});
