import { createFileRoute } from "@tanstack/react-router";
import { EditAppointmentPage } from "@/modules/appointments";

export const Route = createFileRoute("/_dashboard/appointments/$appointmentId/edit")({
  staticData: { title: "Edit Appointment" },
  component: EditAppointmentPage,
});
