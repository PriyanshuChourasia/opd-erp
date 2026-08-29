import { createFileRoute } from "@tanstack/react-router";
import { DoctorsPage } from "@/modules/doctors";

export const Route = createFileRoute("/_dashboard/doctors")({
  staticData: { title: "Doctors" },
  component: DoctorsPage,
});
