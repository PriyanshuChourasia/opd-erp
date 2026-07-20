import { createFileRoute } from "@tanstack/react-router";
import { NewAppointmentPage } from "@/modules/appointments";

export const Route = createFileRoute("/_appointments/appointments/new")({
  staticData: { title: "New Appointment" },
  component: NewAppointmentPage,
});
