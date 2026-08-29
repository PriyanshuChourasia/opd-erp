import { createFileRoute } from "@tanstack/react-router";
import { PosCheckoutPage } from "@/modules/pos";

export const Route = createFileRoute("/_pos/pos/")({
  validateSearch: (search: Record<string, unknown>): { appointmentId?: string } => ({
    appointmentId: typeof search.appointmentId === "string" ? search.appointmentId : undefined,
  }),
  component: PosCheckoutPage,
});
