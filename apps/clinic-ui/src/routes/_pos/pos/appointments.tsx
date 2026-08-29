import { createFileRoute } from "@tanstack/react-router";
import { PosAppointmentsPage } from "@/modules/pos";

export const Route = createFileRoute("/_pos/pos/appointments")({
  component: PosAppointmentsPage,
});
