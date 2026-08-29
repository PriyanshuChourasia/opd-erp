import { createFileRoute } from "@tanstack/react-router";
import { DepartmentsPage } from "@/modules/departments";

export const Route = createFileRoute("/_dashboard/organisation/departments")({
  staticData: { title: "Departments" },
  component: DepartmentsPage,
});
