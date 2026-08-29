import { createFileRoute } from "@tanstack/react-router";
import { AdminPrescriptions } from "@/modules/doctor-admin";

export const Route = createFileRoute("/_doctor/doctor/admin/prescriptions")({
  component: AdminPrescriptions,
});
