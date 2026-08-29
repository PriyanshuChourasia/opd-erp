import { createFileRoute } from "@tanstack/react-router";
import { AdminDashboard } from "@/modules/doctor-admin";

export const Route = createFileRoute("/_doctor/doctor/admin")({
  component: AdminDashboard,
});
