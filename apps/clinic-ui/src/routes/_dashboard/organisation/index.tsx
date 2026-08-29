import { createFileRoute } from "@tanstack/react-router";
import { CompanyPage } from "@/modules/company";

export const Route = createFileRoute("/_dashboard/organisation/")({
  staticData: { title: "Company Profile" },
  component: CompanyPage,
});
