import { createFileRoute } from "@tanstack/react-router";
import { SettingsPage } from "@/modules/settings";

export const Route = createFileRoute("/_dashboard/settings")({
  staticData: { title: "Settings" },
  component: SettingsPage,
});
