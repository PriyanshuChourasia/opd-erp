import { createFileRoute } from "@tanstack/react-router";
import { BillingPage } from "@/modules/billing";

export const Route = createFileRoute("/_receptionist/receptionist/billing")({
  component: BillingPage,
});
