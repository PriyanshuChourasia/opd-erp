import { createFileRoute } from "@tanstack/react-router";
import { PosBillingPage } from "@/modules/pos";

export const Route = createFileRoute("/_pos/pos/billing")({
  component: PosBillingPage,
});
