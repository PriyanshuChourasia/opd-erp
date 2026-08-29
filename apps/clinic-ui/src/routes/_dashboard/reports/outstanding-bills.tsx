import { createFileRoute } from "@tanstack/react-router";
import { OutstandingBillsPage } from "@/modules/reports";

export const Route = createFileRoute("/_dashboard/reports/outstanding-bills")({
  staticData: { title: "Outstanding Bills" },
  component: OutstandingBillsPage,
});
