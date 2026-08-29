import { createFileRoute } from "@tanstack/react-router";
import { FinancialYearsPage } from "@/modules/financial-years";

export const Route = createFileRoute("/_dashboard/organisation/financial-years")({
  staticData: { title: "Financial Years" },
  component: FinancialYearsPage,
});
