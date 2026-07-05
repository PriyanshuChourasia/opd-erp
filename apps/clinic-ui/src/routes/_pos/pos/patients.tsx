import { createFileRoute } from "@tanstack/react-router";
import { PosPatientsPage } from "@/modules/pos";

export const Route = createFileRoute("/_pos/pos/patients")({
  component: PosPatientsPage,
});
