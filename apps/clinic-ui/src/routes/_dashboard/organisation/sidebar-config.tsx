import { createFileRoute } from "@tanstack/react-router";
import { SidebarConfigPage } from "@/modules/sidebar-config";

export const Route = createFileRoute("/_dashboard/organisation/sidebar-config")({
  staticData: { title: "Sidebar Configuration" },
  component: SidebarConfigPage,
});
