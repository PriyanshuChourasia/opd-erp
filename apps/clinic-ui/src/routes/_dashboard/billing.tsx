import { createFileRoute } from "@tanstack/react-router";
import { BillingPage } from "@/modules/billing";

export const Route = createFileRoute("/_dashboard/billing")({
  staticData: { title: "Billing" },
  component: BillingPage,
});
