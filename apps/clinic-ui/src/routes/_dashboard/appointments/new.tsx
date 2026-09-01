import { createFileRoute } from "@tanstack/react-router";
import { NewAppointmentPage } from "@/modules/appointments";

export const Route = createFileRoute("/_dashboard/appointments/new")({
  staticData: { title: "New Appointment" },
  validateSearch: (search: Record<string, unknown>): { doctorId?: string } => ({
    doctorId: typeof search.doctorId === "string" ? search.doctorId : undefined,
  }),
  component: NewAppointmentPage,
});
