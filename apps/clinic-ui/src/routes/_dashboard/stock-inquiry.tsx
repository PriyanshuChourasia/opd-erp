import { createFileRoute } from "@tanstack/react-router";
import { StockInquiryPage } from "@/modules/stock";

export const Route = createFileRoute("/_dashboard/stock-inquiry")({
  staticData: { title: "Stock Inquiry" },
  component: StockInquiryPage,
});
