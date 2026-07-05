import { createFileRoute } from "@tanstack/react-router";
import { PosCheckoutPage } from "@/modules/pos";

export const Route = createFileRoute("/_pos/pos/")({
  component: PosCheckoutPage,
});
