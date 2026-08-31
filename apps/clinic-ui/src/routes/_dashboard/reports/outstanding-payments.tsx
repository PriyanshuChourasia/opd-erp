import { createFileRoute } from "@tanstack/react-router";
import { OutstandingPaymentsPage } from "@/modules/reports";

export const Route = createFileRoute("/_dashboard/reports/outstanding-payments")({
  staticData: { title: "Outstanding Payments Report" },
  component: OutstandingPaymentsPage,
});
