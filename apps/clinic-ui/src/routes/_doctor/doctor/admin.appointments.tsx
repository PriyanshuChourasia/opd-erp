import { createFileRoute } from "@tanstack/react-router";
import { AdminAppointments } from "@/modules/doctor-admin";

export const Route = createFileRoute("/_doctor/doctor/admin/appointments")({
  component: AdminAppointments,
});
