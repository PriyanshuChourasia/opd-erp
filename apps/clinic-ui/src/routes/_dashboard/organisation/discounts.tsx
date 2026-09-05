import { createFileRoute } from "@tanstack/react-router";
import { DiscountsPage } from "@/modules/discounts";

export const Route = createFileRoute("/_dashboard/organisation/discounts")({
  staticData: { title: "Discounts" },
  component: DiscountsPage,
});
