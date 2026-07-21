import { createFileRoute } from "@tanstack/react-router";
import { NewAppointmentPage } from "@/modules/appointments";

export const Route = createFileRoute("/_receptionist/receptionist/appointments/new")({
  staticData: { title: "New Appointment" },
  component: NewAppointmentPage,
});
