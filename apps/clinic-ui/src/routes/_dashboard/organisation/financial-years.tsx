import { createFileRoute } from "@tanstack/react-router";
import { FinancialYearPage } from "@/modules/organisation/components/financial-year-page";

export const Route = createFileRoute("/_dashboard/organisation/financial-years")({
  staticData: { title: "Financial Years" },
  component: FinancialYearPage,
});
