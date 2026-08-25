import { createFileRoute } from "@tanstack/react-router";
import { DoctorAppointmentsPage } from "@/modules/doctor";

export const Route = createFileRoute("/_doctor/doctor/appointments")({
  component: DoctorAppointmentsPage,
});
