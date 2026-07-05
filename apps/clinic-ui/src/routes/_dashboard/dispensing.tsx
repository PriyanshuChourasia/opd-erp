import { createFileRoute } from "@tanstack/react-router";
import { DispensingPage } from "@/modules/dispensing";

export const Route = createFileRoute("/_dashboard/dispensing")({
  staticData: { title: "Dispensing" },
  component: DispensingPage,
});
