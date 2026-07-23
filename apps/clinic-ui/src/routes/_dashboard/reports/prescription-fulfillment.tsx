import { createFileRoute } from "@tanstack/react-router";
import { PrescriptionFulfillmentPage } from "@/modules/reports";

export const Route = createFileRoute("/_dashboard/reports/prescription-fulfillment")({
  staticData: { title: "Prescription Fulfillment" },
  component: PrescriptionFulfillmentPage,
});
