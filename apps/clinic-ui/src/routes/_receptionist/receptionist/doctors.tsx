import { createFileRoute } from "@tanstack/react-router";
import { DoctorsPage } from "@/modules/doctors";

export const Route = createFileRoute("/_receptionist/receptionist/doctors")({
  component: DoctorsPage,
});
