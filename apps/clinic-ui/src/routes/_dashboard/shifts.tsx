import { createFileRoute } from "@tanstack/react-router";
import { ShiftsPage } from "@/modules/shifts";

export const Route = createFileRoute("/_dashboard/shifts")({
  staticData: { title: "Shifts" },
  component: ShiftsPage,
});
