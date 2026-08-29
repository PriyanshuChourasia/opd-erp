import { createFileRoute } from "@tanstack/react-router";
import { AllergiesPage } from "@/modules/allergies";

export const Route = createFileRoute("/_dashboard/allergies")({
  staticData: { title: "Allergies" },
  component: AllergiesPage,
});
