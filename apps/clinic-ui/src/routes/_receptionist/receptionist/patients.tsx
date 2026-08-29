import { createFileRoute } from "@tanstack/react-router";
import { PatientsPage } from "@/modules/patients";

export const Route = createFileRoute("/_receptionist/receptionist/patients")({
  component: PatientsPage,
});
