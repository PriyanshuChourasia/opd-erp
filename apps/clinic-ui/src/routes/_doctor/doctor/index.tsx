import { createFileRoute } from "@tanstack/react-router";
import { DoctorPosPage } from "@/modules/doctor";

export const Route = createFileRoute("/_doctor/doctor/")({
  component: DoctorPosPage,
});
