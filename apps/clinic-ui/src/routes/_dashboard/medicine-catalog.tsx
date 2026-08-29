import { createFileRoute } from "@tanstack/react-router";
import { MedicineCatalogPage } from "@/modules/medicine-catalog";

export const Route = createFileRoute("/_dashboard/medicine-catalog")({
  staticData: { title: "Medicine Catalog" },
  component: MedicineCatalogPage,
});
