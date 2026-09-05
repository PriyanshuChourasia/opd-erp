import { createFileRoute } from "@tanstack/react-router";
import { LedgerListPage } from "@/modules/accounting";

export const Route = createFileRoute("/_dashboard/accounting/ledgers")({
  staticData: { title: "Ledgers" },
  component: LedgerListPage,
});
