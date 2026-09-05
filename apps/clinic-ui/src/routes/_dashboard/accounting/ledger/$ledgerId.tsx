import { createFileRoute } from "@tanstack/react-router";
import { LedgerDetailPage } from "@/modules/accounting";

export const Route = createFileRoute("/_dashboard/accounting/ledger/$ledgerId")({
  staticData: { title: "Ledger Detail" },
  component: LedgerDetailPage,
});
