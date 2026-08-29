import { createFileRoute } from "@tanstack/react-router";
import { PatientAppointmentsPage } from "@/modules/patient";

export const Route = createFileRoute("/_patient/patient/appointments")({
  staticData: { title: "Appointments" },
  component: PatientAppointmentsPage,
});
