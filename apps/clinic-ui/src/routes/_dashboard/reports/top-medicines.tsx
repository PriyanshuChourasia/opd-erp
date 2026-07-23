import { createFileRoute } from "@tanstack/react-router";
import { TopMedicinesPage } from "@/modules/reports";

export const Route = createFileRoute("/_dashboard/reports/top-medicines")({
  staticData: { title: "Top Medicines" },
  component: TopMedicinesPage,
});
