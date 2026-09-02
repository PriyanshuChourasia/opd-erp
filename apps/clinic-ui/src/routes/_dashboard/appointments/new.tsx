import { createFileRoute } from "@tanstack/react-router";
import { NewAppointmentPage } from "@/modules/appointments";

export const Route = createFileRoute("/_dashboard/appointments/new")({
  staticData: { title: "New Appointment" },
  validateSearch: (search: Record<string, unknown>): { doctorId?: string; patientId?: string } => ({
    doctorId: typeof search.doctorId === "string" ? search.doctorId : undefined,
    patientId: typeof search.patientId === "string" ? search.patientId : undefined,
  }),
  component: NewAppointmentPage,
});
