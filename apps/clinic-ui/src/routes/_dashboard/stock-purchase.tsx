import { createFileRoute } from "@tanstack/react-router";
import { PurchaseEntryPage } from "@/modules/stock";

export const Route = createFileRoute("/_dashboard/stock-purchase")({
  staticData: { title: "Purchase Entry" },
  component: PurchaseEntryPage,
});
