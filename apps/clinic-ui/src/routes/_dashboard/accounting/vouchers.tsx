import { createFileRoute } from "@tanstack/react-router";
import { VoucherListPage } from "@/modules/accounting";

export const Route = createFileRoute("/_dashboard/accounting/vouchers")({
  staticData: { title: "Vouchers" },
  component: VoucherListPage,
});
